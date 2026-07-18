"""
Pydantic schemas for Chat endpoints
"""
from pydantic import BaseModel, Field
from typing import List, Optional


class Message(BaseModel):
    """Chat message"""
    role: str  # "user", "assistant", "system"
    content: str


class ChatRequest(BaseModel):
    """Chat request"""
    contract_id: str
    messages: List[Message]
    contract_text: Optional[str] = None
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 2048


class ChatResponse(BaseModel):
    """Chat response"""
    success: bool
    message: Message
    sources: Optional[List[dict]] = None
