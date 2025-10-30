from datetime import datetime
from enum import Enum

from pydantic import BaseModel
from prisma.enums import health_data_unit, health_platform


class LastSyncedResponse(BaseModel):
    last_synced: datetime


class SyncStepData(BaseModel):
    value: int
    unit: health_data_unit
    date_from: datetime
    date_to: datetime
    source_uuid: str | None = None
    health_platform: health_platform
    source_device_id: str
    source_id: str
    source_name: str


class SyncStepsInput(BaseModel):
    user_id: str
    data_points: list[SyncStepData]


class AggregationType(str, Enum):
    quarter = "quarter"
    hour = "hour"  
    day = "day"


class StepDataPoint(BaseModel):
    created_at: str
    value: int
    date_from: str | None = None
    date_to: str | None = None


class GetStepsResponse(BaseModel):
    data: list[StepDataPoint]
    total_count: int
