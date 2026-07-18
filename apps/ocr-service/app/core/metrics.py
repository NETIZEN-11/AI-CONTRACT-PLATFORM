"""
Prometheus metrics for OCR service
"""
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from fastapi import FastAPI, Response
from loguru import logger

from app.config import settings


# Define metrics
ocr_requests_total = Counter(
    'ocr_requests_total',
    'Total number of OCR requests',
    ['endpoint', 'status']
)

ocr_processing_duration = Histogram(
    'ocr_processing_duration_seconds',
    'OCR processing duration in seconds',
    ['file_type']
)

ocr_file_size = Histogram(
    'ocr_file_size_bytes',
    'Size of processed files in bytes',
    ['file_type']
)

ocr_confidence = Histogram(
    'ocr_confidence_score',
    'OCR confidence scores',
    ['engine', 'file_type']
)

ocr_active_requests = Gauge(
    'ocr_active_requests',
    'Number of active OCR requests'
)

ocr_errors_total = Counter(
    'ocr_errors_total',
    'Total number of OCR errors',
    ['error_type']
)


def setup_metrics(app: FastAPI):
    """Setup metrics endpoint"""
    
    @app.get("/metrics")
    async def metrics():
        """Expose Prometheus metrics"""
        return Response(
            content=generate_latest(),
            media_type=CONTENT_TYPE_LATEST,
        )
    
    logger.info("Metrics endpoint configured at /metrics")
