"""
AI Service - Main Application
Intelligent contract analysis using LLMs and LangGraph
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger
import sys

from app.config import settings
from app.api.v1 import router as api_v1_router
from app.core.llm_manager import LLMManager
from app.core.vector_store import VectorStoreManager
from app.core.metrics import setup_metrics


# Configure logging
logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level=settings.LOG_LEVEL,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    logger.info(f"Starting {settings.SERVICE_NAME} v0.1.0")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Primary LLM: {settings.PRIMARY_LLM_PROVIDER}/{settings.PRIMARY_MODEL}")
    
    # Initialize LLM Manager
    try:
        await LLMManager.initialize()
        logger.info("✅ LLM Manager initialized successfully")
    except Exception as e:
        logger.error(f"❌ Failed to initialize LLM Manager: {e}")
    
    # Initialize Vector Store
    try:
        await VectorStoreManager.initialize()
        logger.info("✅ Vector Store initialized successfully")
    except Exception as e:
        logger.warning(f"⚠️  Vector Store initialization warning: {e}")
    
    # Setup metrics if enabled
    if settings.ENABLE_METRICS:
        setup_metrics(app)
        logger.info(f"✅ Metrics enabled on port {settings.METRICS_PORT}")
    
    yield
    
    # Cleanup
    logger.info("Shutting down AI service...")
    await LLMManager.cleanup()
    await VectorStoreManager.cleanup()


# Create FastAPI app
app = FastAPI(
    title="Contract AI - AI Analysis Service",
    description="Intelligent contract analysis using LLMs and LangGraph",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(api_v1_router, prefix="/api/v1")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": settings.SERVICE_NAME,
        "version": "0.1.0",
        "status": "running",
        "docs": "/docs",
        "capabilities": [
            "contract_analysis",
            "clause_extraction",
            "risk_detection",
            "compliance_check",
            "summarization",
            "entity_extraction",
        ],
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": settings.SERVICE_NAME,
        "environment": settings.ENVIRONMENT,
        "llm_provider": settings.PRIMARY_LLM_PROVIDER,
        "model": settings.PRIMARY_MODEL,
    }


@app.get("/ready")
async def readiness_check():
    """Readiness check endpoint"""
    try:
        # Check if LLM is ready
        is_ready = await LLMManager.is_ready()
        if not is_ready:
            return JSONResponse(
                status_code=503,
                content={"status": "not_ready", "message": "LLM not initialized"},
            )
        
        return {"status": "ready", "message": "Service is ready to accept requests"}
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        return JSONResponse(
            status_code=503,
            content={"status": "not_ready", "error": str(e)},
        )


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)},
    )


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host=settings.SERVICE_HOST,
        port=settings.SERVICE_PORT,
        reload=settings.ENVIRONMENT == "development",
        log_level=settings.LOG_LEVEL.lower(),
    )
