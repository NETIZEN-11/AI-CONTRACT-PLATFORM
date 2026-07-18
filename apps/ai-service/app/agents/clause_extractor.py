"""
Clause Extractor Agent
Extracts clauses from contract text
"""
from typing import Dict, Any, List, Optional
from loguru import logger

from app.core.llm_manager import LLMManager


class ClauseExtractorAgent:
    """Agent to extract clauses from contract"""

    def __init__(self):
        self.llm_manager = LLMManager()

    async def extract(
        self,
        contract_text: str,
        contract_type: str,
        entities: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """Extract clauses from contract text"""

        system_prompt = f"""
You are a legal expert specializing in contract analysis. Your task is to extract all important clauses from the given contract text.

Contract type: {contract_type}

For each clause, identify:
- title: A descriptive name for the clause
- content: The full text of the clause
- category: One of: parties, payment_terms, termination, confidentiality, intellectual_property, warranties, indemnification, liability, dispute_resolution, governing_law, other
- risk_level: One of: info, low, medium, high, critical (based on importance and potential risk)

Return the clauses as a JSON array with the following structure:
[
  {{
    "title": "Clause Title",
    "content": "Clause content here...",
    "category": "category_name",
    "risk_level": "risk_level"
  }}
]

Only return the JSON, no other text.
        """

        user_prompt = f"Extract all clauses from this contract:\n\n{contract_text}"

        try:
            messages = self.llm_manager.create_messages(system_prompt, user_prompt)
            response = await self.llm_manager.invoke_with_fallback(messages)

            # Parse JSON from response
            import json
            clauses = json.loads(response)
            logger.info(f"✅ Extracted {len(clauses)} clauses")
            return clauses

        except Exception as e:
            logger.error(f"Clause extraction failed: {e}")
            # Fallback to simple extraction
            return await self._fallback_extraction(contract_text)

    async def _fallback_extraction(self, contract_text: str) -> List[Dict[str, Any]]:
        """Simple fallback clause extraction using regex"""
        import re

        # Look for patterns like "Article X", "Section X.Y", "Clause X"
        clause_patterns = [
            r'(?:Article|Section|Clause|Appendix|Exhibit)\s+\d+[.:]\s+(.*?)(?=\n\s*(?:Article|Section|Clause|Appendix|Exhibit)\s+\d+|$)',
            r'([A-Z][A-Z\s]+?):\s+(.*?)(?=\n\s*[A-Z][A-Z\s]+?:|$)',
        ]

        clauses = []
        for pattern in clause_patterns:
            matches = re.findall(pattern, contract_text, re.DOTALL)
            for match in matches:
                title = match[0].strip() if len(match) > 1 else "Unknown Clause"
                content = match[1].strip() if len(match) > 1 else match[0].strip()

                if len(content) > 100:  # Only keep substantial clauses
                    clauses.append({
                        "title": title,
                        "content": content,
                        "category": "other",
                        "risk_level": "info"
                    })

        return clauses
