"""Patient Report Data Aggregator.

Collects all necessary patient data from the database for report generation.
"""

import re
from datetime import datetime, timedelta
from typing import Any

import pytz
from prisma.enums import health_data_point_type
from prisma.types import health_data_pointsWhereInput, usersWhereInput

from src.lib.prisma import prisma


class PatientReportDataAggregator:
    """Aggregates patient data from various sources for report generation."""

    def __init__(self, thread_id: str, onesignal_id: str) -> None:
        """Initialize the data aggregator.

        Args:
            thread_id: The thread ID for the patient conversation
            onesignal_id: The OneSignal external user ID
        """
        self.thread_id = thread_id
        self.onesignal_id = onesignal_id
        self.amsterdam_tz = pytz.timezone("Europe/Amsterdam")

    async def aggregate_report_data(self, period_days: int = 30) -> dict[str, Any]:
        """Aggregate all report data for the patient.

        Args:
            period_days: Number of days to look back for data

        Returns:
            Dictionary containing all report sections
        """
        # Get thread metadata
        thread = await prisma.threads.find_first(where={"id": self.thread_id})

        if not thread or not thread.metadata:
            raise ValueError("Thread not found or has no metadata")

        metadata = thread.metadata

        # Calculate period
        end_date = datetime.now(self.amsterdam_tz)
        start_date = end_date - timedelta(days=period_days)

        # Collect data from various sources
        profile_data = await self._extract_profile_data(metadata)
        zlm_data = await self._extract_zlm_data(metadata)
        goals_data = await self._extract_goals_data(metadata)
        steps_data = await self._extract_steps_data(start_date, end_date)
        medication_data = await self._extract_medication_data(metadata)

        # Patient name from memories
        patient_name = "Patiënt"
        memories = metadata.get("memories", [])
        for memory in memories:
            memory_text = memory.get("memory", "")
            if "naam" in memory_text.lower():
                match = re.search(r"naam[:\s]+([A-Z][a-zA-Z]+)", memory_text)
                if match:
                    patient_name = match.group(1)
                    break

        # Format period
        period_str = f"{start_date.strftime('%d %B')} - {end_date.strftime('%d %B %Y')}"

        return {
            "patient_name": patient_name,
            "period": period_str,
            "period_days": period_days,
            "profile": profile_data,
            "zlm_scores": zlm_data,
            "goals": goals_data,
            "steps_data": steps_data,
            "medications": medication_data,
        }

    async def _extract_profile_data(self, metadata: dict[str, Any]) -> dict[str, Any]:
        """Extract profile information from metadata.

        Args:
            metadata: Thread metadata containing memories

        Returns:
            Profile data dictionary
        """
        profile = {}
        memories = metadata.get("memories", [])

        for memory in memories:
            memory_text = memory.get("memory", "").lower()

            # Extract age/birth year
            if "geboortejaar" in memory_text or "year of birth" in memory_text:
                match = re.search(r"\b(19|20)\d{2}\b", memory_text)
                if match:
                    birth_year = int(match.group())
                    current_year = datetime.now().year
                    profile["age"] = current_year - birth_year

            # Extract gender
            if "geslacht" in memory_text or "sex:" in memory_text:
                if "man" in memory_text or "male" in memory_text:
                    profile["gender"] = "Man"
                elif "vrouw" in memory_text or "female" in memory_text:
                    profile["gender"] = "Vrouw"

            # Extract diagnosis
            if "diagnose" in memory_text or "diagnosis:" in memory_text:
                # Extract COPD stage and type
                match = re.search(r"COPD[^\n]*", memory_text, re.IGNORECASE)
                if match:
                    profile["diagnosis"] = match.group().strip()

            # Extract comorbidities
            if "comorbiditeit" in memory_text or "comorbidities:" in memory_text:
                match = re.search(r"comorbid[^\n]*:\s*([^\n]+)", memory_text, re.IGNORECASE)
                if match:
                    profile["comorbidities"] = match.group(1).strip()

        return profile

    async def _extract_zlm_data(self, metadata: dict[str, Any]) -> dict[str, Any]:
        """Extract all ZLM measurements from metadata with dates.

        Args:
            metadata: Thread metadata containing questionnaire answers

        Returns:
            ZLM data dictionary with measurements grouped by date
        """
        # Group measurements by date
        measurements_by_date: dict[str, dict[str, Any]] = {}
        
        # Extract ZLM scores from memories
        memories = metadata.get("memories", [])

        for memory in memories:
            memory_text = memory.get("memory", "")

            # Check if it's a ZLM score memory
            if "zlm-score" in memory_text.lower() or "zlm-bmi" in memory_text.lower():
                # Extract date
                date_match = re.search(r"(\d{2}-\d{2}-\d{4})", memory_text)
                if not date_match:
                    continue
                    
                date_str = date_match.group(1)
                
                # Initialize measurement for this date if not exists
                if date_str not in measurements_by_date:
                    measurements_by_date[date_str] = {
                        "date": date_str,
                        "scores": {},
                        "bmi_value": None
                    }

                # Extract score
                score_match = re.search(r"Score\s*=\s*(\d+\.?\d*)", memory_text)
                if score_match:
                    score_value = float(score_match.group(1))

                    # Extract domain name
                    for domain_key in [
                        "Long klachten",
                        "Long aanvallen",
                        "Lichamelijke beperkingen",
                        "Vermoeidheid",
                        "Nachtrust",
                        "Emoties",
                        "Seksualiteit",
                        "Relaties en werk",
                        "Medicijnen",
                        "BMI",
                        "Bewegen",
                        "Alcohol",
                        "Roken",
                    ]:
                        if domain_key in memory_text:
                            # Convert to key format
                            domain_key_normalized = domain_key.lower().replace(" ", "_")
                            measurements_by_date[date_str]["scores"][domain_key_normalized] = score_value
                            break

                # Extract BMI meta value
                if "zlm-bmi-meta_value" in memory_text.lower():
                    bmi_match = re.search(r"meta_value\s+\d{2}-\d{2}-\d{4}\s+(\d+\.?\d*)", memory_text)
                    if bmi_match:
                        measurements_by_date[date_str]["bmi_value"] = float(bmi_match.group(1))

        # Sort measurements by date (newest first)
        sorted_measurements = sorted(
            measurements_by_date.values(),
            key=lambda x: datetime.strptime(x["date"], "%d-%m-%Y"),
            reverse=True
        )

        return {"measurements": sorted_measurements}

    async def _extract_goals_data(self, metadata: dict[str, Any]) -> list[dict[str, Any]]:
        """Extract goals from metadata with creation dates.

        Args:
            metadata: Thread metadata containing memories

        Returns:
            List of goals with dates
        """
        goals = []
        memories = metadata.get("memories", [])

        for memory in memories:
            memory_text = memory.get("memory", "")
            created_at = memory.get("created_at")

            # Check if it's a goal memory
            if "goal-" in memory_text.lower() or "doel" in memory_text.lower():
                # Try to extract goal text
                if ":" in memory_text:
                    goal_text = memory_text.split(":", 1)[1].strip()
                else:
                    goal_text = memory_text

                # Format date if available
                date_str = ""
                if created_at:
                    try:
                        # Parse the date and format it
                        if isinstance(created_at, str):
                            date_obj = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
                        else:
                            date_obj = created_at
                        
                        # Convert to Amsterdam timezone
                        date_obj = date_obj.astimezone(self.amsterdam_tz)
                        date_str = date_obj.strftime("%d-%m-%Y")
                    except Exception:
                        date_str = ""

                goals.append({
                    "goal": goal_text,
                    "status": "In uitvoering",
                    "date": date_str
                })

        return goals

    async def _extract_steps_data(self, start_date: datetime, end_date: datetime) -> dict[str, Any]:
        """Extract steps data from health data points.

        Args:
            start_date: Start of the period
            end_date: End of the period

        Returns:
            Steps data dictionary
        """
        # Get user
        user = await prisma.users.find_first(where=usersWhereInput(external_id=self.onesignal_id))

        if not user:
            return {"average_steps": 0, "total_steps": 0, "days_tracked": 0, "goal": 8000}

        # Get steps data
        steps_records = await prisma.health_data_points.find_many(
            where=health_data_pointsWhereInput(
                user_id=user.id,
                type=health_data_point_type.steps,
                date_from={"gte": start_date},
                date_to={"lte": end_date},
            ),
            order={"date_from": "asc"},
        )

        if not steps_records:
            return {"average_steps": 0, "total_steps": 0, "days_tracked": 0, "goal": 8000}

        # Aggregate by day
        daily_totals: dict[str, int] = {}
        for record in steps_records:
            day_key = record.date_from.strftime("%Y-%m-%d")
            daily_totals[day_key] = daily_totals.get(day_key, 0) + record.value

        total_steps = sum(daily_totals.values())
        days_tracked = len(daily_totals)
        average_steps = int(total_steps / days_tracked) if days_tracked > 0 else 0

        # Extract goal from thread metadata
        goal = 8000  # default
        thread = await prisma.threads.find_first(where={"id": self.thread_id})
        if thread and thread.metadata:
            memories = thread.metadata.get("memories", [])
            for memory in memories:
                memory_text = memory.get("memory", "").lower()
                if "stappen" in memory_text or "steps" in memory_text:
                    goal_match = re.search(r"(\d+)\s*stappen", memory_text)
                    if goal_match:
                        goal = int(goal_match.group(1))
                        break

        # Convert daily_totals to list of dicts for chart
        daily_data = [
            {"date": date_str, "steps": steps}
            for date_str, steps in sorted(daily_totals.items())
        ]

        return {
            "average_steps": average_steps,
            "total_steps": total_steps,
            "days_tracked": days_tracked,
            "goal": goal,
            "daily_data": daily_data,
        }

    async def _extract_medication_data(self, metadata: dict[str, Any]) -> dict[str, Any]:
        """Extract medication information from metadata with update dates.

        Args:
            metadata: Thread metadata containing memories

        Returns:
            Dictionary with medication updates grouped by date
        """
        medication_updates: list[dict[str, Any]] = []
        memories = metadata.get("memories", [])

        for memory in memories:
            memory_text = memory.get("memory", "")
            memory_lower = memory_text.lower()
            created_at = memory.get("created_at")

            # Check if it's medication memory
            if any(keyword in memory_lower for keyword in ["medication updated:", "medicatie updated:", "medication:", "medicatie:"]):
                # Extract date from created_at
                date_str = ""
                if created_at:
                    try:
                        if isinstance(created_at, str):
                            date_obj = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
                        else:
                            date_obj = created_at
                        date_obj = date_obj.astimezone(self.amsterdam_tz)
                        date_str = date_obj.strftime("%d-%m-%Y")
                    except Exception:
                        date_str = ""
                
                # Remove the prefix (e.g., "Medication updated: ")
                medication_text = re.split(r"(?:medication updated:|medicatie updated:|medication:|medicatie:)\s*", memory_text, maxsplit=1, flags=re.IGNORECASE)
                if len(medication_text) > 1:
                    medication_text = medication_text[1]
                else:
                    medication_text = memory_text
                
                # Split by comma to get individual medications
                # Format: "Name1 - dosage1 - timing1, Name2 - dosage2 - timing2, ..."
                individual_meds = medication_text.split(", ")
                
                meds_list = []
                for med_string in individual_meds:
                    # Parse each medication: [Name] - [Dosage] - [Timing]
                    parts = med_string.split(" - ")
                    
                    if len(parts) >= 2:
                        name = parts[0].strip()
                        dosage = parts[1].strip()
                        timing = parts[2].strip() if len(parts) > 2 else ""
                        
                        # Only add if we have at least name and dosage
                        if name and dosage:
                            meds_list.append({
                                "name": name,
                                "dosage": dosage,
                                "timing": timing
                            })
                
                if meds_list:
                    medication_updates.append({
                        "date": date_str,
                        "medications": meds_list
                    })

        # Sort by date (newest first)
        medication_updates.sort(
            key=lambda x: datetime.strptime(x["date"], "%d-%m-%Y") if x["date"] else datetime.min,
            reverse=True
        )

        return {"updates": medication_updates}

