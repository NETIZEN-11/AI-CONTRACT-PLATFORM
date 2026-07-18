"""
Health check endpoints
"""
from fastapi import APIRouter
from app.core.ocr_engine import OCREngineManager
from app.config import settings

router = APIRouter()


@router.get("/")
async def health_check():
    """Basic health check"""
    return {
        "status": "healthy",
        "service": settings.SERVICE_NAME,
        "version": "0.1.0",
    }


@router.get("/ready")
async def readiness_check():
    """Check if service is ready to accept requests"""
    is_ready = OCREngineManager.is_ready()
    
    return {
        "status": "ready" if is_ready else "not_ready",
        "ocr_engine": settings.OCR_ENGINE,
        "ocr_available": is_ready,
    }


@router.get("/live")
async def liveness_check():
    """Liveness probe"""
    return {"status": "alive"}
