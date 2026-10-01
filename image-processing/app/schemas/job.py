from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from ..models.job import JobStatus

class JobBase(BaseModel):
    source_image_id: int
    source_consultation_id: Optional[int] = None
    modality: Optional[str] = "xray"
    body_part: Optional[str] = None

class JobCreate(JobBase):
    pass

class JobResponse(JobBase):
    id: int
    status: JobStatus
    created_at: datetime
    
    class Config:
        from_attributes = True

class ResultResponse(BaseModel):
    id: int
    job_id: int
    processed_image_path: Optional[str]
    edge_image_path: Optional[str]
    mask_image_path: Optional[str]
    roi_image_path: Optional[str]
    completed_at: datetime

    class Config:
        from_attributes = True
