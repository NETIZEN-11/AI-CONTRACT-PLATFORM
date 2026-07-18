# OCR Service

Enterprise-grade OCR and document processing service for the AI Contract Review Platform.

## Features

- **Multi-Engine OCR**: PaddleOCR (primary), Tesseract (fallback), Hybrid mode
- **Document Support**: PDF, DOCX, DOC, PNG, JPG, JPEG, TIFF, BMP, TXT, RTF
- **Smart Processing**:
  - Native text extraction for text-based PDFs
  - OCR for scanned PDFs and images
  - Automatic fallback between engines
- **Metadata Extraction**: Extract document properties and metadata
- **Text Chunking**: Split large documents for downstream processing
- **Production Ready**: Metrics, logging, health checks

## Installation

### Using pip

```bash
# Install dependencies
pip install -r requirements.txt

# Install Tesseract OCR (optional, for fallback)
# Ubuntu/Debian
sudo apt-get install tesseract-ocr tesseract-ocr-eng

# macOS
brew install tesseract

# Windows
# Download from: https://github.com/UB-Mannheim/tesseract/wiki
```

### Using Docker

```bash
# Build image
docker build -t ocr-service .

# Run container
docker run -p 8001:8001 --env-file .env ocr-service
```

## Configuration

Copy `.env.example` to `.env` and configure:

```env
# OCR Engine: paddle, tesseract, or hybrid
OCR_ENGINE=paddle

# Service port
SERVICE_PORT=8001

# File processing limits
MAX_IMAGE_SIZE_MB=50
SUPPORTED_FILE_TYPES=pdf,png,jpg,jpeg,tiff,bmp,docx,doc,txt,rtf

# Performance
MAX_WORKERS=4
TIMEOUT_SECONDS=300
```

## Running the Service

### Development

```bash
# Start service
python -m uvicorn app.main:app --reload --port 8001

# Or using the main.py directly
python app/main.py
```

### Production

```bash
# Start with Gunicorn
gunicorn app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8001
```

## API Documentation

Once running, visit:

- **Swagger UI**: http://localhost:8001/docs
- **ReDoc**: http://localhost:8001/redoc

## API Endpoints

### Extract Text

```bash
POST /api/v1/ocr/extract
Content-Type: multipart/form-data

# Upload file
curl -X POST "http://localhost:8001/api/v1/ocr/extract" \
  -F "file=@contract.pdf"
```

Response:

```json
{
  "success": true,
  "text": "Extracted contract text...",
  "confidence": 0.95,
  "file_name": "contract.pdf",
  "file_type": "pdf",
  "pages": [
    {
      "page": 1,
      "text": "Page 1 text...",
      "confidence": 0.95,
      "method": "native"
    }
  ]
}
```

### Process Document (Advanced)

```bash
POST /api/v1/ocr/process
Content-Type: multipart/form-data

# With metadata and chunking
curl -X POST "http://localhost:8001/api/v1/ocr/process?extract_metadata=true&chunk_text=true" \
  -F "file=@contract.pdf"
```

Response:

```json
{
  "success": true,
  "text": "Full extracted text...",
  "confidence": 0.95,
  "file_name": "contract.pdf",
  "file_type": "pdf",
  "chunks": ["Chunk 1...", "Chunk 2..."],
  "metadata": {
    "pages": 5,
    "title": "Service Agreement",
    "author": "Legal Team",
    "file_size": 245760
  }
}
```

### Extract Metadata Only

```bash
POST /api/v1/ocr/metadata
Content-Type: multipart/form-data

curl -X POST "http://localhost:8001/api/v1/ocr/metadata" \
  -F "file=@contract.pdf"
```

### Supported Formats

```bash
GET /api/v1/ocr/supported-formats

curl http://localhost:8001/api/v1/ocr/supported-formats
```

Response:

```json
{
  "supported_formats": ["pdf", "png", "jpg", "jpeg", "tiff", "bmp", "docx", "doc", "txt", "rtf"],
  "max_file_size_mb": 50,
  "ocr_engine": "paddle"
}
```

## OCR Engines

### PaddleOCR (Recommended)

- **Pros**: Highly accurate, fast, supports multiple languages
- **Cons**: Larger model size
- **Use Case**: Primary OCR engine for production

### Tesseract

- **Pros**: Open-source, widely supported
- **Cons**: Less accurate on complex layouts
- **Use Case**: Fallback engine

### Hybrid Mode

Uses PaddleOCR first, falls back to Tesseract if confidence is low.

## Performance Tuning

### PaddleOCR Settings

```env
PADDLE_USE_GPU=true          # Enable GPU acceleration
PADDLE_ENABLE_MKLDNN=true    # Enable MKLDNN for CPU
PADDLE_CPU_THREADS=4         # Number of CPU threads
```

### Processing Limits

```env
MAX_IMAGE_SIZE_MB=50         # Maximum file size
MAX_WORKERS=4                # Concurrent workers
TIMEOUT_SECONDS=300          # Processing timeout
```

## Monitoring

### Health Checks

```bash
# Basic health
GET /health

# Readiness check
GET /ready

# Liveness check
GET /api/v1/health/live
```

### Prometheus Metrics

```bash
# Metrics endpoint
GET /metrics
```

Available metrics:

- `ocr_requests_total` - Total OCR requests
- `ocr_processing_duration_seconds` - Processing time
- `ocr_file_size_bytes` - File sizes processed
- `ocr_confidence_score` - OCR confidence scores
- `ocr_active_requests` - Active requests
- `ocr_errors_total` - Error counts

## Error Handling

The service returns standard HTTP status codes:

- `200` - Success
- `400` - Bad request (invalid file type, file too large)
- `500` - Server error (OCR processing failed)

Example error response:

```json
{
  "detail": "OCR processing failed: Unsupported file format"
}
```

## Testing

```bash
# Run tests
pytest

# With coverage
pytest --cov=app tests/

# Specific test file
pytest tests/test_ocr_engine.py
```

## Troubleshooting

### PaddleOCR not working

```bash
# Check if PaddlePaddle is installed
python -c "import paddleocr; print(paddleocr.__version__)"

# Reinstall if needed
pip install paddleocr paddlepaddle --force-reinstall
```

### Tesseract not found

```bash
# Check if Tesseract is installed
tesseract --version

# Set path in .env
TESSERACT_CMD=/usr/local/bin/tesseract  # Update with your path
```

### Out of memory

Reduce concurrent workers:

```env
MAX_WORKERS=2
```

Or reduce batch size:

```env
BATCH_SIZE=5
```

## Integration

### With NestJS API

```typescript
// Upload to OCR service
const formData = new FormData();
formData.append('file', file);

const response = await axios.post('http://localhost:8001/api/v1/ocr/extract', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});

const { text, confidence, pages } = response.data;
```

### With Python

```python
import requests

# Extract text from file
with open('contract.pdf', 'rb') as f:
    files = {'file': f}
    response = requests.post(
        'http://localhost:8001/api/v1/ocr/extract',
        files=files
    )

result = response.json()
print(result['text'])
```

## Architecture

```
┌─────────────────┐
│   FastAPI App   │
└────────┬────────┘
         │
    ┌────┴────────────────┐
    │  Document Processor │
    └────────┬────────────┘
             │
    ┌────────┴──────────┐
    │   OCR Engine      │
    │   Manager         │
    └────────┬──────────┘
             │
    ┌────────┴──────────────────┐
    │                            │
┌───┴──────┐            ┌───────┴────┐
│ Paddle   │            │ Tesseract  │
│ OCR      │            │ OCR        │
└──────────┘            └────────────┘
```

## License

Private - Contract AI Platform
