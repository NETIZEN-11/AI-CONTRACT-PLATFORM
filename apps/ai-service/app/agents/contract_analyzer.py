"""
Contract Analyzer Agent
Main orchestrator for contract analysis using LangGraph
"""
from typing import Dict, Any, List, TypedDict
from langgraph.graph import StateGraph, END
from langchain.schema import HumanMessage, SystemMessage
from loguru import logger

from app.core.llm_manager import LLMManager
from app.agents.clause_extractor import ClauseExtractorAgent
from app.agents.risk_detector import RiskDetectorAgent
from app.agents.compliance_checker import ComplianceCheckerAgent
from app.agents.summarizer import SummarizerAgent
from app.agents.entity_extractor import EntityExtractorAgent


class ContractAnalysisState(TypedDict):
    """State for contract analysis workflow"""
    contract_id: str
    contract_text: str
    contract_type: str
    
    # Extracted data
    clauses: List[Dict[str, Any]]
    entities: Dict[str, Any]
    risks: List[Dict[str, Any]]
    compliance_report: Dict[str, Any]
    
    # Summaries
    executive_summary: str
    legal_summary: str
    business_summary: str
    plain_english_summary: str
    risk_summary: str
    
    # Metadata
    confidence_score: float
    processing_time: float
    errors: List[str]


