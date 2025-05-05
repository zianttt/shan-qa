from pydantic import BaseModel, EmailStr, Field
from typing import Dict, Optional, Any

# Pydantic models for request/response validation
class User(BaseModel):
    user_id: str
    username: str
    email: EmailStr
    disabled: Optional[bool] = None

class UserInDB(User):
    hashed_password: str

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    user_id: str
    username: str
    email: EmailStr

class LoginResponse(BaseModel):
    user_id: str
    username: str
    email: EmailStr
    access_token: str
    token_type: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: str | None = None

class ThreadCreate(BaseModel):
    user_id: str

class ThreadResponse(BaseModel):
    thread_id: str
    user_id: str
    created_at: int
    updated_at: int

class MessageContent(BaseModel):
    content: str
    role: str = Field(default="user", description="Role of the message sender (e.g., 'user' or 'assistant')")
    image_content: Optional[str] = None

class MessageCreate(BaseModel):
    content: str
    role: str = Field(default="user", description="Role of the message sender (e.g., 'user' or 'assistant')")
    metadata: Optional[Dict[str, Any]] = None

class MessageResponse(BaseModel):
    message_id: str
    thread_id: str
    details: Dict[str, Any]

class LLMMessage(BaseModel):
    prompt: str
    stream: bool = True
    max_tokens: int = 1000
    temperature: float = 0.7
    model: str = "claude-3-7-sonnet-20250219"