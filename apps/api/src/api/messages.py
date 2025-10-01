import json
from collections.abc import AsyncGenerator
from datetime import datetime
from typing import Literal

import pytz
from fastapi import APIRouter, HTTPException, Path, Query, Request, Response
from fastapi.responses import StreamingResponse
from prisma import Json

from src.lib.prisma import prisma
from src.logger import logger
from src.models.chart_widget import ChartWidget
from src.models.message_create import MessageCreateInput
from src.models.messages import MessageResponse
from src.models.multiple_choice_widget import MultipleChoiceWidget
from src.models.pagination import Pagination
from src.services.messages.message_service import MessageService
from src.services.messages.utils.db_message_to_message_model import (
    db_message_to_message_model,
)
from src.utils.is_valid_uuid import is_valid_uuid
from src.utils.sse import create_sse_event

router = APIRouter()


async def _ensure_welcome_message(
    thread_id: str, external_id: str | None
) -> None:
    """Ensure thread has a welcome message if it's a new/expired session.

    Two-tier welcome system:
    1. First visit (empty thread): Full onboarding message
    2. Return visit (24h+ inactive): Personalized "welcome back" with name

    Args:
        thread_id: The thread ID
        external_id: The external ID (used to determine agent_class)
    """
    # Map external_id patterns to agent_class
    # NOTE: Order matters - more specific patterns first!
    agent_class_map = {
        "mumc-server-test": "MUMCAgentTest",  # Test environment
        "mumc-server": "MUMCAgent",            # Production environment
        # Add more agents here when needed
    }

    # Determine agent_class from external_id
    agent_class = None
    if external_id:
        for pattern, cls in agent_class_map.items():
            if pattern in external_id:
                agent_class = cls
                break

    if not agent_class:
        # No mapping found, skip welcome message
        return

    # Get thread with messages
    thread = await prisma.threads.find_unique(
        where={"id": thread_id},
        include={"messages": True},
    )

    if not thread:
        return

    # Get metadata
    metadata = dict(thread.metadata) if thread.metadata else {}
    last_interaction = metadata.get("last_interaction_time")
    last_welcome_date = metadata.get("last_welcome_date")

    # Current time
    current_time = datetime.now(pytz.timezone("Europe/Amsterdam"))
    current_date = current_time.date().isoformat()

    # Configuration
    SESSION_TIMEOUT_MINUTES = 240  # 4 hours = 240 minutes

    # Determine if we should add welcome message
    should_add_welcome = False
    welcome_reason = ""
    welcome_text = ""
    is_welcome_back = False

    # Scenario 1: Empty thread (first visit)
    if len(thread.messages or []) == 0:
        if last_interaction is None:
            # First time ever
            should_add_welcome = True
            welcome_reason = "first_time"
            welcome_text = (
                "👋 Hallo!\n\n"
                "Welkom bij de 1e testversie van de nieuwe "
                "E-Supporter app van Easylog en het MUMC+.\n\n"
                "Zullen we beginnen met testen?"
            )

    # Scenario 2: Thread has messages - check for "welcome back"
    elif last_interaction:
        try:
            last_time = datetime.fromisoformat(last_interaction)
            time_diff = current_time - last_time
            inactive_minutes = time_diff.total_seconds() / 60

            # Check if enough time has passed (4 hours)
            # Always show welcome back after timeout, even if shown earlier today
            if inactive_minutes > SESSION_TIMEOUT_MINUTES:
                should_add_welcome = True
                is_welcome_back = True
                welcome_reason = f"welcome_back_{inactive_minutes:.0f}min"

                # Extract user name from memories if available
                memories = metadata.get("memories", [])
                user_name = None

                # Memories is a list of {"id": "...", "memory": "text"}
                # Search for name in memory text with multiple patterns
                if isinstance(memories, list):
                    for mem in memories:
                        if not isinstance(mem, dict):
                            continue
                        memory_text = mem.get("memory", "").strip()
                        memory_lower = memory_text.lower()
                        
                        # Pattern 1: "[naam]" as the entire memory
                        if memory_text.startswith("[") and memory_text.endswith("]"):
                            user_name = memory_text[1:-1].strip()
                            break
                        # Pattern 2: "naam: John" or "naam : John"
                        elif "naam" in memory_lower and ":" in memory_text:
                            parts = memory_text.split(":", 1)
                            if "naam" in parts[0].lower():
                                user_name = parts[1].split(",")[0].strip()
                                break
                        # Pattern 3: Just the name (short text, starts with capital)
                        elif (
                            len(memory_text.split()) <= 3 
                            and memory_text[0].isupper()
                            and not any(x in memory_lower for x in ["goal", "zlm", "score", "stappen", "medicatie"])
                        ):
                            user_name = memory_text
                            break

                    logger.info(
                        f"Thread {thread_id} - found {len(memories)} "
                        f"memories, extracted name: '{user_name or 'None'}'"
                    )

                # Build personalized welcome back message
                if user_name:
                    welcome_text = (
                        f"👋 Hallo {user_name}!\n\n"
                        "Fijn dat je er weer bent. "
                        "Hoe gaat het vandaag met je?"
                    )
                else:
                    welcome_text = (
                        "👋 Hallo!\n\n"
                        "Fijn dat je er weer bent. "
                        "Hoe gaat het vandaag met je?"
                    )
        except Exception as e:
            logger.warning(
                f"Error parsing last_interaction_time for thread "
                f"{thread_id}: {e}"
            )

    # Add welcome message if needed
    if should_add_welcome:
        logger.info(
            f"Adding welcome message to thread {thread_id} "
            f"(reason: {welcome_reason}, agent: {agent_class}, "
            f"welcome_back: {is_welcome_back})"
        )

        # Create welcome message
        welcome_msg = await prisma.messages.create(
            data={
                "thread_id": thread_id,
                "role": "assistant",
                "agent_class": agent_class,
            }
        )

        # Add text content
        await prisma.message_contents.create(
            data={
                "message_id": welcome_msg.id,
                "type": "text",
                "text": welcome_text,
            }
        )

        # Update metadata
        metadata["last_interaction_time"] = current_time.isoformat()
        if is_welcome_back:
            metadata["last_welcome_date"] = current_date

        await prisma.threads.update(
            where={"id": thread_id}, data={"metadata": Json(metadata)}
        )


