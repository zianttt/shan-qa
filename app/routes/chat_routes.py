from fastapi import APIRouter, HTTPException

from app.models.models import ImageRequest, ChatRequest
from app.services.chat_service import ChatService

import logging

from app.services.sessions_service import SessionsService
logger = logging.getLogger('uvicorn.error')

router = APIRouter()

@router.get("/chat/sessions")
def get_chat_sessions(user_id: str):
    """
    Fetch all chat sessions for a given user.

    Args:
    user_id (str): The user id for the chat session.

    Returns:
    dict: The chat sessions for the given user. Sessions are a list of dictionaries with the session_id and created_at timestamp.
    
    """
    sessions = SessionsService.get_chat_sessions(user_id)
    logger.info(f"Fetching chat sessions for user {user_id}: {sessions}")
    return {"user_id": user_id, "sessions": sessions}

@router.get("/chat/history")
def get_chat_history(session_id: str, user_id: str):
    """
    Fetch previous messages for a given chat session.

    Args:
    session_id (str): The session id for the chat session.
    user_id (str): The user id for the chat session.

    Returns:
    dict: The chat history for the given. History is a list of dictionaries with either "ai" or "user" keys with the corresponding message.
    
    """
    logger.info(f"Fetching chat history for session {session_id}")
    history = ChatService.get_chat_history(session_id, user_id)
    if not history:
        raise HTTPException(status_code=404, detail="No chat history found for this session")
    return {"session_id": session_id, "history": history}

@router.post("/chat/send")
async def send_chat_message(request: ChatRequest):
    """
    Send a message to the chatbot and get a response.

    Args:
    request (ChatRequest): The request object containing the session_id, user_id, and user_message.
    
    Example output:
    {
    "session_id": "s_2",
    "response": {
        "content": "Hello!",
        "additional_kwargs": {
        "refusal": null
        },
        "response_metadata": {
        "token_usage": {
            "completion_tokens": 97,
            "prompt_tokens": 44,
            "total_tokens": 141,
            "completion_tokens_details": null,
            "prompt_tokens_details": null,
            "queue_time": 0.021499274,
            "prompt_time": 0.004213792,
            "completion_time": 0.129333333,
            "total_time": 0.133547125
        },
        "model_name": "llama-3.1-8b-instant",
        "system_fingerprint": "fp_9cb648b966",
        "finish_reason": "stop",
        "logprobs": null
        },
        "type": "ai",
        "name": null,
        "id": "run-7fad925d-043a-4b28-a83b-000ccb00690e-0",
        "example": false,
        "tool_calls": [],
        "invalid_tool_calls": [],
        "usage_metadata": {
        "input_tokens": 44,
        "output_tokens": 97,
        "total_tokens": 141,
        "input_token_details": {},
        "output_token_details": {}
        }
    }
    }
    """
    session_id, response = await ChatService.send_message(request.session_id, request.user_id, request.user_message)
    return {"session_id": session_id, "response": response}

@router.post("/chat/image")
def image_to_text(request: ImageRequest):
    '''
    Extract text from an image.

    Args:
    request (ImageRequest): The request object containing the base64 encoded image and optional prompt.

    Returns:
    dict: The extracted text from the image.
    '''
    return {"response": ChatService.text_extraction(request.base64_image, request.prompt)}