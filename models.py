import uuid
from pydantic import BaseModel

class ImageRequest(BaseModel):
    base64_image: str
    prompt: str = "Convert the questions to LaTeX code."

class ChatRequest(BaseModel):
    user_query: str
    thread_id: str = uuid.uuid4().hex