@router.get(
    "/threads/{thread_id}/messages",
    name="get_messages",
    tags=["messages"],
    response_model=Pagination[MessageResponse],
    description="Retrieves all messages for a given thread. Returns a list of all messages by default in descending chronological order (newest first).",
)
async def get_messages(
    thread_id: str = Path(
        ...,
        description="The unique identifier of the thread. Can be either the internal ID or external ID.",
    ),
    limit: int = Query(default=10, ge=1),
    offset: int = Query(default=0, ge=0),
    order: Literal["asc", "desc"] = Query(default="asc"),
) -> Pagination[MessageResponse]:
    # First, get thread to extract external_id
    thread = await prisma.threads.find_first(
        where=(
            {"id": thread_id}
            if is_valid_uuid(thread_id)
            else {"external_id": thread_id}
        )
    )

    if thread:
        # Ensure welcome message exists for new/expired sessions
        await _ensure_welcome_message(thread.id, thread.external_id)

    # Now fetch messages (may include newly added welcome message)
    messages = await prisma.messages.find_many(
        where=(
            {"thread_id": thread_id}
            if is_valid_uuid(thread_id)
            else {"thread": {"is": {"external_id": thread_id}}}
        ),
        order=[{"created_at": order}],
        include={"contents": True},
        take=limit,
        skip=offset,
    )

    message_data = [db_message_to_message_model(message) for message in messages]

    return Pagination(data=message_data, limit=limit, offset=offset)


@router.post(
    "/threads/{thread_id}/messages",
    name="create_message",
    tags=["messages"],
    response_description="A stream of JSON-encoded message chunks",
    description="Creates a new message in the given thread. Will interact with the agent and return a stream of message chunks.",
)
async def create_message(
    message: MessageCreateInput,
    request: Request,
    thread_id: str = Path(
        ...,
        description="The unique identifier of the thread. Can be either the internal ID or external ID.",
    ),
) -> StreamingResponse:
    thread = await prisma.threads.find_first(
        where={"id": thread_id} if is_valid_uuid(thread_id) else {"external_id": thread_id},
    )

    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")

    agent_config = message.agent_config.model_dump()
    del agent_config["agent_class"]

    forward_message_generator = MessageService.forward_message(
        thread_id=thread.id,
        agent_class=message.agent_config.agent_class,
        agent_config=agent_config,
        input_content=message.content,
        headers=dict(request.headers),
    )

    async def stream() -> AsyncGenerator[str, None]:
        max_chunk_size = 4000
        chunk_count = 0

        try:
            async for chunk in forward_message_generator:
                if isinstance(chunk, MessageResponse):
                    yield create_sse_event("message", chunk.model_dump_json())
                    continue

                data = chunk.model_dump_json()
                if len(data) > max_chunk_size:
                    yield create_sse_event("content_start", json.dumps({"chunk_id": chunk_count}))
                    while len(data) > max_chunk_size:
                        yield create_sse_event(
                            "content_delta", json.dumps({"chunk_id": chunk_count, "delta": data[:max_chunk_size]})
                        )

                        data = data[max_chunk_size:]

                    yield create_sse_event("content_delta", json.dumps({"chunk_id": chunk_count, "delta": data}))
                    yield create_sse_event("content_end", json.dumps({"chunk_id": chunk_count}))
                else:
                    yield create_sse_event("content", data)

                chunk_count += 1

        except Exception as e:
            logger.exception("Error in SSE stream", exc_info=e)
            sse_event = create_sse_event("error", json.dumps({"detail": str(e)[:max_chunk_size]}))
            logger.warning(f"Sending sse error event to client: {sse_event}")
            yield sse_event

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={
            "Transfer-Encoding": "chunked",
            "X-Accel-Buffering": "no",
        },
    )


@router.delete(
    "/threads/{thread_id}/messages/{message_id}",
    tags=["messages"],
    name="delete_message",
)
async def delete_message(
    thread_id: str = Path(
        ...,
        description="The unique identifier of the thread. Can be either the internal ID or external ID.",
    ),
    message_id: str = Path(..., description="The unique identifier of the message."),
) -> Response:
    await prisma.messages.delete_many(
        where={
            "AND": [
                {"id": message_id},
                {"thread_id": thread_id},
            ],
        }
    )

    return Response(status_code=204)


# TODO: This is a temporary hack to get the models in openapi. Need to implement a better spec.
@router.get(
    "/models",
    name="get_models",
    tags=["models"],
    response_model=MultipleChoiceWidget | ChartWidget,
    description="Retrieves all messages for a given thread. Returns a list of all messages by default in descending chronological order (newest first).",
)
async def get_models() -> MultipleChoiceWidget | ChartWidget:
    return True  # type: ignore
