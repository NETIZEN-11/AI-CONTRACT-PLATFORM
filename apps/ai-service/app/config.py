"""
Configuration settings for AI Service
"""
from pydantic_settings import BaseSettings
from typing import List, Optional


class Settings(BaseSettings):
    """Application settings"""
    
    # Service Configuration
    SERVICE_NAME: str = "ai-service"
    SERVICE_PORT: int = 8000
    SERVICE_HOST: str = "0.0.0.0"
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    
    # AI Model Configuration
    PRIMARY_LLM_PROVIDER: str = "openai"
    PRIMARY_MODEL: str = "gpt-4-turbo-preview"
    FALLBACK_LLM_PROVIDER: str = "anthropic"
    FALLBACK_MODEL: str = "claude-3-sonnet-20240229"
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    
    # API Keys
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    GOOGLE_API_KEY: str = ""
    
    # Temperature & Token Settings
    DEFAULT_TEMPERATURE: float = 0.1
    MAX_TOKENS: int = 4096
    CONTEXT_WINDOW: int = 128000
    
    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 1
    REDIS_PASSWORD: str = ""
    
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost:5432/contract_ai"
    
    # Qdrant Vector Store
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    QDRANT_API_KEY: str = ""
    QDRANT_COLLECTION_NAME: str = "contract_embeddings"
    VECTOR_DIMENSION: int = 1536
    
    # Analysis Configuration
    ENABLE_CLAUSE_EXTRACTION: bool = True
    ENABLE_RISK_DETECTION: bool = True
    ENABLE_COMPLIANCE_CHECK: bool = True
    ENABLE_ENTITY_EXTRACTION: bool = True
    ENABLE_SUMMARIZATION: bool = True
    
    # Risk Detection
    RISK_CONFIDENCE_THRESHOLD: float = 0.7
    CRITICAL_RISK_KEYWORDS: str = "unlimited liability,indemnification,warranty,termination"
    HIGH_RISK_KEYWORDS: str = "payment,confidentiality,intellectual property"
    
    # Compliance Frameworks
    ENABLE_GDPR_CHECK: bool = True
    ENABLE_HIPAA_CHECK: bool = True
    ENABLE_SOC2_CHECK: bool = True
    ENABLE_ISO27001_CHECK: bool = True
    
    # Performance
    MAX_WORKERS: int = 4
    BATCH_SIZE: int = 5
    TIMEOUT_SECONDS: int = 300
    ENABLE_CACHING: bool = True
    CACHE_TTL_SECONDS: int = 3600
    
    # Rate Limiting
    ENABLE_RATE_LIMITING: bool = True
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # Monitoring
    ENABLE_METRICS: bool = True
    METRICS_PORT: int = 9091
    SENTRY_DSN: str = ""
    
    # External Services
    API_SERVICE_URL: str = "http://localhost:3001"
    OCR_SERVICE_URL: str = "http://localhost:8001"
    NOTIFICATION_SERVICE_URL: str = "http://localhost:8002"
    
    # Feature Flags
    ENABLE_MULTI_MODEL_COMPARISON: bool = False
    ENABLE_EXPERIMENTAL_FEATURES: bool = False
    ENABLE_CHAIN_OF_THOUGHT: bool = True
    
    @property
    def redis_url(self) -> str:
        """Get Redis connection URL"""
        if self.REDIS_PASSWORD:
            return f"redis://:{self.REDIS_PASSWORD}@{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
    
    @property
    def qdrant_url(self) -> str:
        """Get Qdrant connection URL"""
        return f"http://{self.QDRANT_HOST}:{self.QDRANT_PORT}"
    
    @property
    def critical_risk_keywords_list(self) -> List[str]:
        """Get critical risk keywords as list"""
        return [k.strip() for k in self.CRITICAL_RISK_KEYWORDS.split(",")]
    
    @property
    def high_risk_keywords_list(self) -> List[str]:
        """Get high risk keywords as list"""
        return [k.strip() for k in self.HIGH_RISK_KEYWORDS.split(",")]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
