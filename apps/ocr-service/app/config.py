"""
Configuration settings for OCR Service
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings"""
    
    # Service Configuration
    SERVICE_NAME: str = "ocr-service"
    SERVICE_PORT: int = 8001
    SERVICE_HOST: str = "0.0.0.0"
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    
    # API Keys
    OPENAI_API_KEY: str = ""
    
    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: str = ""
    
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost:5432/contract_ai"
    
    # OCR Configuration
    OCR_ENGINE: str = "paddle"  # paddle, tesseract, or hybrid
    OCR_LANGUAGE: str = "en"
    OCR_CONFIDENCE_THRESHOLD: float = 0.7
    MAX_IMAGE_SIZE_MB: int = 50
    SUPPORTED_FILE_TYPES: str = "pdf,png,jpg,jpeg,tiff,bmp,docx,doc,txt,rtf"
    
    # Tesseract Configuration
    TESSERACT_CMD: str = "/usr/bin/tesseract"
    TESSERACT_LANG: str = "eng"
    
    # PaddleOCR Configuration
    PADDLE_USE_GPU: bool = False
    PADDLE_ENABLE_MKLDNN: bool = True
    PADDLE_CPU_THREADS: int = 4
    
    # Document Processing
    ENABLE_LAYOUT_ANALYSIS: bool = True
    ENABLE_TABLE_EXTRACTION: bool = True
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    
    # Performance
    MAX_WORKERS: int = 4
    BATCH_SIZE: int = 10
    TIMEOUT_SECONDS: int = 300
    
    # Storage
    TEMP_UPLOAD_DIR: str = "/tmp/ocr-uploads"
    OUTPUT_DIR: str = "/tmp/ocr-output"
    CLEANUP_AFTER_PROCESSING: bool = True
    
    # Monitoring
    ENABLE_METRICS: bool = True
    METRICS_PORT: int = 9090
    
    # API Service URLs
    API_SERVICE_URL: str = "http://localhost:3001"
    NOTIFICATION_SERVICE_URL: str = "http://localhost:8002"
    
    @property
    def supported_file_types_list(self) -> List[str]:
        """Get supported file types as list"""
        return [ft.strip() for ft in self.SUPPORTED_FILE_TYPES.split(",")]
    
    @property
    def redis_url(self) -> str:
        """Get Redis connection URL"""
        if self.REDIS_PASSWORD:
            return f"redis://:{self.REDIS_PASSWORD}@{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