class ContractAnalyzerAgent:
    """Main contract analyzer agent using LangGraph"""
    
    def __init__(self):
        self.clause_extractor = ClauseExtractorAgent()
        self.risk_detector = RiskDetectorAgent()
        self.compliance_checker = ComplianceCheckerAgent()
        self.summarizer = SummarizerAgent()
        self.entity_extractor = EntityExtractorAgent()
        
        # Build workflow graph
        self.graph = self._build_graph()
    
    def _build_graph(self) -> StateGraph:
        """Build LangGraph workflow"""
        workflow = StateGraph(ContractAnalysisState)
        
        # Add nodes
        workflow.add_node("extract_entities", self._extract_entities_node)
        workflow.add_node("extract_clauses", self._extract_clauses_node)
        workflow.add_node("detect_risks", self._detect_risks_node)
        workflow.add_node("check_compliance", self._check_compliance_node)
        workflow.add_node("generate_summaries", self._generate_summaries_node)
        
        # Define edges (workflow flow)
        workflow.set_entry_point("extract_entities")
        workflow.add_edge("extract_entities", "extract_clauses")
        workflow.add_edge("extract_clauses", "detect_risks")
        workflow.add_edge("detect_risks", "check_compliance")
        workflow.add_edge("check_compliance", "generate_summaries")
        workflow.add_edge("generate_summaries", END)
        
        return workflow.compile()
    
    async def _extract_entities_node(self, state: ContractAnalysisState) -> ContractAnalysisState:
        """Extract entities from contract"""
        try:
            logger.info(f"Extracting entities for contract: {state['contract_id']}")
            
            entities = await self.entity_extractor.extract(
                contract_text=state["contract_text"],
                contract_type=state["contract_type"],
            )
            
            state["entities"] = entities
            logger.info(f"✅ Extracted {len(entities)} entity types")
        
        except Exception as e:
            logger.error(f"Entity extraction failed: {e}")
            state["errors"].append(f"Entity extraction: {str(e)}")
            state["entities"] = {}
        
        return state
    
    async def _extract_clauses_node(self, state: ContractAnalysisState) -> ContractAnalysisState:
        """Extract clauses from contract"""
        try:
            logger.info(f"Extracting clauses for contract: {state['contract_id']}")
            
            clauses = await self.clause_extractor.extract(
                contract_text=state["contract_text"],
                contract_type=state["contract_type"],
                entities=state["entities"],
            )
            
            state["clauses"] = clauses
            logger.info(f"✅ Extracted {len(clauses)} clauses")
        
        except Exception as e:
            logger.error(f"Clause extraction failed: {e}")
            state["errors"].append(f"Clause extraction: {str(e)}")
            state["clauses"] = []
        
        return state
    
    async def _detect_risks_node(self, state: ContractAnalysisState) -> ContractAnalysisState:
        """Detect risks in contract"""
        try:
            logger.info(f"Detecting risks for contract: {state['contract_id']}")
            
            risks = await self.risk_detector.detect(
                contract_text=state["contract_text"],
                clauses=state["clauses"],
                entities=state["entities"],
            )
            
            state["risks"] = risks
            logger.info(f"✅ Detected {len(risks)} risks")
        
        except Exception as e:
            logger.error(f"Risk detection failed: {e}")
            state["errors"].append(f"Risk detection: {str(e)}")
            state["risks"] = []
        
        return state
    
    async def _check_compliance_node(self, state: ContractAnalysisState) -> ContractAnalysisState:
        """Check compliance"""
        try:
            logger.info(f"Checking compliance for contract: {state['contract_id']}")
            
            compliance_report = await self.compliance_checker.check(
                contract_text=state["contract_text"],
                clauses=state["clauses"],
                contract_type=state["contract_type"],
            )
            
            state["compliance_report"] = compliance_report
            logger.info(f"✅ Compliance check completed")
        
        except Exception as e:
            logger.error(f"Compliance check failed: {e}")
            state["errors"].append(f"Compliance check: {str(e)}")
            state["compliance_report"] = {}
        
        return state
    
    async def _generate_summaries_node(self, state: ContractAnalysisState) -> ContractAnalysisState:
        """Generate various summaries"""
        try:
            logger.info(f"Generating summaries for contract: {state['contract_id']}")
            
            summaries = await self.summarizer.generate_all_summaries(
                contract_text=state["contract_text"],
                clauses=state["clauses"],
                entities=state["entities"],
                risks=state["risks"],
                compliance_report=state["compliance_report"],
            )
            
            state["executive_summary"] = summaries.get("executive_summary", "")
            state["legal_summary"] = summaries.get("legal_summary", "")
            state["business_summary"] = summaries.get("business_summary", "")
            state["plain_english_summary"] = summaries.get("plain_english_summary", "")
            state["risk_summary"] = summaries.get("risk_summary", "")
            
            logger.info(f"✅ All summaries generated")
        
        except Exception as e:
            logger.error(f"Summary generation failed: {e}")
            state["errors"].append(f"Summary generation: {str(e)}")
        
        return state
    
    async def analyze(
        self,
        contract_id: str,
        contract_text: str,
        contract_type: str = "general",
    ) -> Dict[str, Any]:
        """Analyze contract using LangGraph workflow"""
        import time
        start_time = time.time()
        
        # Initialize state
        initial_state: ContractAnalysisState = {
            "contract_id": contract_id,
            "contract_text": contract_text,
            "contract_type": contract_type,
            "clauses": [],
            "entities": {},
            "risks": [],
            "compliance_report": {},
            "executive_summary": "",
            "legal_summary": "",
            "business_summary": "",
            "plain_english_summary": "",
            "risk_summary": "",
            "confidence_score": 0.0,
            "processing_time": 0.0,
            "errors": [],
        }
        
        try:
            # Run workflow
            logger.info(f"Starting contract analysis: {contract_id}")
            final_state = await self.graph.ainvoke(initial_state)
            
            # Calculate confidence score
            confidence_scores = []
            if final_state["clauses"]:
                confidence_scores.append(0.9)  # Clauses extracted
            if final_state["entities"]:
                confidence_scores.append(0.9)  # Entities extracted
            if final_state["risks"]:
                confidence_scores.append(0.85)  # Risks detected
            if final_state["compliance_report"]:
                confidence_scores.append(0.85)  # Compliance checked
            
            final_state["confidence_score"] = (
                sum(confidence_scores) / len(confidence_scores)
                if confidence_scores
                else 0.0
            )
            
            # Calculate processing time
            final_state["processing_time"] = time.time() - start_time
            
            logger.info(
                f"✅ Analysis complete: {contract_id} "
                f"(confidence: {final_state['confidence_score']:.2f}, "
                f"time: {final_state['processing_time']:.2f}s)"
            )
            
            return final_state
        
        except Exception as e:
            logger.error(f"Contract analysis failed: {e}")
            raise
