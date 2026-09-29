from sqlalchemy import Column, Integer, String, Enum, DateTime
from sqlalchemy.sql import func
import enum
from .base import Base

class JobStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class PreprocessingJob(Base):
    __tablename__ = "preprocessing_jobs"

    id = Column(Integer, primary_key=True, index=True)
    source_system = Column(String(50), default="holora_medical")
    source_image_id = Column(Integer, nullable=False)
    source_consultation_id = Column(Integer, nullable=True)
    
    modality = Column(String(20), nullable=True) # xray, ct, mri
    body_part = Column(String(50), nullable=True) # chest, knee, etc.
    
    status = Column(Enum(JobStatus), default=JobStatus.PENDING)
    error_message = Column(String(255), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
