"""
LLM Manager
Handles multiple LLM providers (OpenAI, Anthropic, Google)
"""
from typing import Optional, Dict, Any, List
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema import BaseMessage, HumanMessage, SystemMessage, AIMessage
from loguru import logger

from app.config import settings


class LLMManager:
    """Singleton LLM manager"""
    
    _primary_llm: Optional[Any] = None
    _fallback_llm: Optional[Any] = None
    _embeddings: Optional[Any] = None
    
    @classmethod
    async def initialize(cls):
        """Initialize LLM instances"""
        if cls._primary_llm is not None:
            return
        
        # Initialize primary LLM
        cls._primary_llm = cls._create_llm(
            provider=settings.PRIMARY_LLM_PROVIDER,
            model=settings.PRIMARY_MODEL,
        )
        logger.info(f"✅ Primary LLM: {settings.PRIMARY_LLM_PROVIDER}/{settings.PRIMARY_MODEL}")
        
        # Initialize fallback LLM
        if settings.FALLBACK_LLM_PROVIDER:
            cls._fallback_llm = cls._create_llm(
                provider=settings.FALLBACK_LLM_PROVIDER,
                model=settings.FALLBACK_MODEL,
            )
            logger.info(f"✅ Fallback LLM: {settings.FALLBACK_LLM_PROVIDER}/{settings.FALLBACK_MODEL}")
        
        # Initialize embeddings
        cls._embeddings = OpenAIEmbeddings(
            model=settings.EMBEDDING_MODEL,
            openai_api_key=settings.OPENAI_API_KEY,
        )
        logger.info(f"✅ Embeddings: {settings.EMBEDDING_MODEL}")
    
    @classmethod
    def _create_llm(cls, provider: str, model: str) -> Any:
        """Create LLM instance based on provider"""
        provider = provider.lower()
        
        if provider == "openai":
            return ChatOpenAI(
                model=model,
                temperature=settings.DEFAULT_TEMPERATURE,
                max_tokens=settings.MAX_TOKENS,
                openai_api_key=settings.OPENAI_API_KEY,
            )
        
        elif provider == "anthropic":
            return ChatAnthropic(
                model=model,
                temperature=settings.DEFAULT_TEMPERATURE,
                max_tokens=settings.MAX_TOKENS,
                anthropic_api_key=settings.ANTHROPIC_API_KEY,
            )
        
        elif provider == "google":
            return ChatGoogleGenerativeAI(
                model=model,
                temperature=settings.DEFAULT_TEMPERATURE,
                google_api_key=settings.GOOGLE_API_KEY,
            )
        
        else:
            raise ValueError(f"Unknown LLM provider: {provider}")
    
    @classmethod
    def get_primary_llm(cls) -> Any:
        """Get primary LLM instance"""
        if cls._primary_llm is None:
            raise RuntimeError("LLM Manager not initialized. Call initialize() first.")
        return cls._primary_llm
    
    @classmethod
    def get_fallback_llm(cls) -> Optional[Any]:
        """Get fallback LLM instance"""
        return cls._fallback_llm
    
    @classmethod
    def get_embeddings(cls) -> Any:
        """Get embeddings instance"""
        if cls._embeddings is None:
            raise RuntimeError("Embeddings not initialized. Call initialize() first.")
        return cls._embeddings
    
    @classmethod
    async def invoke_with_fallback(
        cls,
        messages: List[BaseMessage],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> str:
        """Invoke LLM with automatic fallback"""
        try:
            # Try primary LLM
            llm = cls.get_primary_llm()
            
            if temperature is not None:
                llm.temperature = temperature
            if max_tokens is not None:
                llm.max_tokens = max_tokens
            
            response = await llm.ainvoke(messages)
            return response.content
        
        except Exception as e:
            logger.warning(f"Primary LLM failed: {e}")
            
            # Try fallback LLM
            if cls._fallback_llm:
                try:
                    logger.info("Attempting fallback LLM...")
                    response = await cls._fallback_llm.ainvoke(messages)
                    return response.content
                except Exception as fallback_error:
                    logger.error(f"Fallback LLM also failed: {fallback_error}")
                    raise
            else:
                raise
    
    @classmethod
    async def generate_embedding(cls, text: str) -> List[float]:
        """Generate embedding for text"""
        embeddings = cls.get_embeddings()
        return await embeddings.aembed_query(text)
    
    @classmethod
    async def generate_embeddings_batch(cls, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts"""
        embeddings = cls.get_embeddings()
        return await embeddings.aembed_documents(texts)
    
    @classmethod
    async def is_ready(cls) -> bool:
        """Check if LLM is ready"""
        return cls._primary_llm is not None and cls._embeddings is not None
    
    @classmethod
    async def cleanup(cls):
        """Cleanup LLM instances"""
        cls._primary_llm = None
        cls._fallback_llm = None
        cls._embeddings = None
        logger.info("LLM Manager cleaned up")
    
    @classmethod
    def create_messages(
        cls,
        system_prompt: str,
        user_prompt: str,
        context: Optional[str] = None,
    ) -> List[BaseMessage]:
        """Create message list for LLM"""
        messages = [SystemMessage(content=system_prompt)]
        
        if context:
            messages.append(HumanMessage(content=f"Context:\n{context}"))
        
        messages.append(HumanMessage(content=user_prompt))
        
        return messages
    
    @classmethod
    async def count_tokens(cls, text: str) -> int:
        """Estimate token count for text"""
        try:
            import tiktoken
            encoding = tiktoken.encoding_for_model("gpt-4")
            return len(encoding.encode(text))
        except Exception:
            # Rough estimation: 1 token ≈ 4 characters
            return len(text) // 4
