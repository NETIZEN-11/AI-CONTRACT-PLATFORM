"""
Analysis endpoints
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from loguru import logger

from app.config import settings
from app.agents.contract_analyzer import ContractAnalyzerAgent
from app.agents.clause_extractor import ClauseExtractorAgent
from app.agents.risk_detector import RiskDetectorAgent
from app.agents.compliance_checker import ComplianceCheckerAgent
from app.agents.summarizer import SummarizerAgent
from app.agents.entity_extractor import EntityExtractorAgent
from app.schemas.analysis import (
    ContractAnalysisRequest,
    ContractAnalysisResponse,
    ClauseExtractionRequest,
    ClauseExtractionResponse,
    RiskDetectionRequest,
    RiskDetectionResponse,
    ComplianceCheckRequest,
    ComplianceCheckResponse,
    SummaryRequest,
    SummaryResponse,
)

router = APIRouter()

# Initialize agents
contract_analyzer = ContractAnalyzerAgent()
clause_extractor = ClauseExtractorAgent()
risk_detector = RiskDetectorAgent()
compliance_checker = ComplianceCheckerAgent()
summarizer = SummarizerAgent()
entity_extractor = EntityExtractorAgent()


@router.post("/contract", response_model=ContractAnalysisResponse)
async def analyze_contract(
    request: ContractAnalysisRequest,
    background_tasks: BackgroundTasks = None,
):
    """
    Analyze a contract
    """
    try:
        logger.info(f"Starting analysis for contract: {request.contract_id}")
        
        result = await contract_analyzer.analyze(
            contract_id=request.contract_id,
            contract_text=request.contract_text,
            contract_type=request.contract_type or "general",
        )
        
        return ContractAnalysisResponse(
            success=True,
            contract_id=request.contract_id,
            clauses=result.get("clauses"),
            entities=result.get("entities"),
            risks=result.get("risks"),
            compliance_report=result.get("compliance_report"),
            executive_summary=result.get("executive_summary"),
            legal_summary=result.get("legal_summary"),
            business_summary=result.get("business_summary"),
            plain_english_summary=result.get("plain_english_summary"),
            risk_summary=result.get("risk_summary"),
            confidence_score=result.get("confidence_score", 0.0),
            processing_time=result.get("processing_time", 0.0),
            errors=result.get("errors"),
        )
        
    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Contract analysis failed: {str(e)}"
        )


@router.post("/clauses", response_model=ClauseExtractionResponse)
async def extract_clauses(request: ClauseExtractionRequest):
    """Extract clauses from contract"""
    try:
        clauses = await clause_extractor.extract(
            contract_text=request.contract_text,
            contract_type=request.contract_type or "general",
        )
        
        return ClauseExtractionResponse(
            success=True,
            clauses=clauses,
            confidence=0.8 if clauses else 0.0,
        )
        
    except Exception as e:
        logger.error(f"Clause extraction failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Clause extraction failed: {str(e)}"
        )


@router.post("/risks", response_model=RiskDetectionResponse)
async def detect_risks(request: RiskDetectionRequest):
    """Detect risks in contract"""
    try:
        risks = await risk_detector.detect(
            contract_text=request.contract_text,
            clauses=request.clauses,
            entities=request.entities,
        )
        
        return RiskDetectionResponse(
            success=True,
            risks=risks,
            risk_summary=None,
        )
        
    except Exception as e:
        logger.error(f"Risk detection failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Risk detection failed: {str(e)}"
        )


@router.post("/compliance", response_model=ComplianceCheckResponse)
async def check_compliance(request: ComplianceCheckRequest):
    """Check contract compliance"""
    try:
        report = await compliance_checker.check(
            contract_text=request.contract_text,
            clauses=request.clauses,
            contract_type=request.contract_type or "general",
        )
        
        return ComplianceCheckResponse(
            success=True,
            compliance_report=report,
        )
        
    except Exception as e:
        logger.error(f"Compliance check failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Compliance check failed: {str(e)}"
        )


@router.post("/summaries", response_model=SummaryResponse)
async def generate_summaries(request: SummaryRequest):
    """Generate contract summaries"""
    try:
        summaries = await summarizer.generate_all_summaries(
            contract_text=request.contract_text,
            clauses=request.clauses,
            entities=request.entities,
            risks=request.risks,
            compliance_report=request.compliance_report,
        )
        
        return SummaryResponse(
            success=True,
            summaries=summaries,
        )
        
    except Exception as e:
        logger.error(f"Summary generation failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Summary generation failed: {str(e)}"
        )
