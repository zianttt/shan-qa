from fastapi import FastAPI
from image_utils import image_to_text
from langchain_integration import StatefulLLM
from models import ChatRequest, ImageRequest
from mongo import get_chatrooms_by_user_id, get_messages_by_chatroom_id

app = FastAPI()
langchain_llm = StatefulLLM()

@app.get("/")
def root():
    '''
    Test the API
    '''
    return {"message": "Hello World"}

@app.get("/chatrooms/{user_id}")
def get_chats(user_id: str):
    return get_chatrooms_by_user_id(user_id)

@app.get("/chatrooms/{chatroom_id}/messages")
def get_messages(chatroom_id: str):
    return get_messages_by_chatroom_id(chatroom_id)

def update_message(message_id: str, text: str):
    '''
    Update a message.

    Args:
    message_id (str): The message id.
    text (str): The new text.
    '''
    # Update the message in the database
    pass

@app.post("/chat")
async def chat(request: ChatRequest):
    '''
    Chat with the LLM.

    Args:
    user_query (str): The user query.
    thread_id (str): The thread id. Memory is stored corresponding to this id.
    '''
    response = await langchain_llm.query_llm(
        request.user_query,
        {"configurable": {"thread_id": request.thread_id}},
    ) 

    return {"response": response["messages"][-1].content}

@app.post("/image")
def understand_image(request: ImageRequest):
    '''
    Extract text from an image.

    Args:
    base64_image (str): The base64 encoded image.
    prompt (str): The prompt to be used for the model.

    Returns:
    '''
    return image_to_text(request.base64_image, request.prompt)