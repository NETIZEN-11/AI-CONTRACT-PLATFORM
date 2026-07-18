"""
Search endpoints
"""
from fastapi import APIRouter, HTTPException
from loguru import logger

from app.core.llm_manager import LLMManager
from app.core.vector_store import VectorStoreManager
from app.schemas.search import (
    SearchRequest,
    SearchResponse,
    SearchResult,
)

router = APIRouter()


@router.post("/", response_model=SearchResponse)
async def search(request: SearchRequest):
    """
    Search contracts or clauses
    """
    try:
        logger.info(f"Processing search query: {request.query}")
        
        # Generate embedding for query
        query_embedding = await LLMManager.generate_embedding(request.query)
        
        # Search
        if request.search_type == "clause":
            results = await VectorStoreManager.search_similar_clauses(
                query_embedding=query_embedding,
                clause_type=request.clause_type,
                limit=request.limit or 10,
            )
        else:
            results = await VectorStoreManager.search_similar_contracts(
                query_embedding=query_embedding,
                limit=request.limit or 10,
                score_threshold=request.score_threshold or 0.7,
            )
        
        # Convert to SearchResult objects
        search_results = []
        for result in results:
            search_results.append(SearchResult(
                id=result["id"],
                score=result["score"],
                contract_id=result.get("payload", {}).get("contract_id"),
                clause_id=result.get("payload", {}).get("clause_id"),
                clause_type=result.get("payload", {}).get("clause_type"),
                text=result.get("payload", {}).get("text", ""),
                metadata=result.get("payload", {}).get("metadata"),
            ))
        
        return SearchResponse(
            success=True,
            results=search_results,
            total=len(search_results),
        )
        
    except Exception as e:
        logger.error(f"Search failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Search failed: {str(e)}"
        )
