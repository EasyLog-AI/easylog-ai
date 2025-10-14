import io
import json
import re
import uuid
from collections.abc import Callable, Iterable
from datetime import datetime, time, timedelta
from typing import Any, Literal

import httpx
import pytz
from onesignal.model.notification import Notification
from openai import AsyncStream
from openai.types.chat.chat_completion import ChatCompletion
from openai.types.chat.chat_completion_chunk import ChatCompletionChunk
from openai.types.chat.chat_completion_message_param import ChatCompletionMessageParam
from PIL import Image, ImageOps
from prisma.enums import (
    health_data_point_type,
    message_content_type,
    message_role,
)
from prisma.types import health_data_pointsWhereInput, usersWhereInput
from pydantic import BaseModel, Field

from src.agents.base_agent import BaseAgent, SuperAgentConfig
from src.agents.tools.base_tools import BaseTools
from src.agents.tools.easylog_backend_tools import EasylogBackendTools
from src.agents.tools.easylog_sql_tools import EasylogSqlTools
from src.agents.utils.patient_report_data import PatientReportDataAggregator
from src.agents.utils.patient_report_generator import PatientReportGenerator
from src.lib.prisma import prisma
from src.models.chart_widget import (
    ChartWidget,
    Line,
    ZLMDataRow,
)
from src.models.multiple_choice_widget import Choice, MultipleChoiceWidget
from src.settings import settings
from src.utils.function_to_openai_tool import function_to_openai_tool


class QuestionaireQuestionConfig(BaseModel):
    question: str = Field(
        default="",
        description="The text of the question to present to the user. This should be a clear, direct question that elicits the desired information.",
    )
    instructions: str | list[dict[str, str]] = Field(
        default="",
        description="Instructions for the question. Can be either a string (legacy format) or a list of choice dictionaries with 'label' and 'value' keys for structured multiple choice questions.",
    )
    name: str = Field(
        default="",
        description="A unique identifier for this question, used for referencing the answer in prompts or logic. For example, if the question is 'What is your name?', the name could be 'user_name', allowing you to use {questionaire.user_name.answer} in templates.",
    )


class ZLMQuestionnaireAnswers(BaseModel):
    """Validated answers for the Ziektelastmeter COPD questionnaire (G1–G22)."""

    G1: int = Field(..., ge=0, le=6)
    G2: int = Field(..., ge=0, le=6)
    G3: int = Field(..., ge=0, le=6)
    G4: int = Field(..., ge=0, le=6)
    G5: int = Field(..., ge=0, le=6)
    G6: int = Field(..., ge=0, le=6)
    G7: int = Field(..., ge=0, le=6)
    G8: int = Field(..., ge=0, le=6)
    G9: int = Field(..., ge=0, le=6)
    G10: int = Field(..., ge=0, le=6)
    G11: int = Field(..., ge=0, le=6)
    G12: int = Field(..., ge=0, le=6)
    G13: int = Field(..., ge=0, le=6)
    G14: int = Field(..., ge=0, le=6)
    G15: int = Field(..., ge=0, le=6)
    G16: int = Field(..., ge=0, le=6)
    G17: int = Field(..., ge=0, le=4)
    G18: int = Field(..., ge=0, le=6)
    G19: int = Field(..., ge=0, le=6)
    G20: Literal["nooit", "vroeger12", "vroeger6_12", "vroeger6", "ja"]
    G21: float = Field(..., gt=0)
    G22: float = Field(..., gt=0)


class RoleReasoningConfig(BaseModel):
    enabled: bool = Field(
        default=False,
        description="Whether to enable reasoning for this role.",
    )
    effort: Literal["high", "medium", "low"] = Field(
        default="medium",
        description="The effort level for reasoning. Higher effort means more tokens used for reasoning.",
    )


class RoleConfig(BaseModel):
    name: str = Field(
        default="EasyLogAssistant",
        description="The display name of the role, used to identify and select this role in the system.",
    )
    prompt: str = Field(
        default="Je bent een vriendelijke assistent die helpt met het geven van demos van wat je allemaal kan",
        description="The system prompt or persona instructions for this role, defining its behavior and tone.",
    )
    model: str = Field(
        default="anthropic/claude-sonnet-4",
        description="The model identifier to use for this role, e.g., 'anthropic/claude-sonnet-4' or any model from https://openrouter.ai/models.",
    )
    tools_regex: str = Field(
        default=".*",
        description="A regular expression specifying which tools this role is permitted to use. Use '.*' to allow all tools, or restrict as needed.",
    )
    allowed_subjects: list[str] | None = Field(
        default=None,
        description="A list of subject names from the knowledge base that this role is allowed to access. If None, all subjects are allowed.",
    )
    questionaire: list[QuestionaireQuestionConfig] = Field(
        default_factory=list,
        description="A list of questions (as QuestionaireQuestionConfig) that this role should ask the user, enabling dynamic, role-specific data collection.",
    )
    reasoning: RoleReasoningConfig = Field(
        default=RoleReasoningConfig(),
        description="The reasoning configuration for this role.",
    )


class MUMCAgentConfig(BaseModel):
    roles: list[RoleConfig] = Field(
        default_factory=lambda: [
            RoleConfig(
                name="MUMCAssistant",
                prompt="Je bent een vriendelijke assistent die helpt met het geven van demos van wat je allemaal kan",
                model=r"anthropic\/claude-sonnet-4",
                tools_regex=".*",
                allowed_subjects=None,
                questionaire=[],
            )
        ]
    )
    prompt: str = Field(
        default="You can use the following roles: {available_roles}.\nYou are currently acting as the role: {current_role}.\nYour specific instructions for this role are: {current_role_prompt}.\nThis prompt may include details from a questionnaire. Use the provided tools to interact with the questionnaire if needed.\nThe current time is: {current_time}.\nRecurring tasks: {recurring_tasks}\nReminders: {reminders}\nMemories: {memories}"
    )


