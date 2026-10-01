from fastapi import APIRouter
from .endpoints import jobs

api_router = APIRouter()
api_router.include_router(jobs.router, tags=["jobs"])
