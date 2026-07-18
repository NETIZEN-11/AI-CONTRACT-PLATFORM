"""
Schemas for AI Service
"""
from app.schemas.analysis import (
    ContractAnalysisRequest,
    ContractAnalysisResponse,
    ClauseExtractionRequest,
    ClauseExtractionResponse,
    RiskDetectionRequest,
    RiskDetectionResponse,
    ComplianceCheckRequest,
    ComplianceCheckResponse,
    SummaryRequest,
    SummaryResponse,
)
from app.schemas.chat import ChatRequest, ChatResponse, Message
from app.schemas.search import SearchRequest, SearchResponse, SearchResult

__all__ = [
    "ContractAnalysisRequest",
    "ContractAnalysisResponse",
    "ClauseExtractionRequest",
    "ClauseExtractionResponse",
    "RiskDetectionRequest",
    "RiskDetectionResponse",
    "ComplianceCheckRequest",
    "ComplianceCheckResponse",
    "SummaryRequest",
    "SummaryResponse",
    "ChatRequest",
    "ChatResponse",
    "Message",
    "SearchRequest",
    "SearchResponse",
    "SearchResult",
]