class MUMCAgent(BaseAgent[MUMCAgentConfig]):
    def on_init(self) -> None:
        self.configure_onesignal(
            settings.ONESIGNAL_HEALTH_API_KEY,
            settings.ONESIGNAL_HEALTH_APP_ID,
        )

        self.logger.info(f"Request headers: {self.request_headers}")

    async def get_current_role(self) -> RoleConfig:
        role = await self.get_metadata("current_role", self.config.roles[0].name)
        if role not in [role.name for role in self.config.roles]:
            role = self.config.roles[0].name

        return next(role_config for role_config in self.config.roles if role_config.name == role)

    async def _add_notification_to_chat(self, title: str, contents: str) -> None:
        """Add a notification message to the chat thread.
        
        This makes super agent notifications visible in the chat history.
        
        Args:
            title (str): The notification title
            contents (str): The notification message content
        """
        self.logger.info(f"Adding notification to chat: {title}")
        
        try:
            await prisma.messages.create(
                data={
                    "agent_class": "MUMCAgent",
                    "thread_id": self.thread_id,
                    "role": message_role.assistant,
                    "contents": {
                        "create": [
                            {
                                "type": message_content_type.text,
                                "text": f"🔔 **{title}**\n\n{contents}",
                            }
                        ]
                    },
                },
            )
            self.logger.info("Successfully added notification to chat")
        except Exception as e:
            self.logger.error(f"Error adding notification to chat: {e}")
            # Don't raise - notification was already sent via OneSignal

    def get_tools(self) -> dict[str, Callable]:
        # EasyLog-specific tools
        easylog_token = self.request_headers.get("x-easylog-bearer-token", "")
        easylog_backend_tools = EasylogBackendTools(
            bearer_token=easylog_token,
            base_url=settings.EASYLOG_API_URL,
        )

        if easylog_token:
            pass  # Token available for EasyLog tools

        easylog_sql_tools = EasylogSqlTools(
            ssh_key_path=settings.EASYLOG_SSH_KEY_PATH,
            ssh_host=settings.EASYLOG_SSH_HOST,
            ssh_username=settings.EASYLOG_SSH_USERNAME,
            db_password=settings.EASYLOG_DB_PASSWORD,
            db_user=settings.EASYLOG_DB_USER,
            db_host=settings.EASYLOG_DB_HOST,
            db_port=settings.EASYLOG_DB_PORT,
            db_name=settings.EASYLOG_DB_NAME,
        )

        # Role management tool
        async def tool_set_current_role(role: str) -> str:
            """Set the current role for the agent.

            Args:
                role (str): The role to set.

            Raises:
                ValueError: If the role is not found in the roles.
            """

            if role not in [role.name for role in self.config.roles]:
                raise ValueError(f"Role {role} not found in roles")

            await self.set_metadata("current_role", role)

            return f"Gewijzigd naar rol {role}"

        # Document search tools
        async def tool_search_documents(search_query: str) -> str:
            """Search for documents in the knowledge database using a semantic search query.

            This tool uses AI-powered filtering to return only the most relevant information,
            significantly reducing token usage while maintaining search quality.

            Args:
                search_query (str): A natural language query describing what you're looking for.
                                  For example: "information about metro systems" or "how to handle customer complaints"

            Returns:
                str: A concise summary of relevant information from the knowledge base,
                     or a message indicating no relevant information was found.
            """

            result = await self.search_documents_with_summary(
                search_query, subjects=(await self.get_current_role()).allowed_subjects
            )

            return result

        async def tool_get_document_contents(path: str) -> str:
            """Retrieve the complete contents of a specific document from the knowledge database.

            This tool allows you to access the full content of a document when you need detailed information
            about a specific topic. The document contents are returned in JSON format, making it easy to
            parse and work with the data programmatically.

            Args:
                path (str): The unique path or identifier of the document you want to retrieve.
                          This is typically obtained from the search results of tool_search_documents.

            Returns:
                str: A JSON string containing the complete document contents, including all properties
                     and metadata. The JSON is formatted with proper string serialization for all data types.
            """
            return json.dumps(await self.get_document(path), default=str)

        # Questionnaire tools
        async def tool_answer_questionaire_question(question_name: str, answer: str) -> str:
            """Answer a question from the questionaire.

            Args:
                question_name (str): The name of the question to answer.
                answer (str): The answer to the question.
            """

            await self.set_metadata(question_name, answer)

            return f"Answer to {question_name} set to {answer}"

        async def tool_get_questionaire_answer(question_name: str) -> str:
            """Get the answer to a question from the questionaire.

            Args:
                question_name (str): The name of the question to get the answer to.

            Returns:
                str: The answer to the question.
            """
            return await self.get_metadata(question_name, "[not answered]")

        async def tool_calculate_zlm_scores() -> dict[str, float]:
            """Calculate Ziektelastmeter COPD domain scores based on previously
            answered questionnaire values. The questionnaire must be complete before calling this tool.

            Upon successful calculation the individual domain scores **and** the
            calculated BMI Value are persisted as memories using
            ``tool_store_memory``.
            """

            # --------------------------------------------------------------
            # 1. Gather & validate answers
            # --------------------------------------------------------------
            question_codes = [f"G{i}" for i in range(1, 23)]  # g1 … g22 inclusive

            raw_answers: dict[str, str] = {}
            missing: list[str] = []
            for code in question_codes:
                ans = await tool_get_questionaire_answer(code)
                if ans in {"[not answered]", None, ""}:
                    missing.append(code)
                else:
                    raw_answers[code] = ans

            if missing:
                raise ValueError("Missing questionnaire answers for: " + ", ".join(missing))

            # --------------------------------------------------------------
            # 2. Parse & validate using Pydantic model
            # --------------------------------------------------------------
            def _to_int(val: str) -> int:
                try:
                    return int(val)
                except Exception as exc:
                    raise ValueError(f"Expected integer, got '{val}' for question.") from exc

            def _to_float(val: str) -> float:
                try:
                    # Replace comma with dot for Dutch decimal notation (e.g., "78,6" -> "78.6")
                    normalized_val = val.strip().replace(",", ".")
                    return float(normalized_val)
                except Exception as exc:
                    raise ValueError(f"Expected float, got '{val}' for question.") from exc

            parsed: dict[str, Any] = {
                # ints 0-6 unless specified
                **{f"G{i}": _to_int(raw_answers[f"G{i}"]) for i in range(1, 20) if i != 20},
                # g20 remains str literal
                "G20": raw_answers["G20"].strip().lower(),
                # floats
                "G21": _to_float(raw_answers["G21"]),
                "G22": _to_float(raw_answers["G22"]),
            }

            answers = ZLMQuestionnaireAnswers(**parsed)

            # --------------------------------------------------------------
            # 3. Domain score computation
            # --------------------------------------------------------------
            from statistics import mean

            def _avg(vals: list[int]) -> float:
                return float(mean(vals)) if vals else 0.0

            scores: dict[str, float] = {
                "longklachten": _avg([answers.G12, answers.G13, answers.G15, answers.G16]),
                "longaanvallen": float(answers.G17),
                "lichamelijke_beperkingen": _avg([answers.G5, answers.G6, answers.G7]),
                "vermoeidheid": float(answers.G1),
                "nachtrust": float(answers.G2),
                "gevoelens_emoties": _avg([answers.G3, answers.G11, answers.G14]),
                "seksualiteit": float(answers.G10),
                "relaties_en_werk": _avg([answers.G8, answers.G9]),
                "medicijnen": float(answers.G4),
                "bewegen": float(answers.G18),
                "alcohol": float(answers.G19),
            }

            # BMI-related score
            height_m = answers.G22 / 100.0
            bmi_value = answers.G21 / (height_m**2)
            if bmi_value < 18.5:  # Ondergewicht
                gewicht_score = 6
            elif bmi_value < 19:
                gewicht_score = 5
            elif bmi_value < 19.5:
                gewicht_score = 4
            elif bmi_value < 20:
                gewicht_score = 3
            elif bmi_value < 20.5:
                gewicht_score = 2
            elif bmi_value < 21:
                gewicht_score = 1
            elif bmi_value < 25:  # Normaal gewicht
                gewicht_score = 0
            elif bmi_value < 27:
                gewicht_score = 1
            elif bmi_value < 29:
                gewicht_score = 2
            elif bmi_value < 31:
                gewicht_score = 3
            elif bmi_value < 33:
                gewicht_score = 4
            elif bmi_value < 35:
                gewicht_score = 5
            else:
                gewicht_score = 6

            scores["gewicht_bmi"] = float(gewicht_score)

            # Scale scores that are not already 0-6 to 0-6
            scores["longaanvallen"] = scores["longaanvallen"] * 1.5
            # score 0-3 to 0-6

            # Roken score
            roken_map = {
                "nooit": 0,
                "vroeger12": 1,
                "vroeger6_12": 2,
                "vroeger6": 3,
                "ja": 6,
            }
            scores["roken"] = float(roken_map[answers.G20])

            # --------------------------------------------------------------
            # 4. Persist memories
            # --------------------------------------------------------------
            label_map = {
                "longklachten": "Long klachten",
                "longaanvallen": "Long aanvallen",
                "lichamelijke_beperkingen": "Lichamelijke beperkingen",
                "vermoeidheid": "Vermoeidheid",
                "nachtrust": "Nachtrust",
                "gevoelens_emoties": "Emoties",
                "seksualiteit": "Seksualiteit",
                "relaties_en_werk": "Relaties en werk",
                "medicijnen": "Medicijnen",
                "gewicht_bmi": "BMI",
                "bewegen": "Bewegen",
                "alcohol": "Alcohol",
                "roken": "Roken",
            }

            today_str = datetime.now().strftime("%d-%m-%Y")

            # Store domain scores
            for key, score in scores.items():
                label = label_map.get(key, key.title())
                mem = f"ZLM-Score-{label} {today_str}: Score = {score}"
                await tool_store_memory(mem)

            mem = f"ZLM-BMI-meta_value {today_str} {bmi_value}"
            await tool_store_memory(mem)

            return scores

        def tool_create_zlm_chart(
            language: Literal["nl", "en"],
            data: list[ZLMDataRow],
        ) -> ChartWidget:
            """
            Creates a ZLM (Ziektelastmeter COPD) balloon chart using a predefined ZLM color scheme.
            The chart visualizes scores, expecting values in the 0-6 range. Where 0 is good and 6 is the worst
            The y-axis label is derived from the `y_label` field of the first data item.

            Args:
                language: The language for chart title and description ('nl' or 'en').
                data: A list of `ZLMDataRow` objects for the chart. Each item represents a
                      category on the x-axis and its corresponding scores.
                      - `x_value` (str): The name of the category (e.g., "Algemeen").
                      - `y_current` (float): The current score (0-6).
                      - `y_old` (float | None): Optional. The previous score the patient had (0-6).
                      - `y_label` (str): The label for the y-axis, typically including units
                                         (e.g., "Score (0-6)"). This is used for the overall
                                         Y-axis label of the chart.
                      - `meta` (str | None): Optional. Extra information for this data point shown to the user. Add the BMI value here for the BMI score data point.

            Returns:
                A ChartWidget object configured as a balloon chart.

            Raises:
                ValueError: If the `data` list is empty.

            Example:
                ```python
                # Assuming ZLMDataRow is imported from src.models.chart_widget
                data = [
                    ZLMDataRow(x_value="Physical pain", y_current=7.5, y_old=6.0, y_label="Score (0-6)"),
                    ZLMDataRow(x_value="Mental health", y_current=8.2, y_old=8.5, y_label="Score (0-6)"),
                    ZLMDataRow(x_value="Social support", y_current=3.0, y_label="Schaal (0-5)"),  # No old value
                ]
                chart_widget = tool_create_zlm_chart(language="nl", data=data)
                ```
            """

            title = "Resultaten ziektelastmeter" if language == "nl" else "Disease burden results"

            # Check that data list is at least 1 or more,.
            if len(data) < 1:
                raise ValueError("Data list must be at least 1 or more.")

            # Convert dictionaries to ZLMDataRow objects if needed
            return ChartWidget.create_balloon_chart(
                title=title,
                data=data,
            )

        def tool_create_bar_chart(
            title: str,
            data: list[dict[str, Any]],
            x_key: str,
            y_keys: list[str],
            horizontal_lines: list[dict[str, Any]] | None = None,
            description: str | None = None,
            y_axis_domain_min: float | None = None,
            y_axis_domain_max: float | None = None,
            height: int = 400,
        ) -> ChartWidget:
            """Create a bar chart.

            Notes for the model:
            • If you provide ``custom_color_role_map`` it **must** be a JSON object, not a
              JSON-encoded string

            ## Data Structure Requirements

            The `data` parameter expects a list of dictionaries where:
            - Each dictionary represents one category (x-axis position)
            - The `x_key` field contains the category name/label and MUST be a string
            - Each `y_key` field contains either:
              1. **Simple value**: A direct number (e.g., `"sales": 1500`)
              2. **Structured value**: `{"value": <number>, "colorRole": "<role_name>"}`

            ### Simple Data Example:
            data = [{"month": "Jan", "sales": 1000, "returns": 50}, {"month": "Feb", "sales": 1200, "returns": 75}]


            ### Advanced Data with Color Roles:
            data = [
                {
                    "month": "Jan",
                    "sales": {"value": 1000, "colorRole": "success"},
                    "returns": {"value": 50, "colorRole": "warning"},
                },
                {
                    "month": "Feb",
                    "sales": {"value": 1200, "colorRole": "success"},
                    "returns": {"value": 75, "colorRole": "neutral"},
                },
            ]


            ## Color System

            ### Built-in Color Roles (use when custom_color_role_map=None):
            - `"success"`: Light green - for positive metrics, achievements
            - `"warning"`: Light orange/red - for alerts, issues requiring attention
            - `"neutral"`: Light blue - for standard/baseline metrics
            - `"info"`: Light yellow - for informational data
            - `"primary"`: Light purple - for primary focus areas
            - `"accent"`: Light cyan - for special highlights
            - `"muted"`: Light gray - for less important data

            ## Horizontal Lines

            The `horizontal_lines` parameter accepts a list of dictionaries, all defining a reference line:
            ```python
            horizontal_lines = [
                {"value": 100, "label": "Target", "color": "#e8f5e8"},
                {"value": 80, "label": "Minimum", "color": "#ffe4e1"},
                {"value": 50},  # Just value, will use default label and color
            ]
            ```

            Required fields:
            - `value` (float): The y-axis value where the line is drawn

            Optional fields:
            - `label` (str): Text label for the line (defaults to None)
            - `color` (str): HEX color code (defaults to black)

            ## Complete Usage Examples

            ### Basic Sales Chart:
            chart = tool_create_bar_chart(
                title="Monthly Sales Performance",
                data=[
                    {"month": "Jan", "sales": 15000, "target": 12000},
                    {"month": "Feb", "sales": 18000, "target": 15000},
                    {"month": "Mar", "sales": 14000, "target": 16000},
                ],
                horizontal_lines=[
                    {"value": 15000, "label": "Target", "color": "#e8f5e8"},
                    {"value": 10000, "label": "Minimum", "color": "#ffe4e1"},
                ],
                x_key="month",
                y_keys=["sales", "target"],
                description="Q1 2024 sales vs targets",
            )

            ### Advanced Chart with Color Coding:
            chart = tool_create_bar_chart(
                title="Department Performance Dashboard",
                data=[
                    {
                        "department": "Sales",
                        "performance": {"value": 95, "colorRole": "success"},
                        "budget_usage": {"value": 80, "colorRole": "neutral"},
                    },
                    {
                        "department": "Marketing",
                        "performance": {"value": 75, "colorRole": "warning"},
                        "budget_usage": {"value": 120, "colorRole": "warning"},
                    },
                ],
                x_key="department",
                y_keys=["performance", "budget_usage"],
                horizontal_lines=[
                    {"value": 100, "label": "Target", "color": "#e8f5e8"},
                    {"value": 50, "label": "Minimum", "color": "#ffe4e1"},
                ],
                y_axis_domain_min=0,
                y_axis_domain_max=150,
                height=500,
            )

            Args:
                title (str): The main title displayed above the chart.

                data (list[dict[str, Any]]): List of data objects. Each object represents one
                    x-axis category. See examples above for structure.

                x_key (str): The dictionary key that contains the x-axis category labels
                    (e.g., "month", "department", "product").

                y_keys (list[str]): List of dictionary keys for the data series to plot as bars.
                    Each key becomes a separate bar series (e.g., ["sales", "returns"]).
                horizontal_lines (list[dict[str, Any]] | None): Optional reference lines drawn across
                    the chart. Each dictionary should contain:
                    - "value" (float, required): The y-axis value where the line is drawn
                    - "label" (str, optional): Text label for the line
                    - "color" (str, optional): HEX color code (e.g., "#000000")

                description (str | None): Optional subtitle/description shown below the title.

                y_axis_domain_min (float | None): Optional minimum value for y-axis scale.
                    Forces chart to start at this value instead of auto-scaling.

                y_axis_domain_max (float | None): Optional maximum value for y-axis scale.
                    Forces chart to end at this value instead of auto-scaling.

                height (int): Chart height in pixels. Defaults to 400.
                    Recommended range: 300-800 pixels.

            Returns:
                ChartWidget: A configured chart widget ready for display in the UI.
                The widget includes all styling, data, and interactive features.

            Raises:
                ValueError: If required keys are missing from data objects, or if color roles
                    are invalid when using built-in color system, or if horizontal_lines
                    have invalid structure.

            Common mistakes:
                - x_key is not a string
                - y_keys are not strings
            """
            # ------------------------------------------------------------------
            # Validate / coerce custom_color_role_map
            # ------------------------------------------------------------------

            # Parse horizontal_lines from dictionaries to Line objects
            parsed_horizontal_lines: list[Line] | None = None
            if horizontal_lines is not None:
                import ast
                import json

                # Step 1 – normalise input to a list of dictionaries
                normalised_lines: list[dict[str, Any]] = []

                # Helper to convert a single string to dict or list
                def _parse_str_to_obj(raw: str) -> list[dict[str, Any]]:
                    raw_s = raw.strip()
                    try:
                        obj = json.loads(raw_s)
                    except json.JSONDecodeError:
                        obj = ast.literal_eval(raw_s)

                    if isinstance(obj, list):
                        return obj  # Expect list[dict]
                    if isinstance(obj, dict):
                        return [obj]
                    raise ValueError("horizontal_lines string must decode to a dict or list of dicts")

                if isinstance(horizontal_lines, str):
                    normalised_lines.extend(_parse_str_to_obj(horizontal_lines))
                elif isinstance(horizontal_lines, list):
                    for idx, item in enumerate(horizontal_lines):
                        if isinstance(item, dict):
                            normalised_lines.append(item)
                        elif isinstance(item, str):
                            normalised_lines.extend(_parse_str_to_obj(item))
                        else:
                            raise ValueError(f"horizontal_lines[{idx}] must be a dict or string, got {type(item)}")
                else:
                    raise ValueError("horizontal_lines must be a list, string, or None")

                # Step 2 – validate dictionaries and convert to Line objects
                parsed_horizontal_lines = []
                for i, line_dict in enumerate(normalised_lines):
                    if not isinstance(line_dict, dict):
                        raise ValueError(
                            f"horizontal_lines[{i}] must be a dictionary after parsing, got {type(line_dict)}"
                        )

                    if "value" not in line_dict:
                        raise ValueError(f"horizontal_lines[{i}] missing required 'value' field")

                    try:
                        value = float(line_dict["value"])
                    except (ValueError, TypeError) as e:
                        raise ValueError(
                            f"horizontal_lines[{i}] 'value' must be numeric, got {line_dict['value']}"
                        ) from e

                    label = line_dict.get("label")
                    color = line_dict.get("color")

                    # Validate color format if provided
                    if color is not None and not isinstance(color, str):
                        raise ValueError(f"horizontal_lines[{i}] 'color' must be a string, got {type(color)}")

                    parsed_horizontal_lines.append(Line(value=value, label=label, color=color))

            return ChartWidget.create_bar_chart(
                title=title,
                data=data,
                x_key=x_key,
                y_keys=y_keys,
                description=description,
                height=height,
                horizontal_lines=parsed_horizontal_lines,
                y_axis_domain_min=y_axis_domain_min,
                y_axis_domain_max=y_axis_domain_max,
            )

        def tool_create_line_chart(
            title: str,
            data: list[dict[str, Any]],
            x_key: str,
            y_keys: list[str],
            y_labels: list[str] | None = None,
            custom_series_colors_palette: list[str] | None = None,
            horizontal_lines: list[Line] | None = None,
            description: str | None = None,
            height: int = 600,
            y_axis_domain_min: float | None = None,
            y_axis_domain_max: float | None = None,
        ) -> ChartWidget:
            """
            Creates a line chart with customizable line colors and optional horizontal lines.
            Each line series will have a distinct color.

            Data Structure for `data` argument:
            Each item in the `data` list is a dictionary representing a point on the x-axis.
            For each `y_key` you want to plot, its value in the dictionary MUST be the
            direct numerical value for that data point (or null for missing data).

            Line Colors:
            The color of the lines themselves is determined by `custom_series_colors_palette`.
            If `custom_series_colors_palette` is not provided, a default palette is used.
            The Nth line (corresponding to the Nth key in `y_keys`) will use the Nth color from this palette.

            Args:
                title (str): Chart title.
                data (list[dict[str, Any]]): List of data objects as described above.
                    Example:
                    [
                        {{"date": "2024-01-01", "temp": 10, "humidity": 60}},
                        {{"date": "2024-01-02", "temp": 12, "humidity": 65}},
                        {{"date": "2024-01-03", "temp": 9, "humidity": null}} // null for missing humidity
                    ]
                **Important** Do not add colors in the data object for line charts.
                x_key (str): Key in data objects for the x-axis (e.g., 'date').
                y_keys (list[str]): Keys for y-axis values (e.g., ['temp', 'humidity']).
                y_labels (list[str] | None): Optional labels for y-axis series. If None,
                                            `y_keys` are used. Must match `y_keys` length.
                custom_series_colors_palette (list[str] | None): Optional. A list of HEX color strings
                                     to define the colors for each **line series**.
                                     Example: ["#007bff", "#28a745"] for two lines.
                horizontal_lines (list[Line] | None): Optional. List of `Line` objects for horizontal lines.
                                     See `tool_create_bar_chart` for `Line` model details.
                                     Example: `[Line(value=10, label="Threshold")]`
                description (str | None): Optional chart description.
                height (int): Chart height in pixels. Defaults to 400.
                y_axis_domain_min (float | None): Optional. Sets the minimum value for the Y-axis scale.
                y_axis_domain_max (float | None): Optional. Sets the maximum value for the Y-axis scale.
            Returns:
                A ChartWidget object configured as a line chart.
            """
            if y_labels is not None and len(y_keys) != len(y_labels):
                raise ValueError("If y_labels are provided for line chart, they must match the length of y_keys.")

            # Basic validation for data structure (can be enhanced)
            for item in data:
                if x_key not in item:
                    raise ValueError(f"Line chart data item missing x_key '{x_key}': {item}")
                for y_key in y_keys:
                    if y_key in item and not isinstance(item[y_key], (int, float, type(None))):
                        if isinstance(item[y_key], str):  # Allow string if it's meant to be a number
                            try:
                                float(item[y_key])
                            except ValueError:
                                raise ValueError(
                                    f"Line chart data for y_key '{y_key}' has non-numeric value '{item[y_key]}'. Must be number or null."
                                )
                        else:
                            raise ValueError(
                                f"Line chart data for y_key '{y_key}' has non-numeric value '{item[y_key]}'. Must be number or null."
                            )

            return ChartWidget.create_line_chart(
                title=title,
                data=data,
                x_key=x_key,
                y_keys=y_keys,
                y_labels=y_labels,
                description=description,
                height=height,
                horizontal_lines=horizontal_lines,
                custom_series_colors_palette=custom_series_colors_palette,
                y_axis_domain_min=y_axis_domain_min,
                y_axis_domain_max=y_axis_domain_max,
            )

        # Interaction tools
        def tool_ask_multiple_choice(question: str, choices: list[dict[str, str]]) -> tuple[MultipleChoiceWidget, bool]:
            """Asks the user a multiple-choice question with distinct labels and values.
                When using this tool, you must not repeat the same question or answers in text unless asked to do so by the user.
                This widget already presents the question and choices to the user.

            Args:
                question: The question to ask.
                choices: A list of choice dictionaries, each with a 'label' (display text)
                         and a 'value' (internal value). Example:
                         [{'label': 'Yes', 'value': '0'}, {'label': 'No', 'value': '1'}]

            Returns:
                A MultipleChoiceWidget object representing the question and the choices.

            Raises:
                ValueError: If a choice dictionary is missing 'label' or 'value'.
            """
            parsed_choices = []
            for choice_dict in choices:
                if "label" not in choice_dict or "value" not in choice_dict:
                    raise ValueError("Each choice dictionary must contain 'label' and 'value' keys.")
                parsed_choices.append(Choice(label=choice_dict["label"], value=choice_dict["value"]))

            return MultipleChoiceWidget(
                question=question,
                choices=parsed_choices,
                selected_choice=None,
            ), True

        # Image tools
        def tool_download_image(url: str) -> Image.Image:
            """Download an image from a URL.

            Args:
                url (str): The URL of the image to download.

            Returns:
                Image.Image: The downloaded image.

            Raises:
                httpx.HTTPStatusError: If the download fails.
                PIL.UnidentifiedImageError: If the content is not a valid image.
                Exception: For other potential errors during download or processing.
            """
            try:
                response = httpx.get(url, timeout=10)
                response.raise_for_status()

                image = Image.open(io.BytesIO(response.content))

                ImageOps.exif_transpose(image, in_place=True)

                if image.mode in ("RGBA", "LA", "P"):
                    image = image.convert("RGB")

                max_size = 768
                if image.width > max_size or image.height > max_size:
                    ratio = min(max_size / image.width, max_size / image.height)
                    new_size = (int(image.width * ratio), int(image.height * ratio))
                    self.logger.info(f"Resizing image from {image.width}x{image.height} to {new_size[0]}x{new_size[1]}")
                    image = image.resize(new_size, Image.Resampling.LANCZOS)

                return image

            except httpx.HTTPStatusError:
                raise
            except Image.UnidentifiedImageError:
                raise
            except Exception:
                raise

        # Schedule and reminder tools
        async def tool_set_recurring_task(cron_expression: str, task: str) -> str:
            """Set a schedule for a task. The tasks will be part of the system prompt, so you can use them to figure out what needs to be done today.

            Args:
                cron_expression (str): The cron expression to set.
                task (str): The task to set the schedule for.
            """

            existing_tasks: list[dict[str, str]] = await self.get_metadata("recurring_tasks", [])

            existing_tasks.append(
                {
                    "id": str(uuid.uuid4())[:8],
                    "cron_expression": cron_expression,
                    "task": task,
                }
            )

            await self.set_metadata("recurring_tasks", existing_tasks)

            return f"Schedule set for {task} with cron expression {cron_expression}"

        async def tool_add_reminder(date: str, message: str) -> str:
            """Add a reminder.

            Args:
                date (str): The date and time of the reminder in ISO 8601 format.
                message (str): The message to remind the user about.
            """

            existing_reminders: list[dict[str, str]] = await self.get_metadata("reminders", [])

            existing_reminders.append(
                {
                    "id": str(uuid.uuid4())[:8],
                    "date": date,
                    "message": message,
                }
            )

            await self.set_metadata("reminders", existing_reminders)

            return f"Reminder added for {message} at {date}"

        async def tool_remove_recurring_task(id: str) -> str:
            """Remove a recurring task.

            Args:
                id (str): The ID of the task to remove.
            """
            existing_tasks: list[dict[str, str]] = await self.get_metadata("recurring_tasks", [])

            existing_tasks = [task for task in existing_tasks if task["id"] != id]

            await self.set_metadata("recurring_tasks", existing_tasks)

            return f"Recurring task {id} removed"

        async def tool_remove_reminder(id: str) -> str:
            """Remove a reminder.

            Args:
                id (str): The ID of the reminder to remove.
            """
            existing_reminders: list[dict[str, str]] = await self.get_metadata("reminders", [])

            existing_reminders = [reminder for reminder in existing_reminders if reminder["id"] != id]

            await self.set_metadata("reminders", existing_reminders)

            return f"Reminder {id} removed"

        # Memory tools
        async def tool_store_memory(memory: str) -> str:
            """Store a memory with automatic timestamp.

            Args:
                memory (str): The memory to store.
            """
            amsterdam_tz = pytz.timezone("Europe/Amsterdam")
            timestamp = datetime.now(amsterdam_tz).strftime("%Y-%m-%d %H:%M")
            
            # Add timestamp to memory if not already present
            if "(datum:" not in memory.lower():
                memory_with_date = f"{memory} (datum: {timestamp})"
            else:
                memory_with_date = memory

            memories = await self.get_metadata("memories", [])
            memories.append({"id": str(uuid.uuid4())[0:8], "memory": memory_with_date})
            await self.set_metadata("memories", memories)

            return f"Memory stored: {memory_with_date}"

        async def tool_get_memory(id: str) -> str:
            """Get a memory.

            Args:
                id (str): The id of the memory to get.
            """
            memories = await self.get_metadata("memories", [])
            memory = next((m for m in memories if m["id"] == id), None)
            if memory is None:
                return "[not stored]"

            return memory["memory"]

        async def tool_send_notification(
            title: str, 
            contents: str,
            reminder_id: str | None = None,
            task_id: str | None = None,
        ) -> str:
            """Send a notification.

            Args:
                title (str): The title of the notification.
                contents (str): The text to send in the notification.
                reminder_id (str | None): Optional ID of the reminder being sent (for cleanup).
                task_id (str | None): Optional ID of the recurring task being sent (for tracking).
            """
            onesignal_id = self.request_headers.get("x-onesignal-external-user-id") or await self.get_metadata(
                "onesignal_id", None
            )

            assistant_field_name = self.request_headers.get("x-assistant-field-name") or await self.get_metadata(
                "assistant_field_name", None
            )

            self.logger.info(f"Sending notification to {onesignal_id}")

            if onesignal_id is None:
                return "No onesignal id found"

            if assistant_field_name is None:
                return "No assistant field name found"

            self.logger.info(f"Sending notification to {onesignal_id} with app id {settings.ONESIGNAL_HEALTH_APP_ID}")
            notification = Notification(
                target_channel="push",
                channel_for_external_user_ids="push",
                app_id=settings.ONESIGNAL_HEALTH_APP_ID,
                include_external_user_ids=[onesignal_id],
                contents={"en": contents},
                headings={"en": title},
                data={"type": "chat", "assistantFieldName": assistant_field_name},
            )

            self.logger.info(f"Notification: {notification}")
            try:
                response = await self.one_signal.send_notification(notification)
            except Exception as e:
                self.logger.error(f"Error sending notification: {e}")
                return "Error sending notification"

            self.logger.info(f"Notification response: {response}")

            # Automatic cleanup: remove reminder after sending
            if reminder_id:
                await self._remove_reminder(reminder_id)
            
            # Add notification to history with tracking IDs
            await self._add_notification_record(title, contents, task_id=task_id, reminder_id=reminder_id)

            # Legacy notification tracking (kept for backwards compatibility)
            notifications = await self.get_metadata("notifications", [])

            # Keep only today's notifications
            today = datetime.now(pytz.timezone("Europe/Amsterdam")).date()
            filtered_notifications = []
            for notif in notifications:
                try:
                    sent_date = datetime.fromisoformat(notif["sent_at"]).date()
                    if sent_date == today:
                        filtered_notifications.append(notif)
                except (ValueError, KeyError):
                    # Keep notification if we can't parse the date
                    filtered_notifications.append(notif)

            # Add new notification (legacy format - will be phased out)
            filtered_notifications.append(
                {
                    "id": response["id"],
                    "title": title,
                    "contents": contents,
                    "sent_at": datetime.now(pytz.timezone("Europe/Amsterdam")).isoformat(),
                }
            )

            await self.set_metadata("notifications", filtered_notifications)

            # Add notification to chat so it's visible in message history
            await self._add_notification_to_chat(title, contents)

            return "Notification sent"

        async def tool_get_steps_data(
            date_from: str | datetime,
            date_to: str | datetime,
            timezone: str | None = None,
            aggregation: str | None = None,
        ) -> list[dict[str, Any]]:
            """Retrieve a user’s step counts with optional time aggregation.

            Parameters
            ----------
            date_from, date_to : str | datetime
                Inclusive ISO-8601 strings **or** ``datetime`` objects that define the
                query window in the *local* timezone (see ``timezone``).

            timezone : str | None, default ``"Europe/Amsterdam"``
                IANA timezone name used to interpret naïve datetimes **and** for the
                timestamps returned by this tool.

            aggregation : {"quarter", "hour", "day", None}, default ``day``
                • ``"quarter"`` → 15-minute buckets
                • ``"hour"``     → hourly totals
                • ``"day"``      → daily totals
                • ``None``/empty → **defaults to daily** (same as ``"day"``)

            The granularity increases from *quarter* (smallest) → *hour* → *day*.

            Returns
            -------
            list[dict[str, Any]]
                A list **capped at 300 rows**. Each item contains:
                ``created_at`` – ISO timestamp in requested timezone
                ``value`` – summed step count for the bucket (aggregated) **or** the
                original ``value`` plus ``date_from``/``date_to`` (raw mode).

            Notes
            -----
            • The result set is limited to **max 300 rows** to protect the UI and
              network usage. If the database returns more rows, only the first 300
              (ordered chronologically) are returned.
            """

            from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

            # ------------------------------------------------------------------ #
            # 0. Normalise / validate aggregation parameter                     #
            # ------------------------------------------------------------------ #
            agg_raw = (aggregation or "").strip().lower()

            if agg_raw in {"", "none"}:
                aggregation_normalised = "day"
            elif agg_raw in {"hour", "hourly"}:
                aggregation_normalised = "hour"
            elif agg_raw in {"day", "daily"}:
                aggregation_normalised = "day"
            elif agg_raw in {"quarter", "quarterly", "q", "15m", "15min", "15"}:
                aggregation_normalised = "quarter"
            else:
                raise ValueError("Invalid aggregation value. Use one of: 'quarter', 'hour', 'day', or None/empty.")

            aggregation = aggregation_normalised  # overwrite with canonical value

            # ------------------------------------------------------------------ #
            # 1. Resolve / validate timezone                                     #
            # ------------------------------------------------------------------ #
            tz_name = (timezone or "Europe/Amsterdam").strip()
            if tz_name in {"CET", "CEST"}:
                tz_name = "Europe/Amsterdam"

            try:
                tz = ZoneInfo(tz_name)
            except ZoneInfoNotFoundError as exc:
                raise ValueError(f"Invalid timezone '{timezone}'. Please provide a valid IANA name.") from exc

            UTC = ZoneInfo("UTC")  # single UTC instance for reuse

            # ------------------------------------------------------------------ #
            # 2. Parse inputs → timezone-aware datetimes                         #
            # ------------------------------------------------------------------ #
            def _parse_input(val: str | datetime) -> datetime:
                """ISO string → datetime; naïve → attach local tz."""
                dt_obj = datetime.fromisoformat(val) if isinstance(val, str) else val
                if dt_obj.tzinfo is None:  # treat naïve as local
                    dt_obj = dt_obj.replace(tzinfo=tz)
                return dt_obj

            date_from_dt = _parse_input(date_from)
            date_to_dt = _parse_input(date_to)

            extra = ""
            if date_from_dt.year < datetime.now(pytz.timezone("Europe/Amsterdam")).year:
                raise ValueError("Date from is in the past")

            # Expand “whole-day” range (00:00 → 23:59:59.999999)
            if (
                date_from_dt.date() == date_to_dt.date()
                and date_from_dt.timetz() == time(0, tzinfo=tz)
                and date_to_dt.timetz() == time(0, tzinfo=tz)
            ):
                date_to_dt = date_to_dt.replace(hour=23, minute=59, second=59, microsecond=999999)

            # Convert to **UTC** for querying
            date_from_utc = date_from_dt.astimezone(UTC)
            date_to_utc = date_to_dt.astimezone(UTC)

            # ------------------------------------------------------------------ #
            # 3. Fetch user id                                                   #
            # ------------------------------------------------------------------ #
            external_user_id = self.request_headers.get("x-onesignal-external-user-id")
            if external_user_id is None:
                raise ValueError("User ID not provided and not found in agent context.")

            user = await prisma.users.find_first(where=usersWhereInput(external_id=external_user_id))
            if user is None:
                raise ValueError("User not found")

            # ------------------------------------------------------------------ #
            # 4. Retrieve raw datapoints                                         #
            # ------------------------------------------------------------------ #
            steps_data = await prisma.health_data_points.find_many(
                where=health_data_pointsWhereInput(
                    user_id=user.id,
                    type=health_data_point_type.steps,
                    date_from={"gte": date_from_utc},
                    date_to={"lte": date_to_utc},
                ),
                order={"created_at": "asc"},
                take=300,
            )
            if not steps_data:
                return []

            # ------------------------------------------------------------------ #
            # 5. Helper: convert any str/naïve dt → ISO in *local* timezone      #
            # ------------------------------------------------------------------ #
            def _iso_local(val: str | datetime) -> str:
                dt_obj = datetime.fromisoformat(val) if isinstance(val, str) else val
                if dt_obj.tzinfo is None:  # DB can return naïve UTC
                    dt_obj = dt_obj.replace(tzinfo=UTC)
                return dt_obj.astimezone(tz).isoformat()

            # ------------------------------------------------------------------ #
            # 6. Aggregation                                                     #
            # ------------------------------------------------------------------ #
            if aggregation in {"hour", "day"}:
                rows: list[dict[str, Any]] = await prisma.query_raw(
                    f"""
                    SELECT
                        date_trunc('{aggregation}', date_from AT TIME ZONE 'UTC') AS bucket,
                        SUM(value)::int                                          AS total
                    FROM   health_data_points
                    WHERE  user_id  = $1::uuid
                    AND  type     = 'steps'
                    AND  date_from >= $2::timestamptz
                    AND  date_to   <= $3::timestamptz
                    GROUP  BY bucket
                    ORDER  BY bucket
                    LIMIT 300
                    """,
                    user.id,
                    date_from_utc,
                    date_to_utc,
                )

                return [
                    {
                        "created_at": _iso_local(row["bucket"]),
                        "value": row["total"],
                    }
                    for row in rows
                ]

            # ------------------------------------------------------------------ #
            # 6b. Quarter-hour aggregation                                       #
            # ------------------------------------------------------------------ #
            if aggregation == "quarter":
                from collections import defaultdict

                bucket_totals: dict[str, int] = defaultdict(int)

                for dp in steps_data:
                    start_dt = _parse_input(dp.date_from)
                    local_dt = start_dt.astimezone(tz)
                    floored_minute = (local_dt.minute // 15) * 15
                    bucket_dt = local_dt.replace(minute=floored_minute, second=0, microsecond=0)
                    bucket_key = bucket_dt.isoformat()
                    bucket_totals[bucket_key] += dp.value

                sorted_rows = sorted(bucket_totals.items())[:300]

                return [{"created_at": key, "value": total} for key, total in sorted_rows]

            # ------------------------------------------------------------------ #
            # 7. Raw datapoints                                                  #
            # ------------------------------------------------------------------ #
            return [
                {
                    "created_at": _iso_local(dp.created_at),
                    "date_from": _iso_local(dp.date_from),
                    "date_to": _iso_local(dp.date_to),
                    "value": dp.value,
                }
                for dp in steps_data
            ]

        async def tool_generate_patient_report(
            reason: str,
            period_days: int = 30
        ) -> tuple[str, bool]:
            """Genereer een professioneel patiënt verslag als PDF.

            Dit verslag bevat een overzicht van de patient zijn/haar:
            - Profiel informatie (leeftijd, diagnose, comorbiditeit)
            - ZLM (Ziektelast) scores
            - Doelen en voortgang
            - Activiteit (stappen) data
            - Medicatie informatie

            De gegenereerde PDF kan door de patient gedownload en gedeeld worden
            met bijvoorbeeld hun arts.

            Args:
                reason (str): De aanleiding voor het verslag (VERPLICHT). Bijvoorbeeld:
                             "Bezoek arts", "Bezoek POH", "Anders".
                period_days (int): OPTIONEEL - Gebruik altijd de default waarde van 30 dagen.
                                  Vraag NOOIT naar deze parameter.

            Returns:
                tuple[str, bool]: (JSON widget data, True) for widget rendering

            Raises:
                ValueError: Als er geen patient data beschikbaar is
            """
            try:
                # Get OneSignal ID from headers
                onesignal_id = self.request_headers.get("x-onesignal-external-user-id")
                if not onesignal_id:
                    raise ValueError("Kan patient ID niet vinden")

                # Aggregate patient data
                aggregator = PatientReportDataAggregator(
                    thread_id=self.thread_id, onesignal_id=onesignal_id
                )
                report_data = await aggregator.aggregate_report_data(
                    period_days=period_days,
                    reason=reason
                )

                # Generate PDF
                generator = PatientReportGenerator()
                pdf_bytes = generator.generate_report(report_data)

                # Convert PDF to base64
                import base64
                pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')

                # Generate filename
                report_id = str(uuid.uuid4())
                patient_name_safe = report_data["patient_name"].replace(" ", "_")
                timestamp = datetime.now(pytz.timezone("Europe/Amsterdam")).strftime("%Y-%m")
                filename = f"COPD_Verslag_{patient_name_safe}_{timestamp}_{report_id[:8]}.pdf"

                file_size_kb = len(pdf_bytes) // 1024

                self.logger.info(
                    f"Generated patient report: {filename} ({file_size_kb}KB) for {report_data['patient_name']}"
                )

                # Return as widget (like charts) - data comes via metadata, not streaming
                widget_data = json.dumps({
                    "type": "pdf",
                    "filename": filename,
                    "base64": pdf_base64,
                    "size_kb": file_size_kb,
                    "period": report_data["period"],
                })

                return (widget_data, True)

            except Exception as e:
                self.logger.error(f"Error generating patient report: {e}", exc_info=True)
                return (f"❌ Er ging iets mis bij het genereren van je verslag: {str(e)}", False)

        # Assemble and return the complete tool list
        tools_list = [
            # EasyLog-specific tools
            *easylog_backend_tools.all_tools,
            *easylog_sql_tools.all_tools,
            # Role management
            tool_set_current_role,
            # Document tools
            tool_search_documents,
            # tool_get_document_contents,
            # Questionnaire tools
            tool_answer_questionaire_question,
            tool_get_questionaire_answer,
            # Visualization tools
            tool_create_bar_chart,
            tool_calculate_zlm_scores,
            tool_create_zlm_chart,
            tool_create_line_chart,
            # Interaction tools
            tool_ask_multiple_choice,
            # Image tools
            tool_download_image,
            # Schedule and reminder tools
            tool_set_recurring_task,
            tool_add_reminder,
            tool_remove_recurring_task,
            tool_remove_reminder,
            # Memory tools
            tool_store_memory,
            tool_get_memory,
            # Notification tool
            tool_send_notification,
            # Step counter tools
            tool_get_steps_data,
            # Report generation
            tool_generate_patient_report,
            # System tools
            BaseTools.tool_noop,
            BaseTools.tool_call_super_agent,
        ]
        return {tool.__name__: tool for tool in tools_list}

    def _substitute_double_curly_placeholders(self, template_string: str, data_dict: dict[str, Any]) -> str:
        """Substitutes {{placeholder}} style placeholders in a string with values from data_dict."""

        # First, replace all known placeholders
        output_string = template_string
        for key, value in data_dict.items():
            placeholder = "{{" + key + "}}"
            output_string = output_string.replace(placeholder, str(value))

        # Then, find any remaining {{...}} placeholders that were not in data_dict
        # and replace them with a [missing:key_name] indicator.
        # This mimics the DefaultKeyDict behavior for unprovided keys.
        def replace_missing_with_indicator(match: re.Match[str]) -> str:
            var_name = match.group(1)  # Content inside {{...}}
            return f"[missing:{var_name}]"

        output_string = re.sub(r"\{\{([^}]+)\}\}", replace_missing_with_indicator, output_string)
        return output_string

    def _parse_cron_expression(self, cron_expr: str) -> dict[str, Any]:
        """Parse a cron expression into its components.
        
        Format: "minute hour day_of_month month day_of_week"
        Returns dict with parsed values or None for wildcards.
        """
        parts = cron_expr.split()
        if len(parts) != 5:
            self.logger.warning(f"Invalid cron expression: {cron_expr}")
            return {}
        
        def parse_field(value: str) -> list[int] | None:
            """Parse a cron field into a list of integers or None for wildcard."""
            if value == "*":
                return None
            if "," in value:
                return [int(v) for v in value.split(",")]
            if "-" in value:
                start, end = value.split("-")
                return list(range(int(start), int(end) + 1))
            return [int(value)]
        
        return {
            "minute": parse_field(parts[0]),
            "hour": parse_field(parts[1]),
            "day_of_month": parse_field(parts[2]),
            "month": parse_field(parts[3]),
            "day_of_week": parse_field(parts[4]),
        }

    def _matches_cron_time(
        self, cron_expr: str, current_time: datetime, grace_minutes: int = 4
    ) -> bool:
        """Check if current time matches a cron expression with grace window.
        
        Args:
            cron_expr: Cron expression string (e.g., "15 20 * * *")
            current_time: Current datetime to check against
            grace_minutes: Minutes after scheduled time to still consider eligible
            
        Returns:
            True if current time matches (within grace window)
        """
        parsed = self._parse_cron_expression(cron_expr)
        if not parsed:
            return False
        
        # Check hour (must match exactly)
        if parsed["hour"] and current_time.hour not in parsed["hour"]:
            return False
        
        # Check minute (with grace window)
        if parsed["minute"]:
            scheduled_minutes = parsed["minute"]
            current_minute = current_time.minute
            
            # Check if we're within grace window of any scheduled minute
            is_within_grace = False
            for scheduled_min in scheduled_minutes:
                # Calculate minutes difference
                diff = current_minute - scheduled_min
                # Within grace window means: exact time OR 0-4 minutes after
                if 0 <= diff <= grace_minutes:
                    is_within_grace = True
                    break
            
            if not is_within_grace:
                return False
        
        # Check day of month
        if parsed["day_of_month"] and current_time.day not in parsed["day_of_month"]:
            return False
        
        # Check month
        if parsed["month"] and current_time.month not in parsed["month"]:
            return False
        
        # Check day of week (convert Python weekday to cron format)
        if parsed["day_of_week"]:
            # Python: 0=Monday, 6=Sunday
            # Cron: 0=Sunday, 1=Monday, ..., 6=Saturday OR 1=Monday, ..., 7=Sunday
            python_weekday = current_time.weekday()
            cron_weekday = (python_weekday + 1) % 7  # Convert to cron format (0=Sunday)
            
            # Support both formats (0-6 and 1-7)
            cron_days = parsed["day_of_week"]
            if cron_weekday not in cron_days and (cron_weekday + 1) not in cron_days:
                return False
        
        return True

    def _is_eligible_reminder(
        self, reminder: dict[str, Any], notifications: list[dict[str, Any]], current_time: datetime
    ) -> bool:
        """Check if a reminder is eligible to be sent.
        
        Args:
            reminder: Reminder dict with 'id', 'date'/'scheduled_at', 'message'
            notifications: List of previously sent notifications
            current_time: Current datetime
            
        Returns:
            True if reminder should be sent
        """
        # Get scheduled time
        scheduled_str = reminder.get("date") or reminder.get("scheduled_at")
        if not scheduled_str:
            self.logger.warning(f"Reminder {reminder.get('id')} missing date/scheduled_at")
            return False
        
        try:
            # Parse scheduled time
            if isinstance(scheduled_str, str):
                scheduled_time = datetime.fromisoformat(scheduled_str.replace("Z", "+00:00"))
            else:
                scheduled_time = scheduled_str
            
            # Make timezone-aware if needed
            if scheduled_time.tzinfo is None:
                amsterdam_tz = pytz.timezone("Europe/Amsterdam")
                scheduled_time = amsterdam_tz.localize(scheduled_time)
            
            # Check if due (with 4-minute grace window)
            grace_window = 4 * 60  # 4 minutes in seconds
            time_diff = (current_time - scheduled_time).total_seconds()
            
            if time_diff < -60:  # More than 1 minute in future
                return False
            
            if time_diff > grace_window:  # More than 4 minutes in past
                return False
            
            # Check for duplicates (same contents in last 24 hours)
            reminder_contents = reminder.get("message", "")
            cutoff_time = current_time - timedelta(hours=24)
            
            for notif in notifications:
                notif_contents = notif.get("contents", "")
                notif_sent_str = notif.get("sent_at", "")
                
                if notif_contents == reminder_contents:
                    try:
                        notif_sent = datetime.fromisoformat(notif_sent_str.replace("Z", "+00:00"))
                        if notif_sent > cutoff_time:
                            self.logger.info(
                                f"Reminder {reminder.get('id')} skipped - same contents sent at {notif_sent}"
                            )
                            return False
                    except Exception as e:
                        self.logger.warning(f"Error parsing notification sent_at: {e}")
            
            return True
            
        except Exception as e:
            self.logger.error(f"Error checking reminder eligibility: {e}")
            return False

    def _is_eligible_recurring_task(
        self, task: dict[str, Any], notifications: list[dict[str, Any]], current_time: datetime
    ) -> bool:
        """Check if a recurring task is eligible to be sent.
        
        Args:
            task: Recurring task dict with 'id', 'cron_expression', 'task'
            notifications: List of previously sent notifications
            current_time: Current datetime
            
        Returns:
            True if task should be sent
        """
        cron_expr = task.get("cron_expression", "")
        if not cron_expr:
            self.logger.warning(f"Task {task.get('id')} missing cron_expression")
            return False
        
        # Check if cron matches current time
        if not self._matches_cron_time(cron_expr, current_time):
            return False
        
        # Check for duplicates in current hour
        # We use task ID + hour as deduplication key
        task_id = task.get("id", "")
        current_hour = current_time.hour
        
        for notif in notifications:
            notif_sent_str = notif.get("sent_at", "")
            notif_task_id = notif.get("task_id", "")
            
            try:
                notif_sent = datetime.fromisoformat(notif_sent_str.replace("Z", "+00:00"))
                notif_hour = notif_sent.hour
                notif_date = notif_sent.date()
                current_date = current_time.date()
                
                # Skip if same task sent in same hour today
                if (
                    notif_task_id == task_id
                    and notif_hour == current_hour
                    and notif_date == current_date
                ):
                    self.logger.info(
                        f"Task {task_id} skipped - already sent at {notif_sent} (hour {notif_hour})"
                    )
                    return False
                    
            except Exception as e:
                self.logger.warning(f"Error parsing notification sent_at: {e}")
        
        return True

    async def _remove_reminder(self, reminder_id: str) -> None:
        """Remove a reminder from metadata after it's been sent."""
        try:
            reminders = await self.get_metadata("reminders", [])
            updated_reminders = [r for r in reminders if r.get("id") != reminder_id]
            await self.set_metadata("reminders", updated_reminders)
            self.logger.info(f"Removed reminder {reminder_id} from metadata")
        except Exception as e:
            self.logger.error(f"Error removing reminder {reminder_id}: {e}")

    async def _add_notification_record(
        self, title: str, contents: str, task_id: str | None = None, reminder_id: str | None = None
    ) -> None:
        """Add a notification to the sent notifications history."""
        try:
            amsterdam_tz = pytz.timezone("Europe/Amsterdam")
            current_time = datetime.now(amsterdam_tz)
            
            notifications = await self.get_metadata("notifications", [])
            
            notification_record = {
                "id": str(uuid.uuid4()),
                "title": title,
                "contents": contents,
                "sent_at": current_time.isoformat(),
            }
            
            if task_id:
                notification_record["task_id"] = task_id
            if reminder_id:
                notification_record["reminder_id"] = reminder_id
            
            notifications.append(notification_record)
            
            # Keep only last 100 notifications to prevent metadata bloat
            if len(notifications) > 100:
                notifications = notifications[-100:]
            
            await self.set_metadata("notifications", notifications)
            self.logger.info(f"Added notification record: {title}")
            
        except Exception as e:
            self.logger.error(f"Error adding notification record: {e}")

    async def on_message(
        self, messages: Iterable[ChatCompletionMessageParam], _: int = 0
    ) -> tuple[AsyncStream[ChatCompletionChunk] | ChatCompletion, list[Callable]]:
        # Get the current role
        role_config = await self.get_current_role()

        # Get the available tools
        tools = self.get_tools()

        # Filter tools based on the role's regex pattern
        tools_values = [
            tool
            for tool in tools.values()
            if re.match(role_config.tools_regex, tool.__name__)
            or tool.__name__ == BaseTools.tool_noop.__name__
            or tool.__name__ == BaseTools.tool_call_super_agent.__name__
        ]

        # Prepare questionnaire format kwargs
        questionnaire_format_kwargs: dict[str, str] = {}
        for q_item in role_config.questionaire:
            answer = await self.get_metadata(q_item.name, "[not answered]")
            questionnaire_format_kwargs[f"questionaire_{q_item.name}_question"] = q_item.question

            # Handle both string and structured instructions
            if isinstance(q_item.instructions, list):
                # For structured instructions, convert to JSON string for AI prompt
                questionnaire_format_kwargs[f"questionaire_{q_item.name}_instructions"] = json.dumps(
                    q_item.instructions
                )
            else:
                # Legacy string format
                questionnaire_format_kwargs[f"questionaire_{q_item.name}_instructions"] = q_item.instructions

            questionnaire_format_kwargs[f"questionaire_{q_item.name}_name"] = q_item.name
            questionnaire_format_kwargs[f"questionaire_{q_item.name}_answer"] = answer

        # Format the role prompt with questionnaire data
        try:
            formatted_current_role_prompt = self._substitute_double_curly_placeholders(
                role_config.prompt, questionnaire_format_kwargs
            )
        except Exception as e:
            self.logger.warning(f"Error formatting role prompt: {e}")
            formatted_current_role_prompt = role_config.prompt

        # Gather reminders and recurring tasks
        recurring_tasks = await self.get_metadata("recurring_tasks", [])
        reminders = await self.get_metadata("reminders", [])
        memories = await self.get_metadata("memories", [])
        notifications = await self.get_metadata("notifications", [])

        # Get current time with proper timezone and Dutch formatting
        amsterdam_tz = pytz.timezone("Europe/Amsterdam")
        current_datetime = datetime.now(amsterdam_tz)

        # Dutch day names
        dutch_days = {
            "Monday": "maandag",
            "Tuesday": "dinsdag",
            "Wednesday": "woensdag",
            "Thursday": "donderdag",
            "Friday": "vrijdag",
            "Saturday": "zaterdag",
            "Sunday": "zondag",
        }

        # Dutch month names
        dutch_months = {
            1: "januari",
            2: "februari",
            3: "maart",
            4: "april",
            5: "mei",
            6: "juni",
            7: "juli",
            8: "augustus",
            9: "september",
            10: "oktober",
            11: "november",
            12: "december",
        }

        # Format current time with Dutch day and month names
        english_day = current_datetime.strftime("%A")
        dutch_day = dutch_days.get(english_day, english_day)
        day_num = current_datetime.day
        month_name = dutch_months.get(current_datetime.month, current_datetime.strftime("%B"))
        year = current_datetime.year
        time_str = current_datetime.strftime("%H:%M:%S")

        # Create comprehensive time string
        current_time_str = (
            f"{dutch_day} {day_num} {month_name} {year} om {time_str} "
            f"(Week {current_datetime.isocalendar()[1]}, Dag {current_datetime.timetuple().tm_yday} van het jaar)"
        )

        # Prepare the main content for the LLM
        main_prompt_format_args = {
            "current_role": role_config.name,
            "current_role_prompt": formatted_current_role_prompt,
            "available_roles": "\n".join([f"- {role.name}" for role in self.config.roles]),
            "current_time": current_time_str,
            "recurring_tasks": "\n".join(
                [f"- {task['id']}: {task['cron_expression']} - {task['task']}" for task in recurring_tasks]
            )
            if recurring_tasks
            else "<no recurring tasks>",
            "reminders": "\n".join(
                [f"- {reminder['id']}: {reminder.get('date') or reminder.get('scheduled_at', 'No date')} - {reminder['message']}" for reminder in reminders]
            )
            if reminders
            else "<no reminders>",
            "memories": "\n".join([f"- {memory['id']}: {memory['memory']}" for memory in memories])
            if memories
            else "<no memories>",
            "notifications": "\n".join(
                [
                    f"{notification.get('id')}: {notification.get('contents')} at {notification.get('sent_at')}"
                    for notification in notifications
                ]
            )
            if notifications
            else "<no notifications>",
            "metadata": json.dumps((await self._get_thread()).metadata),
        }
        main_prompt_format_args.update(questionnaire_format_kwargs)

        # Store session metadata from headers
        onesignal_id = self.request_headers.get("x-onesignal-external-user-id")
        assistant_field_name = self.request_headers.get("x-assistant-field-name")

        if onesignal_id is not None:
            await self.set_metadata("onesignal_id", onesignal_id)

        if assistant_field_name is not None:
            await self.set_metadata("assistant_field_name", assistant_field_name)

        try:
            llm_content = self._substitute_double_curly_placeholders(self.config.prompt, main_prompt_format_args)
        except Exception as e:
            self.logger.warning(f"Error formatting system prompt: {e}")
            llm_content = f"Role: {role_config.name}\nPrompt: {formatted_current_role_prompt}"

        self.logger.debug(llm_content)

        # Create the completion request
        response = await self.client.chat.completions.create(
            model=role_config.model,
            messages=[
                {
                    "role": "system",
                    "content": llm_content,
                },
                *messages,
            ],
            stream=True,
            extra_body={
                "reasoning": {
                    "enabled": role_config.reasoning.enabled,
                    "effort": role_config.reasoning.effort,
                }
            },
            tools=[function_to_openai_tool(tool) for tool in tools_values],
            tool_choice="auto",
        )

        return response, list(tools_values)

    @staticmethod
    def super_agent_config() -> SuperAgentConfig[MUMCAgentConfig] | None:
        return SuperAgentConfig(
            cron_expression="*/15 * * * *",  # every 15 minutes for production
            agent_config=MUMCAgentConfig(),
        )

    async def on_super_agent_call(
        self, messages: Iterable[ChatCompletionMessageParam]
    ) -> tuple[AsyncStream[ChatCompletionChunk] | ChatCompletion, list[Callable]] | None:
        onesignal_id = await self.get_metadata("onesignal_id")

        if onesignal_id is None:
            self.logger.info("No onesignal id found, skipping super agent call")
            return

        last_thread = await prisma.threads.query_first(
            """
        SELECT * FROM threads
        WHERE metadata->>'onesignal_id' = $1
        ORDER BY created_at DESC
        LIMIT 1
        """,
            onesignal_id,
        )

        if last_thread is None:
            self.logger.info("No last thread found, skipping super agent call")
            return

        tools = [
            BaseTools.tool_noop,
            self.get_tools()["tool_send_notification"],
        ]

        # Get current time and metadata
        amsterdam_tz = pytz.timezone("Europe/Amsterdam")
        current_time = datetime.now(amsterdam_tz)
        
        notifications = await self.get_metadata("notifications", [])
        reminders = await self.get_metadata("reminders", [])
        recurring_tasks = await self.get_metadata("recurring_tasks", [])
        memories = await self.get_metadata("memories", [])

        self.logger.info(
            f"📋 Super Agent run at {current_time.strftime('%H:%M:%S')} - "
            f"{len(reminders)} reminders, {len(recurring_tasks)} tasks"
        )

        # ========================================================================
        # PYTHON PRE-FILTERING (Betrouwbaar!)
        # ========================================================================
        eligible_reminders = []
        eligible_recurring_tasks = []
        
        # Filter reminders
        for reminder in reminders:
            if self._is_eligible_reminder(reminder, notifications, current_time):
                eligible_reminders.append(reminder)
                self.logger.info(f"✅ Eligible reminder: {reminder.get('id')} - {reminder.get('message')[:50]}")
            else:
                self.logger.debug(f"⏭️  Skipped reminder: {reminder.get('id')}")
        
        # Filter recurring tasks
        for task in recurring_tasks:
            if self._is_eligible_recurring_task(task, notifications, current_time):
                eligible_recurring_tasks.append(task)
                self.logger.info(
                    f"✅ Eligible task: {task.get('id')} - "
                    f"cron={task.get('cron_expression')} - {task.get('task')[:50]}"
                )
            else:
                self.logger.debug(f"⏭️  Skipped task: {task.get('id')}")
        
        # If nothing is eligible, skip AI call
        if not eligible_reminders and not eligible_recurring_tasks:
            self.logger.info("No eligible notifications - skipping AI call")
            return None

        # ========================================================================
        # FETCH STEPS DATA FOR DYNAMIC CONTENT
        # ========================================================================
        self.logger.info("🎯 Fetching steps data for dynamic notifications...")
        
        steps_today = 0
        steps_goal = 0
        steps_remaining = 0
        steps_progress_pct = 0
        
        try:
            user = await prisma.users.find_first(
                where=usersWhereInput(external_id=onesignal_id)
            )
            
            if user:
                today_start = current_time.replace(hour=0, minute=0, second=0, microsecond=0)
                today_end = current_time.replace(hour=23, minute=59, second=59, microsecond=999999)
                
                steps_data = await prisma.health_data_points.find_many(
                    where=health_data_pointsWhereInput(
                        user_id=user.id,
                        type=health_data_point_type.steps,
                        date_from={"gte": today_start},
                        date_to={"lte": today_end},
                    )
                )
                
                steps_today = sum(dp.value for dp in steps_data)
                
                # Extract steps goal from memories with priority
                # 1. Look for explicit "Goal" memories first (highest priority)
                # 2. Handle progressive goals (van X naar Y -> take X)
                # 3. Skip ZLM scores (contain "score")
                for mem in memories:
                    mem_text = mem.get("memory", "").lower()
                    
                    # Skip ZLM score memories
                    if "score" in mem_text or "zlm-" in mem_text:
                        continue
                        
                    if "stappen" in mem_text or "steps" in mem_text:
                        # Check for progressive goal pattern: "van X naar Y" or "start met X"
                        progressive_match = re.search(r'(?:van|start met)\s*(\d{1,3}(?:\.\d{3})*)\s*stappen', mem_text)
                        if progressive_match:
                            steps_goal = int(progressive_match.group(1).replace('.', ''))
                            self.logger.info(f"Found progressive steps goal: {steps_goal} (from: {mem_text[:50]}...)")
                            break
                        
                        # Check for explicit goal with "per dag"
                        daily_match = re.search(r'(\d{1,3}(?:\.\d{3})*)\s*stappen\s*per\s*dag', mem_text)
                        if daily_match:
                            steps_goal = int(daily_match.group(1).replace('.', ''))
                            self.logger.info(f"Found daily steps goal: {steps_goal} (from: {mem_text[:50]}...)")
                            break
                        
                        # Fallback: any number followed by stappen
                        match = re.search(r'(\d{1,3}(?:\.\d{3})*)\s*stappen', mem_text)
                        if match:
                            steps_goal = int(match.group(1).replace('.', ''))
                            self.logger.info(f"Found steps goal: {steps_goal} (from: {mem_text[:50]}...)")
                            break
                
                if steps_goal == 0:
                    steps_goal = 8000
                
                steps_remaining = max(0, steps_goal - steps_today)
                steps_progress_pct = int((steps_today / steps_goal) * 100) if steps_goal > 0 else 0
                
                self.logger.info(
                    f"📊 Steps: {steps_today}/{steps_goal} ({steps_progress_pct}%) - {steps_remaining} remaining"
                )
        except Exception as e:
            self.logger.error(f"Error fetching steps data: {e}")

        # ========================================================================
        # SIMPLIFIED AI PROMPT (Python did the filtering!)
        # ========================================================================
        prompt = f"""
# Notification Content Creator

## Your Job
Create appropriate notification content for the eligible items below. 
**All filtering has been done - just create good content!**

## Current Context
Time: {current_time.strftime("%H:%M")}
Date: {current_time.strftime("%A %d %B %Y")}

## Activity Data (For Dynamic Messages)
- Steps today: {steps_today}
- Steps goal: {steps_goal}
- Steps remaining: {steps_remaining}
- Progress: {steps_progress_pct}%

## Eligible Items to Send

### Reminders ({len(eligible_reminders)}):
{json.dumps(eligible_reminders, indent=2)}

### Recurring Tasks ({len(eligible_recurring_tasks)}):
{json.dumps(eligible_recurring_tasks, indent=2)}

## Instructions

### For Reminders:
- Title: "Reminder"
- Contents: Use the reminder message as-is

### For Recurring Tasks:
**The task text is an INSTRUCTION to you, not the message content!**

**If task mentions activity (stappen, bewegen, lopen):**
- Title: "Stappen Update" or "Je Activiteit"
- Contents: Create motivating message with REAL numbers from activity data above
- Example: "Super! Je hebt vandaag al {steps_today} van {steps_goal} stappen! Nog {steps_remaining} te gaan 💪"

**If task IS a user message (medicatie, ademhaling):**
- Title: "Medicatie Herinnering" or appropriate title
- Contents: Use task text as-is if it reads like a user message
- Example task: "Tijd voor je medicatie! Vergeet niet je prednison in te nemen."
  → Send exactly that

**If task contains instruction keywords ("Stuur", "Herinner"):**
- Extract the core message from the instruction
- Example: "Herinner aan ademhalingsoefeningen" → "Tijd voor je ademhalingsoefeningen!"

## Action Required
For EACH eligible item:
1. **Call `tool_send_notification` with:**
   - `title`: Appropriate title
   - `contents`: The message content
   - `reminder_id`: The reminder ID (for reminders only)
   - `task_id`: The task ID (for recurring tasks only)

2. **IMPORTANT**: Include the IDs so cleanup can happen automatically!

Example calls:
```
# For reminder
tool_send_notification(
    title="Reminder",
    contents="Tijd om de Ziektelastmeter in te vullen!",
    reminder_id="abc123"
)

# For recurring task (use REAL numbers from activity data!)
# If steps_today=5000, steps_goal=8000, steps_remaining=3000:
tool_send_notification(
    title="Stappen Update",
    contents="Je hebt vandaag al 5000 stappen! Nog 3000 te gaan 💪",
    task_id="task456"
)
```

If no items to send: call tool_noop
"""

        self.logger.info(f"Calling super agent with prompt: {prompt}")

        response = await self.client.chat.completions.create(
            model="anthropic/claude-sonnet-4.5",  # Using Claude 4.5 for better instruction following
            messages=[
                {
                    "role": "system",
                    "content": prompt,
                },
                {
                    "role": "user",
                    "content": "Send my notifications",
                },
            ],
            tools=[function_to_openai_tool(tool) for tool in tools],
            tool_choice="auto",
            stream=False,
        )

        if response and response.choices:
            self.logger.info(f"Super agent response: {response.choices[0].message}")

            async for _ in self._handle_completion(response, tools, messages):
                pass
        else:
            self.logger.error(f"No response from API call: {response}")
        
        return None
