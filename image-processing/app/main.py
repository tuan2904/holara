from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from .config import settings
from .database import engine, Base
from .models import PreprocessingJob, PreprocessingResult # Import models to register them with Base

app = FastAPI(
    title=settings.PROJECT_NAME
)

# Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    # Tạo các bảng nếu chưa tồn tại
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

from .api.v1.api import api_router

# Đăng ký Router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Mount các thư mục chứa ảnh để có thể truy cập qua URL
# Sử dụng đường dẫn tuyệt đối dựa trên thư mục hiện tại của file main.py
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) # Is /app
UPLOADS_ABS = os.path.join(BASE_DIR, "uploads")
PROCESSED_ABS = os.path.join(BASE_DIR, "processed")

if not os.path.exists(UPLOADS_ABS):
    os.makedirs(UPLOADS_ABS)
if not os.path.exists(PROCESSED_ABS):
    os.makedirs(PROCESSED_ABS)

app.mount("/uploads", StaticFiles(directory=UPLOADS_ABS), name="uploads")
app.mount("/processed", StaticFiles(directory=PROCESSED_ABS), name="processed")

@app.get("/")
async def root():
    return {"message": f"Welcome to {settings.PROJECT_NAME} API", "docs": "/docs"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": settings.PROJECT_NAME}
