"""
OCR endpoints
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from pathlib import Path
import aiofiles
import uuid
import shutil
from loguru import logger

from app.config import settings
from app.core.document_processor import DocumentProcessor
from app.schemas.ocr import (
    OCRResponse,
    ProcessDocumentResponse,
    MetadataResponse,
)

router = APIRouter()


def cleanup_file(file_path: Path):
    """Background task to cleanup uploaded file"""
    try:
        if file_path.exists():
            file_path.unlink()
            logger.info(f"Cleaned up file: {file_path}")
    except Exception as e:
        logger.warning(f"Failed to cleanup file {file_path}: {e}")


@router.post("/extract", response_model=OCRResponse)
async def extract_text(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None,
):
    """
    Extract text from uploaded document
    
    Supports: PDF, DOCX, DOC, PNG, JPG, JPEG, TIFF, BMP, TXT, RTF
    """
    # Validate file type
    file_extension = Path(file.filename).suffix.lower().lstrip('.')
    if file_extension not in settings.supported_file_types_list:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Supported: {settings.SUPPORTED_FILE_TYPES}"
        )
    
    # Create temp directory if not exists
    temp_dir = Path(settings.TEMP_UPLOAD_DIR)
    temp_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    unique_id = uuid.uuid4().hex
    temp_file_path = temp_dir / f"{unique_id}_{file.filename}"
    
    try:
        # Save uploaded file
        async with aiofiles.open(temp_file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        logger.info(f"Processing file: {file.filename} ({len(content)} bytes)")
        
        # Check file size
        file_size_mb = len(content) / (1024 * 1024)
        if file_size_mb > settings.MAX_IMAGE_SIZE_MB:
            raise HTTPException(
                status_code=400,
                detail=f"File size ({file_size_mb:.2f}MB) exceeds maximum ({settings.MAX_IMAGE_SIZE_MB}MB)"
            )
        
        # Process document
        processor = DocumentProcessor()
        result = await processor.process_file(temp_file_path)
        
        # Schedule cleanup
        if settings.CLEANUP_AFTER_PROCESSING and background_tasks:
            background_tasks.add_task(cleanup_file, temp_file_path)
        
        return OCRResponse(
            success=True,
            text=result["text"],
            confidence=result.get("confidence", 0.0),
            file_name=file.filename,
            file_type=result.get("file_type", ""),
            pages=result.get("pages", []),
            blocks=result.get("blocks", []),
            metadata=result,
        )
    
    except Exception as e:
        logger.error(f"OCR extraction failed: {e}")
        
        # Cleanup on error
        if temp_file_path.exists():
            temp_file_path.unlink()
        
        raise HTTPException(
            status_code=500,
            detail=f"OCR processing failed: {str(e)}"
        )


@router.post("/process", response_model=ProcessDocumentResponse)
async def process_document(
    file: UploadFile = File(...),
    extract_metadata: bool = True,
    chunk_text: bool = False,
    background_tasks: BackgroundTasks = None,
):
    """
    Process document with advanced options
    
    - Extract text via OCR
    - Extract metadata
    - Optionally chunk text for further processing
    """
    # Validate file type
    file_extension = Path(file.filename).suffix.lower().lstrip('.')
    if file_extension not in settings.supported_file_types_list:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Supported: {settings.SUPPORTED_FILE_TYPES}"
        )
    
    # Create temp directory
    temp_dir = Path(settings.TEMP_UPLOAD_DIR)
    temp_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    unique_id = uuid.uuid4().hex
    temp_file_path = temp_dir / f"{unique_id}_{file.filename}"
    
    try:
        # Save uploaded file
        async with aiofiles.open(temp_file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        logger.info(f"Processing document: {file.filename}")
        
        # Initialize processor
        processor = DocumentProcessor()
        
        # Extract text
        extraction_result = await processor.process_file(temp_file_path)
        
        # Extract metadata if requested
        metadata = None
        if extract_metadata:
            metadata = await processor.extract_metadata(temp_file_path)
        
        # Chunk text if requested
        chunks = None
        if chunk_text:
            chunks = processor.chunk_text(extraction_result["text"])
        
        # Schedule cleanup
        if settings.CLEANUP_AFTER_PROCESSING and background_tasks:
            background_tasks.add_task(cleanup_file, temp_file_path)
        
        return ProcessDocumentResponse(
            success=True,
            text=extraction_result["text"],
            confidence=extraction_result.get("confidence", 0.0),
            file_name=file.filename,
            file_type=extraction_result.get("file_type", ""),
            pages=extraction_result.get("pages", []),
            chunks=chunks,
            metadata=metadata,
            extraction_details=extraction_result,
        )
    
    except Exception as e:
        logger.error(f"Document processing failed: {e}")
        
        # Cleanup on error
        if temp_file_path.exists():
            temp_file_path.unlink()
        
        raise HTTPException(
            status_code=500,
            detail=f"Document processing failed: {str(e)}"
        )


@router.post("/metadata", response_model=MetadataResponse)
async def extract_metadata(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None,
):
    """
    Extract metadata from document without OCR
    """
    # Validate file type
    file_extension = Path(file.filename).suffix.lower().lstrip('.')
    if file_extension not in settings.supported_file_types_list:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Supported: {settings.SUPPORTED_FILE_TYPES}"
        )
    
    # Create temp directory
    temp_dir = Path(settings.TEMP_UPLOAD_DIR)
    temp_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    unique_id = uuid.uuid4().hex
    temp_file_path = temp_dir / f"{unique_id}_{file.filename}"
    
    try:
        # Save uploaded file
        async with aiofiles.open(temp_file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        # Extract metadata
        processor = DocumentProcessor()
        metadata = await processor.extract_metadata(temp_file_path)
        
        # Schedule cleanup
        if settings.CLEANUP_AFTER_PROCESSING and background_tasks:
            background_tasks.add_task(cleanup_file, temp_file_path)
        
        return MetadataResponse(
            success=True,
            file_name=file.filename,
            metadata=metadata,
        )
    
    except Exception as e:
        logger.error(f"Metadata extraction failed: {e}")
        
        # Cleanup on error
        if temp_file_path.exists():
            temp_file_path.unlink()
        
        raise HTTPException(
            status_code=500,
            detail=f"Metadata extraction failed: {str(e)}"
        )


@router.get("/supported-formats")
async def get_supported_formats():
    """Get list of supported file formats"""
    return {
        "supported_formats": settings.supported_file_types_list,
        "max_file_size_mb": settings.MAX_IMAGE_SIZE_MB,
        "ocr_engine": settings.OCR_ENGINE,
    }
