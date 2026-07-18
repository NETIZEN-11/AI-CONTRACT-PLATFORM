"""
API v1 Router
"""
from fastapi import APIRouter

from app.api.v1 import ocr, health

router = APIRouter()

router.include_router(health.router, prefix="/health", tags=["Health"])
router.include_router(ocr.router, prefix="/ocr", tags=["OCR"])
