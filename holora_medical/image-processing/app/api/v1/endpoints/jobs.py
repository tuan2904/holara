from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Header
from secrets import compare_digest
from ....config import settings
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
import os
import uuid
import shutil

# Đường dẫn tuyệt đối tới /app/uploads và /app/processed
# __file__ = /app/app/api/v1/endpoints/jobs.py → BASE = /app
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
print(f"[jobs.py] BASE_DIR resolved to: {BASE_DIR}")

from ....database import get_db
from ....models.job import PreprocessingJob, JobStatus
from ....models.result import PreprocessingResult
from ....schemas.job import JobCreate, JobResponse, ResultResponse

from ....services.processor import process_medical_image

def require_internal_key(x_api_key: str = Header(default="")):
    if not settings.INTERNAL_API_KEY or not compare_digest(x_api_key, settings.INTERNAL_API_KEY):
        raise HTTPException(status_code=401, detail="Invalid service credentials")


router = APIRouter(dependencies=[Depends(require_internal_key)])

UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

ROUTER_PROCESSED_DIR = os.path.join(BASE_DIR, "processed")
if not os.path.exists(ROUTER_PROCESSED_DIR):
    os.makedirs(ROUTER_PROCESSED_DIR)

print(f"[jobs.py] UPLOAD_DIR = {UPLOAD_DIR}")
print(f"[jobs.py] PROCESSED_DIR = {ROUTER_PROCESSED_DIR}")

@router.post("/preprocess", response_model=JobResponse)
async def create_preprocess_job(
    source_image_id: int = Form(...),
    source_consultation_id: int = Form(None),
    modality: str = Form("xray"),
    body_part: str = Form(None),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    # 1. Lưu file ảnh gốc
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # 2. Tạo Job trong Database
    db_job = PreprocessingJob(
        source_image_id=source_image_id,
        source_consultation_id=source_consultation_id,
        modality=modality,
        body_part=body_part,
        status=JobStatus.PROCESSING # Chuyển sang trạng thái đang xử lý
    )
    db.add(db_job)
    await db.commit()
    await db.refresh(db_job)
    
    # 3. Thực hiện xử lý ảnh (Đồng bộ để demo, sau này chuyển sang BackgroundTasks/Celery)
    print(f"[jobs.py] Processing image: {file_path} → {ROUTER_PROCESSED_DIR}")
    try:
        results = process_medical_image(file_path, ROUTER_PROCESSED_DIR)
        print(f"[jobs.py] Results: {results}")
        
        # 4. Lưu Result record
        db_result = PreprocessingResult(
            job_id=db_job.id,
            source_image_path=file_path,
            processed_image_path=results["processed"],
            edge_image_path=results["edge"],
            mask_image_path=results["mask"]
        )
        db.add(db_result)
        
        # Cập nhật trạng thái Job
        db_job.status = JobStatus.COMPLETED
        await db.commit()
        
    except Exception as e:
        db_job.status = JobStatus.FAILED
        db_job.error_message = str(e)
        await db.commit()
        raise HTTPException(status_code=500, detail=f"Lỗi xử lý ảnh: {str(e)}")
    
    return db_job

@router.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job_status(job_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PreprocessingJob).where(PreprocessingJob.id == job_id))
    db_job = result.scalars().first()
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
    return db_job

@router.get("/jobs/{job_id}/result", response_model=ResultResponse)
async def get_job_result(job_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PreprocessingResult).where(PreprocessingResult.job_id == job_id))
    db_result = result.scalars().first()
    if not db_result:
        raise HTTPException(status_code=404, detail="Result not found or job still processing")
    return db_result
