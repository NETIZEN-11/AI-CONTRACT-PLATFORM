"""
Entity Extractor Agent
Extracts entities from contracts
"""
from typing import Dict, Any, Optional
from loguru import logger

from app.core.llm_manager import LLMManager


class EntityExtractorAgent:
    """Agent to extract entities from contract"""

    def __init__(self):
        self.llm_manager = LLMManager()

    async def extract(
        self,
        contract_text: str,
        contract_type: str,
    ) -> Dict[str, Any]:
        """Extract entities from contract text"""

        system_prompt = """
You are an expert in contract analysis. Your task is to extract the following entities from the contract:

- parties: List of all parties to the contract (company names, individuals, etc.)
- effective_date: The effective date of the contract (ISO 8601 format)
- expiration_date: The expiration/termination date of the contract (ISO 8601 format)
- payment_terms: Summary of payment terms
- jurisdiction: Governing jurisdiction
- governing_law: Governing law
- value: Total contract value (numeric)
- currency: Currency (e.g., USD, EUR)
- other_entities: Any other important entities

Return the entities as a JSON object with the following structure:
{
  "parties": ["Party 1", "Party 2"],
  "effective_date": "2024-01-01",
  "expiration_date": "2025-01-01",
  "payment_terms": "Net 30 days",
  "jurisdiction": "New York",
  "governing_law": "State of New York",
  "value": 100000.0,
  "currency": "USD",
  "other_entities": {}
}

Only return the JSON, no other text.
        """

        user_prompt = f"Extract entities from this {contract_type} contract:\n\n{contract_text}"

        try:
            messages = self.llm_manager.create_messages(system_prompt, user_prompt)
            response = await self.llm_manager.invoke_with_fallback(messages)

            # Parse JSON from response
            import json
            entities = json.loads(response)
            logger.info(f"✅ Extracted entities")
            return entities

        except Exception as e:
            logger.error(f"Entity extraction failed: {e}")
            return await self._fallback_extraction(contract_text)

    async def _fallback_extraction(self, contract_text: str) -> Dict[str, Any]:
        """Simple fallback entity extraction using regex"""
        import re
        from dateutil.parser import parse

        entities = {
            "parties": [],
            "effective_date": None,
            "expiration_date": None,
            "payment_terms": None,
            "jurisdiction": None,
            "governing_law": None,
            "value": None,
            "currency": "USD",
            "other_entities": {}
        }

        # Look for dates
        date_pattern = r'(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4})'
        dates = re.findall(date_pattern, contract_text)
        if dates:
            try:
                entities["effective_date"] = parse(dates[0]).date().isoformat()
            except:
                pass
            if len(dates) > 1:
                try:
                    entities["expiration_date"] = parse(dates[-1]).date().isoformat()
                except:
                    pass

        # Look for currency values
        currency_pattern = r'[\$£€]\s*[\d,]+\.?\d*'
        amounts = re.findall(currency_pattern, contract_text)
        if amounts:
            try:
                import re
                num = re.sub(r'[^\d.]', '', amounts[0])
                entities["value"] = float(num)
            except:
                pass

        return entities
