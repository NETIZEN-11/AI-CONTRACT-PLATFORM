"""
Risk Detector Agent
Detects risks in contracts
"""
from typing import Dict, Any, List, Optional
from loguru import logger
import json

from app.core.llm_manager import LLMManager
from app.config import settings


class RiskDetectorAgent:
    """Agent to detect risks in contracts"""
    
    def __init__(self):
        self.llm_manager = LLMManager()
    
    async def detect(
        self,
        contract_text: str,
        clauses: Optional[List[Dict[str, Any]]] = None,
        entities: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """Detect risks in contract"""
        
        system_prompt = f"""
You are a legal risk assessment expert. Your task is to identify all potential risks in the given contract.

Risk levels:
- critical: Severe risk that could lead to major financial loss or liability
- high: Significant risk that needs immediate attention
- medium: Moderate risk that should be reviewed
- low: Minor risk with minimal impact
- info: Not a risk, just an important point

For each risk, identify:
- type: Type of risk (e.g., "Unlimited Liability", "Missing Indemnification", "One-Sided Termination")
- description: Detailed description of the risk
- risk_level: One of: critical, high, medium, low, info
- impact: Potential impact of the risk
- recommendation: Recommendation to mitigate the risk
- affected_clause: Title of the affected clause (if applicable)
- confidence: Confidence score between 0 and 1

Critical risk keywords to look for: {settings.critical_risk_keywords_list}
High risk keywords: {settings.high_risk_keywords_list}

Return the risks as a JSON array with the following structure:
[
  {{
    "type": "Risk Type",
    "description": "Description of the risk",
    "risk_level": "risk_level",
    "impact": "Potential impact",
    "recommendation": "Mitigation recommendation",
    "affected_clause": "Clause title (optional)",
    "confidence": 0.9
  }}
]

Only return the JSON, no other text.
        """
        
        context = ""
        if clauses:
            context += f"Extracted clauses:\n{json.dumps(clauses, indent=2)}\n\n"
        if entities:
            context += f"Extracted entities:\n{json.dumps(entities, indent=2)}\n\n"
        
        user_prompt = f"Identify all risks in this contract:\n\n{contract_text}"
        
        try:
            messages = self.llm_manager.create_messages(system_prompt, user_prompt, context)
            response = await self.llm_manager.invoke_with_fallback(messages)
            
            # Parse JSON from response
            import json
            risks = json.loads(response)
            logger.info(f"✅ Detected {len(risks)} risks")
            return risks
            
        except Exception as e:
            logger.error(f"Risk detection failed: {e}")
            return await self._fallback_detection(contract_text)
    
    async def _fallback_detection(self, contract_text: str) -> List[Dict[str, Any]]:
        """Simple fallback risk detection using keywords"""
        import re
        
        risks = []
        
        # Check for critical risk keywords
        for keyword in settings.critical_risk_keywords_list:
            if keyword.lower() in contract_text.lower():
                risks.append({
                    "type": f"Potential {keyword} risk",
                    "description": f"Contract contains '{keyword}' which may indicate a critical risk",
                    "risk_level": "critical",
                    "impact": "Potential major financial loss or liability",
                    "recommendation": "Review this section carefully with legal counsel",
                    "confidence": 0.6
                })
        
        # Check for high risk keywords
        for keyword in settings.high_risk_keywords_list:
            if keyword.lower() in contract_text.lower():
                risks.append({
                    "type": f"Potential {keyword} risk",
                    "description": f"Contract contains '{keyword}' which may indicate a high risk",
                    "risk_level": "high",
                    "impact": "Potential significant financial or operational impact",
                    "recommendation": "Review this section carefully",
                    "confidence": 0.5
                })
        
        return risks
