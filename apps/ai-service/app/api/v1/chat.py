"""
Chat endpoints
"""
from fastapi import APIRouter, HTTPException
from loguru import logger

from app.core.llm_manager import LLMManager
from app.core.vector_store import VectorStoreManager
from app.schemas.chat import (
    ChatRequest,
    ChatResponse,
    Message,
)

router = APIRouter()


@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Chat about a contract
    """
    try:
        logger.info(f"Processing chat request for contract: {request.contract_id}")
        
        # Build system prompt
        system_prompt = """
You are a legal AI assistant specialized in contract analysis. You have access to the full contract text.

Answer the user's questions about the contract. Provide detailed, accurate, and helpful responses.
If you don't know the answer, say so - don't make things up.
        """
        
        # Build message history
        messages = [
            {"role": "system", "content": system_prompt}
        ]
        
        # Add contract text if provided
        if request.contract_text:
            messages.append({
                "role": "user",
                "content": f"Here is the contract text:\n\n{request.contract_text}\n\nPlease answer my questions about this contract."
            })
        
        # Add chat history
        for msg in request.messages:
            messages.append({
                "role": msg.role,
                "content": msg.content
            })
        
        # Convert to LLMManager messages
        llm_messages = []
        for msg in messages:
            if msg["role"] == "system":
                from langchain.schema import SystemMessage
                llm_messages.append(SystemMessage(content=msg["content"]))
            elif msg["role"] == "user":
                from langchain.schema import HumanMessage
                llm_messages.append(HumanMessage(content=msg["content"]))
            elif msg["role"] == "assistant":
                from langchain.schema import AIMessage
                llm_messages.append(AIMessage(content=msg["content"]))
        
        # Get response from LLM
        response_text = await LLMManager.invoke_with_fallback(
            llm_messages,
            temperature=request.temperature or 0.7,
            max_tokens=request.max_tokens or 2048,
        )
        
        return ChatResponse(
            success=True,
            message=Message(
                role="assistant",
                content=response_text
            ),
            sources=None
        )
        
    except Exception as e:
        logger.error(f"Chat failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Chat processing failed: {str(e)}"
        )
