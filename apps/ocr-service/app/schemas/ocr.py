"""
Pydantic schemas for OCR service
"""
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional


class OCRBlock(BaseModel):
    """OCR text block"""
    text: str
    confidence: float
    bbox: List[float] = Field(default_factory=list, description="Bounding box coordinates")


class OCRPage(BaseModel):
    """OCR page result"""
    page: int
    text: str
    confidence: float
    method: str = Field(description="Extraction method: native, ocr")
    blocks: List[OCRBlock] = Field(default_factory=list)


class OCRResponse(BaseModel):
    """OCR extraction response"""
    success: bool
    text: str
    confidence: float
    file_name: str
    file_type: str
    pages: List[OCRPage] = Field(default_factory=list)
    blocks: List[OCRBlock] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class ProcessDocumentResponse(BaseModel):
    """Advanced document processing response"""
    success: bool
    text: str
    confidence: float
    file_name: str
    file_type: str
    pages: List[OCRPage] = Field(default_factory=list)
    chunks: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None
    extraction_details: Dict[str, Any] = Field(default_factory=dict)


class MetadataResponse(BaseModel):
    """Metadata extraction response"""
    success: bool
    file_name: str
    metadata: Dict[str, Any]


class BatchOCRRequest(BaseModel):
    """Batch OCR request"""
    file_urls: List[str]
    extract_metadata: bool = True
    chunk_text: bool = False


class BatchOCRResponse(BaseModel):
    """Batch OCR response"""
    success: bool
    total: int
    processed: int
    failed: int
    results: List[ProcessDocumentResponse]
    errors: List[Dict[str, str]] = Field(default_factory=list)
