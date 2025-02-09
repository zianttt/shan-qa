from pydantic import BaseModel

class ImageRequest(BaseModel):
    base64_image: str
    prompt: str = "Convert the questions to LaTeX code."

class ChatRequest(BaseModel):
    session_id: str
    user_id: str
    user_message: str

class UserCreate(BaseModel):
    username: str
    password_hash: str  # The frontend should send the hashed password

class UserLogin(BaseModel):
    username: str
    password_hash: str  # The frontend should send the hashed password

class Message(BaseModel):
    session_id: str
    sender: str
    text: str