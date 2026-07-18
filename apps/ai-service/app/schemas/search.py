"""
Pydantic schemas for Search endpoints
"""
from pydantic import BaseModel
from typing import List, Dict, Any, Optional


class SearchResult(BaseModel):
    """Search result"""
    id: str
    score: float
    contract_id: Optional[str] = None
    clause_id: Optional[str] = None
    clause_type: Optional[str] = None
    text: str
    metadata: Optional[Dict[str, Any]] = None


class SearchRequest(BaseModel):
    """Search request"""
    query: str
    search_type: Optional[str] = "contract"  # "contract", "clause"
    clause_type: Optional[str] = None
    limit: Optional[int] = 10
    score_threshold: Optional[float] = 0.7


class SearchResponse(BaseModel):
    """Search response"""
    success: bool
    results: List[SearchResult]
    total: int
