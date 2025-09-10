import datetime
import uuid
from collections import defaultdict
from datetime import time
from typing import Annotated, Any
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from fastapi import APIRouter, HTTPException, Query, Response
from prisma.enums import health_data_point_type, health_data_unit, health_platform
from prisma.types import (
    _health_data_pointsWhereUnique_source_uuid_Input,
    health_data_pointsCreateInput,
    health_data_pointsUpdateInput,
    health_data_pointsUpsertInput,
    health_data_pointsWhereInput,
    usersCreateInput,
    usersWhereInput,
)

from src.lib.prisma import prisma
from src.logger import logger
from src.models.steps import AggregationType, GetStepsResponse, LastSyncedResponse, StepDataPoint, SyncStepsInput

router = APIRouter()


@router.get(
    "/steps/last-synced", name="get_last_synced", description="Get the last synced date for steps", tags=["health"]
)
async def last_synced(
    user_id: str,
) -> LastSyncedResponse:
    user = await prisma.users.find_first(where=usersWhereInput(external_id=user_id))
    if user is None:
        default_date = datetime.datetime.now() - datetime.timedelta(days=30)
        logger.info(f"No user found for user {user_id}, returning las sync date {default_date}")
        return LastSyncedResponse(last_synced=datetime.datetime.now() - datetime.timedelta(days=30))

    last_synced = await prisma.health_data_points.find_first(
        where=health_data_pointsWhereInput(user_id=user.id, type=health_data_point_type.steps),
        order={"date_to": "desc"},
    )

    if last_synced is None:
        default_date = datetime.datetime.now() - datetime.timedelta(days=30)
        logger.info(f"No last synced date found for user {user_id}, returning las sync date {default_date}")
        return LastSyncedResponse(last_synced=datetime.datetime.now() - datetime.timedelta(days=30))

    logger.info(f"Last synced date found for user {user_id}, returning last sync date {last_synced.created_at}")
    return LastSyncedResponse(last_synced=last_synced.created_at)


@router.post("/steps/sync", name="sync_steps", description="Sync steps data", tags=["health"])
async def sync_steps(
    data: SyncStepsInput,
) -> Response:
    try:
        logger.info(f"Syncing steps data for user {data.user_id} with {len(data.data_points)} data points")

        for step_data in data.data_points:
            if step_data.unit != health_data_unit.COUNT:
                raise HTTPException(status_code=400, detail="Invalid unit")

        user = await prisma.users.find_first(where=usersWhereInput(external_id=data.user_id))
        user_id = user.id if user else None
        if user is None:
            user_create = await prisma.users.create(data=usersCreateInput(external_id=data.user_id))
            user_id = user_create.id

        if user_id is None:
            # Cannot be None given the above...
            raise HTTPException(status_code=500, detail="User not found")

        batcher = prisma.batch_()
        for step_data in data.data_points:
            # Generate deterministic source_uuid if missing
            source_uuid_value = step_data.source_uuid or str(
                uuid.uuid5(
                    uuid.NAMESPACE_DNS,
                    f"{data.user_id}_{step_data.source_name}_{step_data.date_from.isoformat()}_{step_data.date_to.isoformat()}",
                )
            )

            batcher.health_data_points.upsert(
                where=_health_data_pointsWhereUnique_source_uuid_Input(source_uuid=source_uuid_value),
                data=health_data_pointsUpsertInput(
                    create=health_data_pointsCreateInput(
                        user_id=user_id,
                        type=health_data_point_type.steps,
                        value=step_data.value,
                        unit=health_data_unit(step_data.unit),
                        date_from=step_data.date_from,
                        date_to=step_data.date_to,
                        source_uuid=source_uuid_value,
                        health_platform=health_platform(step_data.health_platform),
                        source_device_id=step_data.source_device_id,
                        source_id=step_data.source_id,
                        source_name=step_data.source_name,
                    ),
                    update=health_data_pointsUpdateInput(
                        type=health_data_point_type.steps,
                        value=step_data.value,
                        unit=health_data_unit(step_data.unit),
                        date_from=step_data.date_from,
                        date_to=step_data.date_to,
                        health_platform=health_platform(step_data.health_platform),
                        source_device_id=step_data.source_device_id,
                        source_id=step_data.source_id,
                        source_name=step_data.source_name,
                    ),
                ),
            )

        await batcher.commit()
        return Response(status_code=200)

    except Exception as e:
        logger.error(f"Error inserting steps data: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/steps", name="get_steps", description="Get user's step data with optional aggregation", tags=["health"])
