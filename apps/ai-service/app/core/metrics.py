"""
Prometheus metrics for AI service
"""
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from fastapi import FastAPI, Response
from loguru import logger

from app.config import settings


# Define metrics
analysis_requests_total = Counter(
    'analysis_requests_total',
    'Total number of analysis requests',
    ['endpoint', 'status']
)

analysis_duration = Histogram(
    'analysis_duration_seconds',
    'Contract analysis duration in seconds',
    ['contract_type']
)

tokens_used_total = Counter(
    'tokens_used_total',
    'Total tokens used',
    ['model']
)

llm_requests_total = Counter(
    'llm_requests_total',
    'Total LLM requests',
    ['provider', 'status']
)

active_analysis = Gauge(
    'active_analysis',
    'Number of active analysis jobs'
)

errors_total = Counter(
    'errors_total',
    'Total number of errors',
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
