"""
OCR Engine Manager
Handles multiple OCR engines (PaddleOCR, Tesseract)
"""
from typing import Optional, List, Dict, Any
from abc import ABC, abstractmethod
import numpy as np
from PIL import Image
from loguru import logger

from app.config import settings


class OCREngine(ABC):
    """Abstract base class for OCR engines"""
    
    @abstractmethod
    def extract_text(self, image: np.ndarray) -> Dict[str, Any]:
        """Extract text from image"""
        pass
    
    @abstractmethod
    def is_available(self) -> bool:
        """Check if engine is available"""
        pass


class PaddleOCREngine(OCREngine):
    """PaddleOCR engine implementation"""
    
    def __init__(self):
        self.ocr = None
        self._initialize()
    
    def _initialize(self):
        """Initialize PaddleOCR"""
        try:
            from paddleocr import PaddleOCR
            
            self.ocr = PaddleOCR(
                use_angle_cls=True,
                lang=settings.OCR_LANGUAGE,
                use_gpu=settings.PADDLE_USE_GPU,
                enable_mkldnn=settings.PADDLE_ENABLE_MKLDNN,
                cpu_threads=settings.PADDLE_CPU_THREADS,
                show_log=False,
            )
            logger.info("✅ PaddleOCR initialized successfully")
        except Exception as e:
            logger.error(f"❌ Failed to initialize PaddleOCR: {e}")
            self.ocr = None
    
    def extract_text(self, image: np.ndarray) -> Dict[str, Any]:
        """Extract text using PaddleOCR"""
        if not self.ocr:
            raise RuntimeError("PaddleOCR not initialized")
        
        try:
            result = self.ocr.ocr(image, cls=True)
            
            if not result or not result[0]:
                return {
                    "text": "",
                    "confidence": 0.0,
                    "blocks": [],
                    "engine": "paddle",
                }
            
            # Parse results
            blocks = []
            full_text = []
            total_confidence = 0.0
            
            for line in result[0]:
                box, (text, confidence) = line
                blocks.append({
                    "text": text,
                    "confidence": confidence,
                    "bbox": box,
                })
                full_text.append(text)
                total_confidence += confidence
            
            avg_confidence = total_confidence / len(blocks) if blocks else 0.0
            
            return {
                "text": "\n".join(full_text),
                "confidence": avg_confidence,
                "blocks": blocks,
                "engine": "paddle",
            }
        except Exception as e:
            logger.error(f"PaddleOCR extraction failed: {e}")
            raise
    
    def is_available(self) -> bool:
        """Check if PaddleOCR is available"""
        return self.ocr is not None


class TesseractEngine(OCREngine):
    """Tesseract OCR engine implementation"""
    
    def __init__(self):
        self.tesseract = None
        self._initialize()
    
    def _initialize(self):
        """Initialize Tesseract"""
        try:
            import pytesseract
            
            # Set tesseract command path if specified
            if settings.TESSERACT_CMD:
                pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD
            
            # Test if tesseract is available
            version = pytesseract.get_tesseract_version()
            logger.info(f"✅ Tesseract {version} initialized successfully")
            self.tesseract = pytesseract
        except Exception as e:
            logger.warning(f"⚠️  Tesseract not available: {e}")
            self.tesseract = None
    
    def extract_text(self, image: np.ndarray) -> Dict[str, Any]:
        """Extract text using Tesseract"""
        if not self.tesseract:
            raise RuntimeError("Tesseract not initialized")
        
        try:
            # Convert numpy array to PIL Image
            if isinstance(image, np.ndarray):
                image = Image.fromarray(image)
            
            # Extract text with confidence
            data = self.tesseract.image_to_data(
                image,
                lang=settings.TESSERACT_LANG,
                output_type=self.tesseract.Output.DICT,
            )
            
            # Parse results
            blocks = []
            full_text = []
            total_confidence = 0.0
            block_count = 0
            
            n_boxes = len(data['text'])
            for i in range(n_boxes):
                text = data['text'][i].strip()
                if text:
                    conf = float(data['conf'][i])
                    if conf > 0:  # Filter out invalid confidences
                        blocks.append({
                            "text": text,
                            "confidence": conf / 100.0,  # Normalize to 0-1
                            "bbox": [
                                data['left'][i],
                                data['top'][i],
                                data['left'][i] + data['width'][i],
                                data['top'][i] + data['height'][i],
                            ],
                        })
                        full_text.append(text)
                        total_confidence += conf / 100.0
                        block_count += 1
            
            avg_confidence = total_confidence / block_count if block_count > 0 else 0.0
            
            return {
                "text": " ".join(full_text),
                "confidence": avg_confidence,
                "blocks": blocks,
                "engine": "tesseract",
            }
        except Exception as e:
            logger.error(f"Tesseract extraction failed: {e}")
            raise
    
    def is_available(self) -> bool:
        """Check if Tesseract is available"""
        return self.tesseract is not None


class HybridOCREngine(OCREngine):
    """Hybrid OCR engine that uses multiple engines"""
    
    def __init__(self):
        self.paddle = PaddleOCREngine()
        self.tesseract = TesseractEngine()
    
    def extract_text(self, image: np.ndarray) -> Dict[str, Any]:
        """Extract text using best available engine"""
        # Try PaddleOCR first (usually more accurate)
        if self.paddle.is_available():
            try:
                result = self.paddle.extract_text(image)
                if result["confidence"] >= settings.OCR_CONFIDENCE_THRESHOLD:
                    return result
                logger.info(f"PaddleOCR confidence {result['confidence']:.2f} below threshold, trying Tesseract")
            except Exception as e:
                logger.warning(f"PaddleOCR failed, falling back to Tesseract: {e}")
        
        # Fallback to Tesseract
        if self.tesseract.is_available():
            try:
                return self.tesseract.extract_text(image)
            except Exception as e:
                logger.error(f"Tesseract also failed: {e}")
                raise
        
        raise RuntimeError("No OCR engine available")
    
    def is_available(self) -> bool:
        """Check if any engine is available"""
        return self.paddle.is_available() or self.tesseract.is_available()


class OCREngineManager:
    """Singleton OCR engine manager"""
    
    _instance: Optional[OCREngine] = None
    
    @classmethod
    def initialize(cls):
        """Initialize OCR engine based on configuration"""
        if cls._instance is not None:
            return
        
        engine_type = settings.OCR_ENGINE.lower()
        
        if engine_type == "paddle":
            cls._instance = PaddleOCREngine()
        elif engine_type == "tesseract":
            cls._instance = TesseractEngine()
        elif engine_type == "hybrid":
            cls._instance = HybridOCREngine()
        else:
            raise ValueError(f"Unknown OCR engine: {engine_type}")
        
        if not cls._instance.is_available():
            raise RuntimeError(f"OCR engine '{engine_type}' is not available")
    
    @classmethod
    def get_engine(cls) -> OCREngine:
        """Get OCR engine instance"""
        if cls._instance is None:
            raise RuntimeError("OCR engine not initialized. Call initialize() first.")
        return cls._instance
    
    @classmethod
    def is_ready(cls) -> bool:
        """Check if OCR engine is ready"""
        return cls._instance is not None and cls._instance.is_available()
    
    @classmethod
    def cleanup(cls):
        """Cleanup OCR engine"""
        cls._instance = None
        logger.info("OCR engine cleaned up")
