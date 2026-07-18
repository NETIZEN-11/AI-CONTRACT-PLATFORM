"""
Pydantic schemas for Analysis endpoints
"""
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional


class Clause(BaseModel):
    """Extracted clause"""
    id: Optional[str] = None
    title: str
    content: str
    category: str
    risk_level: Optional[str] = "info"
    page_number: Optional[int] = None
    start_position: Optional[int] = None
    end_position: Optional[int] = None


class Risk(BaseModel):
    """Detected risk"""
    id: Optional[str] = None
    type: str
    description: str
    risk_level: str
    impact: Optional[str] = None
    recommendation: Optional[str] = None
    affected_clause: Optional[str] = None
    confidence: float = 0.0
    evidence: Optional[str] = None


class ComplianceReport(BaseModel):
    """Compliance check report"""
    gdpr_compliant: str = "unknown"
    hipaa_compliant: str = "unknown"
    soc2_compliant: str = "unknown"
    iso27001_compliant: str = "unknown"
    pci_dss_compliant: str = "unknown"
    sox_compliant: str = "unknown"
    compliance_score: Optional[float] = None
    overall_status: str = "unknown"
    issues: Optional[List[Dict[str, Any]]] = None
    recommendations: Optional[List[Dict[str, Any]]] = None


class EntityExtractionResult(BaseModel):
    """Entity extraction result"""
    parties: Optional[List[str]] = None
    effective_date: Optional[str] = None
    expiration_date: Optional[str] = None
    payment_terms: Optional[str] = None
    jurisdiction: Optional[str] = None
    governing_law: Optional[str] = None
    value: Optional[float] = None
    currency: Optional[str] = None
    other_entities: Optional[Dict[str, Any]] = None


class ContractAnalysisRequest(BaseModel):
    """Request to analyze a contract"""
    contract_id: str
    contract_text: str
    contract_type: Optional[str] = "general"
    extract_clauses: Optional[bool] = True
    detect_risks: Optional[bool] = True
    check_compliance: Optional[bool] = True
    extract_entities: Optional[bool] = True
    generate_summaries: Optional[bool] = True
    options: Optional[Dict[str, Any]] = None


class ContractAnalysisResponse(BaseModel):
    """Contract analysis response"""
    success: bool
    contract_id: str
    clauses: Optional[List[Clause]] = None
    entities: Optional[EntityExtractionResult] = None
    risks: Optional[List[Risk]] = None
    compliance_report: Optional[ComplianceReport] = None
    executive_summary: Optional[str] = None
    legal_summary: Optional[str] = None
    business_summary: Optional[str] = None
    plain_english_summary: Optional[str] = None
    risk_summary: Optional[str] = None
    confidence_score: float = 0.0
    processing_time: float = 0.0
    errors: Optional[List[str]] = None


class ClauseExtractionRequest(BaseModel):
    """Clause extraction request"""
    contract_text: str
    contract_type: Optional[str] = "general"


class ClauseExtractionResponse(BaseModel):
    """Clause extraction response"""
    success: bool
    clauses: List[Clause]
    confidence: float


class RiskDetectionRequest(BaseModel):
    """Risk detection request"""
    contract_text: str
    clauses: Optional[List[Clause]] = None
    entities: Optional[EntityExtractionResult] = None


class RiskDetectionResponse(BaseModel):
    """Risk detection response"""
    success: bool
    risks: List[Risk]
    risk_summary: Optional[str] = None


class ComplianceCheckRequest(BaseModel):
    """Compliance check request"""
    contract_text: str
    clauses: Optional[List[Clause]] = None
    contract_type: Optional[str] = "general"


class ComplianceCheckResponse(BaseModel):
    """Compliance check response"""
    success: bool
    compliance_report: ComplianceReport


class SummaryRequest(BaseModel):
    """Summary generation request"""
    contract_text: str
    clauses: Optional[List[Clause]] = None
    entities: Optional[EntityExtractionResult] = None
    risks: Optional[List[Risk]] = None
    compliance_report: Optional[ComplianceReport] = None
    summary_types: Optional[List[str]] = None  # ["executive", "legal", "business", "plain_english", "risk"]


class SummaryResponse(BaseModel):
    """Summary generation response"""
    success: bool
    summaries: Dict[str, str]
