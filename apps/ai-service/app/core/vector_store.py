"""
Vector Store Manager
Handles Qdrant vector database operations
"""
from typing import Optional, List, Dict, Any
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
)
from loguru import logger
import uuid

from app.config import settings


class VectorStoreManager:
    """Singleton vector store manager"""
    
    _client: Optional[QdrantClient] = None
    _collection_name: str = settings.QDRANT_COLLECTION_NAME
    
    @classmethod
    async def initialize(cls):
        """Initialize Qdrant client and collection"""
        if cls._client is not None:
            return
        
        try:
            # Initialize client
            cls._client = QdrantClient(
                host=settings.QDRANT_HOST,
                port=settings.QDRANT_PORT,
                api_key=settings.QDRANT_API_KEY if settings.QDRANT_API_KEY else None,
                timeout=30,
            )
            
            # Check if collection exists
            collections = cls._client.get_collections().collections
            collection_names = [col.name for col in collections]
            
            if cls._collection_name not in collection_names:
                # Create collection
                cls._client.create_collection(
                    collection_name=cls._collection_name,
                    vectors_config=VectorParams(
                        size=settings.VECTOR_DIMENSION,
                        distance=Distance.COSINE,
                    ),
                )
                logger.info(f"✅ Created Qdrant collection: {cls._collection_name}")
            else:
                logger.info(f"✅ Connected to existing collection: {cls._collection_name}")
        
        except Exception as e:
            logger.warning(f"⚠️  Vector store initialization warning: {e}")
            cls._client = None
    
    @classmethod
    def get_client(cls) -> QdrantClient:
        """Get Qdrant client"""
        if cls._client is None:
            raise RuntimeError("Vector store not initialized. Call initialize() first.")
        return cls._client
    
    @classmethod
    async def store_contract_embedding(
        cls,
        contract_id: str,
        text: str,
        embedding: List[float],
        metadata: Optional[Dict[str, Any]] = None,
    ) -> str:
        """Store contract embedding"""
        try:
            client = cls.get_client()
            
            point_id = str(uuid.uuid4())
            payload = {
                "contract_id": contract_id,
                "text": text[:1000],  # Store first 1000 chars
                "metadata": metadata or {},
            }
            
            point = PointStruct(
                id=point_id,
                vector=embedding,
                payload=payload,
            )
            
            client.upsert(
                collection_name=cls._collection_name,
                points=[point],
            )
            
            logger.info(f"Stored embedding for contract: {contract_id}")
            return point_id
        
        except Exception as e:
            logger.error(f"Failed to store embedding: {e}")
            raise
    
    @classmethod
    async def store_clause_embedding(
        cls,
        clause_id: str,
        contract_id: str,
        clause_text: str,
        embedding: List[float],
        clause_type: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> str:
        """Store clause embedding"""
        try:
            client = cls.get_client()
            
            point_id = str(uuid.uuid4())
            payload = {
                "clause_id": clause_id,
                "contract_id": contract_id,
                "clause_type": clause_type,
                "text": clause_text,
                "metadata": metadata or {},
            }
            
            point = PointStruct(
                id=point_id,
                vector=embedding,
                payload=payload,
            )
            
            client.upsert(
                collection_name=cls._collection_name,
                points=[point],
            )
            
            logger.info(f"Stored clause embedding: {clause_id}")
            return point_id
        
        except Exception as e:
            logger.error(f"Failed to store clause embedding: {e}")
            raise
    
    @classmethod
    async def search_similar_contracts(
        cls,
        query_embedding: List[float],
        limit: int = 10,
        score_threshold: float = 0.7,
    ) -> List[Dict[str, Any]]:
        """Search for similar contracts"""
        try:
            client = cls.get_client()
            
            results = client.search(
                collection_name=cls._collection_name,
                query_vector=query_embedding,
                limit=limit,
                score_threshold=score_threshold,
                with_payload=True,
            )
            
            return [
                {
                    "id": result.id,
                    "score": result.score,
                    "payload": result.payload,
                }
                for result in results
            ]
        
        except Exception as e:
            logger.error(f"Search failed: {e}")
            return []
    
    @classmethod
    async def search_similar_clauses(
        cls,
        query_embedding: List[float],
        clause_type: Optional[str] = None,
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """Search for similar clauses"""
        try:
            client = cls.get_client()
            
            # Build filter if clause_type specified
            query_filter = None
            if clause_type:
                query_filter = Filter(
                    must=[
                        FieldCondition(
                            key="clause_type",
                            match=MatchValue(value=clause_type),
                        )
                    ]
                )
            
            results = client.search(
                collection_name=cls._collection_name,
                query_vector=query_embedding,
                query_filter=query_filter,
                limit=limit,
                with_payload=True,
            )
            
            return [
                {
                    "id": result.id,
                    "score": result.score,
                    "clause_text": result.payload.get("text", ""),
                    "clause_type": result.payload.get("clause_type", ""),
                    "contract_id": result.payload.get("contract_id", ""),
                }
                for result in results
            ]
        
        except Exception as e:
            logger.error(f"Clause search failed: {e}")
            return []
    
    @classmethod
    async def delete_contract_embeddings(cls, contract_id: str) -> bool:
        """Delete all embeddings for a contract"""
        try:
            client = cls.get_client()
            
            # Delete points with matching contract_id
            client.delete(
                collection_name=cls._collection_name,
                points_selector=Filter(
                    must=[
                        FieldCondition(
                            key="contract_id",
                            match=MatchValue(value=contract_id),
                        )
                    ]
                ),
            )
            
            logger.info(f"Deleted embeddings for contract: {contract_id}")
            return True
        
        except Exception as e:
            logger.error(f"Failed to delete embeddings: {e}")
            return False
    
    @classmethod
    async def get_collection_info(cls) -> Dict[str, Any]:
        """Get collection information"""
        try:
            client = cls.get_client()
            info = client.get_collection(collection_name=cls._collection_name)
            
            return {
                "name": cls._collection_name,
                "vectors_count": info.vectors_count,
                "points_count": info.points_count,
                "status": info.status,
            }
        except Exception as e:
            logger.error(f"Failed to get collection info: {e}")
            return {}
    
    @classmethod
    async def cleanup(cls):
        """Cleanup vector store"""
        if cls._client:
            cls._client.close()
        cls._client = None
        logger.info("Vector store cleaned up")
