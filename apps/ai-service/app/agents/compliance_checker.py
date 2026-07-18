"""
Compliance Checker Agent
Checks contract compliance with various regulations
"""
from typing import Dict, Any
from loguru import logger

from app.core.llm_manager import LLMManager
from app.config import settings


class ComplianceCheckerAgent:
    """Agent to check contract compliance"""
    
    def __init__(self):
        self.llm_manager = LLMManager()
    
    async def check(
        self,
        contract_text: str,
        clauses: Any,
        contract_type: str,
    ) -> Dict[str, Any]:
        """Check contract compliance"""
        
        regulations = []
        if settings.ENABLE_GDPR_CHECK:
            regulations.append("GDPR")
        if settings.ENABLE_HIPAA_CHECK:
            regulations.append("HIPAA")
        if settings.ENABLE_SOC2_CHECK:
            regulations.append("SOC 2")
        if settings.ENABLE_ISO27001_CHECK:
            regulations.append("ISO 27001")
        
        system_prompt = f"""
You are a compliance expert. Your task is to check if the given contract complies with the following regulations: {', '.join(regulations)}.

For each regulation, assess compliance status as:
- compliant: Contract appears to comply
- non_compliant: Contract has clear violations
- requires_review: Needs manual review
- partially_compliant: Partially complies
- unknown: Not enough information

Return a JSON object with the following structure:
{{
  "gdpr_compliant": "compliant|non_compliant|requires_review|partially_compliant|unknown",
  "hipaa_compliant": "compliant|non_compliant|requires_review|partially_compliant|unknown",
  "soc2_compliant": "compliant|non_compliant|requires_review|partially_compliant|unknown",
  "iso27001_compliant": "compliant|non_compliant|requires_review|partially_compliant|unknown",
  "pci_dss_compliant": "compliant|non_compliant|requires_review|partially_compliant|unknown",
  "sox_compliant": "compliant|non_compliant|requires_review|partially_compliant|unknown",
  "compliance_score": 0.85,
  "overall_status": "compliant",
  "issues": [
    {{
      "regulation": "GDPR",
      "description": "Issue description",
      "severity": "high"
    }}
  ],
  "recommendations": [
    {{
      "regulation": "GDPR",
      "recommendation": "Recommendation text"
    }}
  ]
}}

Only return the JSON, no other text.
        """
        
        user_prompt = f"Check compliance of this contract:\n\n{contract_text}"
        
        try:
            messages = self.llm_manager.create_messages(system_prompt, user_prompt)
            response = await self.llm_manager.invoke_with_fallback(messages)
            
            # Parse JSON from response
            import json
            report = json.loads(response)
            logger.info(f"✅ Compliance check completed")
            return report
            
        except Exception as e:
            logger.error(f"Compliance check failed: {e}")
            return self._fallback_check()
    
    async def _fallback_check(self) -> Dict[str, Any]:
        """Simple fallback compliance check"""
        return {
            "gdpr_compliant": "unknown",
            "hipaa_compliant": "unknown",
            "soc2_compliant": "unknown",
            "iso27001_compliant": "unknown",
            "pci_dss_compliant": "unknown",
            "sox_compliant": "unknown",
            "compliance_score": 0.0,
            "overall_status": "unknown",
            "issues": [],
            "recommendations": []
        }
