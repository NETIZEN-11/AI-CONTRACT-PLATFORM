"""
API v1 Router
"""
from fastapi import APIRouter

from app.api.v1 import analysis, health, chat, search

router = APIRouter()

router.include_router(health.router, prefix="/health", tags=["Health"])
router.include_router(analysis.router, prefix="/analysis", tags=["Analysis"])
router.include_router(chat.router, prefix="/chat", tags=["Chat"])
router.include_router(search.router, prefix="/search", tags=["Search"])
