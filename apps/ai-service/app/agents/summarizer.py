"""
Summarizer Agent
Generates various summaries of contracts
"""
from typing import Dict, Any, Optional
from loguru import logger

from app.core.llm_manager import LLMManager


class SummarizerAgent:
    """Agent to generate contract summaries"""

    def __init__(self):
        self.llm_manager = LLMManager()

    async def generate_all_summaries(
        self,
        contract_text: str,
        clauses: Any,
        entities: Any,
        risks: Any,
        compliance_report: Any,
    ) -> Dict[str, str]:
        """Generate all summary types"""

        summaries = {}

        summary_types = [
            ("executive_summary", "executive"),
            ("legal_summary", "legal"),
            ("business_summary", "business"),
            ("plain_english_summary", "plain_english"),
            ("risk_summary", "risk"),
        ]

        for key, summary_type in summary_types:
            summaries[key] = await self._generate_summary(
                contract_text,
                summary_type,
                clauses,
                entities,
                risks,
                compliance_report,
            )

        return summaries

    async def _generate_summary(
        self,
        contract_text: str,
        summary_type: str,
        clauses: Any,
        entities: Any,
        risks: Any,
        compliance_report: Any,
    ) -> str:
        """Generate a specific type of summary"""

        system_prompts = {
            "executive": """
You are an executive assistant. Create a concise 200-300 word executive summary of this contract for senior management.
Focus on key terms, financial implications, risks, and critical deadlines.
            """,
            "legal": """
You are a corporate lawyer. Create a detailed legal summary of this contract for the legal team.
Focus on legal obligations, liabilities, dispute resolution, and compliance issues.
            """,
            "business": """
You are a business analyst. Create a business-focused summary of this contract.
Focus on business value, key deliverables, timelines, and commercial terms.
            """,
            "plain_english": """
Create a plain English summary of this contract that anyone can understand.
Avoid legal jargon and explain key terms simply.
            """,
            "risk": """
Create a risk-focused summary of this contract.
Highlight all identified risks, their severity, and mitigation recommendations.
            """,
        }

        system_prompt = system_prompts.get(summary_type, system_prompts["plain_english"])

        # Build context
        context = ""
        if clauses:
            import json
            context += f"Clauses:\n{json.dumps(clauses, indent=2)}\n\n"
        if entities:
            context += f"Entities:\n{json.dumps(entities, indent=2)}\n\n"
        if risks:
            context += f"Risks:\n{json.dumps(risks, indent=2)}\n\n"
        if compliance_report:
            context += f"Compliance:\n{json.dumps(compliance_report, indent=2)}\n\n"

        user_prompt = f"Generate a {summary_type.replace('_', ' ')} summary for this contract:\n\n{contract_text}"

        try:
            messages = self.llm_manager.create_messages(system_prompt, user_prompt, context)
            summary = await self.llm_manager.invoke_with_fallback(messages)
            return summary

        except Exception as e:
            logger.error(f"Summary generation failed: {e}")
            return "Summary not available"
