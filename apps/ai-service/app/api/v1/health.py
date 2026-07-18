"""
Health check endpoints
"""
from fastapi import APIRouter
from app.core.llm_manager import LLMManager
from app.core.vector_store import VectorStoreManager
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
    llm_ready = await LLMManager.is_ready()
    vector_ready = VectorStoreManager._client is not None
    
    return {
        "status": "ready" if llm_ready else "not_ready",
        "llm_provider": settings.PRIMARY_LLM_PROVIDER,
        "model": settings.PRIMARY_MODEL,
        "llm_ready": llm_ready,
        "vector_store_ready": vector_ready,
    }


@router.get("/live")
async def liveness_check():
    """Liveness probe"""
    return {"status": "alive"}
