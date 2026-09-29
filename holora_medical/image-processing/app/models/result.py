from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.sql import func
from .base import Base

class PreprocessingResult(Base):
    __tablename__ = "preprocessing_results"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("preprocessing_jobs.id"), nullable=False)
    
    source_image_path = Column(String(255), nullable=False)
    processed_image_path = Column(String(255), nullable=True) # Denoiser, Contrast
    edge_image_path = Column(String(255), nullable=True) # Canny Edge
    mask_image_path = Column(String(255), nullable=True) # Segmentation Mask
    roi_image_path = Column(String(255), nullable=True) # ROI crop
    
    metadata_json = Column(Text, nullable=True) # Extra info (JSON format)
    
    completed_at = Column(DateTime(timezone=True), server_default=func.now())