async def get_steps(
    user_id: str,
    date_from: datetime.datetime,
    date_to: datetime.datetime,
    timezone: Annotated[str, Query(description="IANA timezone name")] = "Europe/Amsterdam",
    aggregation: Annotated[AggregationType, Query(description="Aggregation type for the data")] = AggregationType.day,
) -> GetStepsResponse:
    """Retrieve a user's step counts with optional time aggregation.

    Parameters:
    - user_id: The external user ID
    - date_from: Start date (inclusive) in ISO format
    - date_to: End date (inclusive) in ISO format
    - timezone: IANA timezone name for interpreting naive datetimes (default: Europe/Amsterdam)
    - aggregation: Time aggregation level (quarter/hour/day, default: day)

    Returns:
    - List of step data points limited to 300 rows maximum
    """
    try:
        # ------------------------------------------------------------------ #
        # 1. Validate timezone                                               #
        # ------------------------------------------------------------------ #
        tz_name = timezone.strip()
        if tz_name in {"CET", "CEST"}:
            tz_name = "Europe/Amsterdam"

        try:
            tz = ZoneInfo(tz_name)
        except ZoneInfoNotFoundError as e:
            raise HTTPException(
                status_code=400, detail=f"Invalid timezone '{timezone}'. Please provide a valid IANA name."
            ) from e

        utc = ZoneInfo("UTC")

        # ------------------------------------------------------------------ #
        # 2. Parse and validate date inputs                                  #
        # ------------------------------------------------------------------ #
        def _parse_input(dt: datetime.datetime) -> datetime.datetime:
            """Attach timezone if naive."""
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=tz)
            return dt

        date_from_dt = _parse_input(date_from)
        date_to_dt = _parse_input(date_to)

        # Validate date range
        if date_from_dt >= date_to_dt:
            raise HTTPException(status_code=400, detail="date_from must be before date_to")

        if date_from_dt.year < datetime.datetime.now().year - 1:
            raise HTTPException(status_code=400, detail="date_from cannot be more than 1 year in the past")

        # Expand whole-day range (00:00 → 23:59:59.999999)
        if (
            date_from_dt.date() == date_to_dt.date()
            and date_from_dt.timetz() == time(0, tzinfo=tz)
            and date_to_dt.timetz() == time(0, tzinfo=tz)
        ):
            date_to_dt = date_to_dt.replace(hour=23, minute=59, second=59, microsecond=999999)

        # Convert to UTC for querying
        date_from_utc = date_from_dt.astimezone(utc)
        date_to_utc = date_to_dt.astimezone(utc)

        # ------------------------------------------------------------------ #
        # 3. Find user                                                       #
        # ------------------------------------------------------------------ #
        user = await prisma.users.find_first(where=usersWhereInput(external_id=user_id))
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")

        # ------------------------------------------------------------------ #
        # 4. Helper function for timezone conversion                         #
        # ------------------------------------------------------------------ #
        def _iso_local(val: str | datetime.datetime) -> str:
            dt_obj = datetime.datetime.fromisoformat(val) if isinstance(val, str) else val
            if dt_obj.tzinfo is None:  # DB can return naive UTC
                dt_obj = dt_obj.replace(tzinfo=utc)
            return dt_obj.astimezone(tz).isoformat()

        # ------------------------------------------------------------------ #
        # 5. Query based on aggregation type                                 #
        # ------------------------------------------------------------------ #
        if aggregation in {AggregationType.hour, AggregationType.day}:
            # Use SQL aggregation for hour/day
            rows: list[dict[str, Any]] = await prisma.query_raw(
                f"""
                SELECT
                    date_trunc('{aggregation.value}', date_from AT TIME ZONE 'UTC' AT TIME ZONE '{tz_name}')
                    AT TIME ZONE '{tz_name}' AT TIME ZONE 'UTC' AS bucket,
                    SUM(value)::int AS total
                FROM   health_data_points
                WHERE  user_id  = $1::uuid
                AND    type     = 'steps'
                AND    date_from >= $2::timestamptz
                AND    date_to   <= $3::timestamptz
                GROUP  BY bucket
                ORDER  BY bucket
                LIMIT 300
                """,
                user.id,
                date_from_utc,
                date_to_utc,
            )

            result_data = [
                StepDataPoint(
                    created_at=_iso_local(row["bucket"]),
                    value=row["total"],
                )
                for row in rows
            ]

        elif aggregation == AggregationType.quarter:
            # Get raw data for quarter-hour aggregation
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
                return GetStepsResponse(data=[], total_count=0)

            # Quarter-hour aggregation logic
            bucket_totals: dict[str, int] = defaultdict(int)

            def _parse_for_quarter(val: str | datetime.datetime) -> datetime.datetime:
                dt_obj = datetime.datetime.fromisoformat(val) if isinstance(val, str) else val
                if dt_obj.tzinfo is None:
                    dt_obj = dt_obj.replace(tzinfo=tz)
                return dt_obj

            for dp in steps_data:
                start_dt = _parse_for_quarter(dp.date_from)
                local_dt = start_dt.astimezone(tz)
                floored_minute = (local_dt.minute // 15) * 15
                bucket_dt = local_dt.replace(minute=floored_minute, second=0, microsecond=0)
                bucket_key = bucket_dt.isoformat()
                bucket_totals[bucket_key] += dp.value

            sorted_rows = sorted(bucket_totals.items())[:300]
            result_data = [StepDataPoint(created_at=key, value=total) for key, total in sorted_rows]

        else:
            # This shouldn't happen due to enum validation, but just in case
            raise HTTPException(status_code=400, detail="Invalid aggregation type")

        return GetStepsResponse(data=result_data, total_count=len(result_data))

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving steps data: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e
