from datetime import timedelta
from dotenv import load_dotenv; load_dotenv()
from fastapi.security import OAuth2PasswordRequestForm
from fastapi import Depends, FastAPI, HTTPException, status, Request, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from typing import Annotated, Dict, Any
import uuid
import os

from utils.auth import authenticate_user, create_access_token, create_user, db_init, delete_db_user, get_current_active_user, get_password_hash, update_db_user
from llm import LLMCLient, MultiModalLLMClient
from models import *
from db import DynamoDBManager

ACCESS_TOKEN_EXPIRE_MINUTES = 30

llm_client = LLMCLient()
multi_modal_llm_client = MultiModalLLMClient()

db_manager = DynamoDBManager(
    region_name=os.environ.get("AWS_REGION", "us-east-1"),
    endpoint_url=os.environ.get("DYNAMODB_ENDPOINT_URL")
)


# Initialize FastAPI app
app = FastAPI(
    title="AI Chat Application API",
    description="API for managing users, threads, and messages in an AI chat application",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Modify this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Error handling middleware
@app.middleware("http")
async def errors_handling(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as exc:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": str(exc)},
        )

# Health check endpoint
@app.get("/health")
async def health():
    return {"status": "healthy"}

# Initialize database tables
@app.on_event("startup")
async def startup_db_client():
    await db_init()

@app.get("/")
async def root():
    return {"message": "Hello World!"}


####################
# User endpoints
####################
@app.post("/users/signup", response_model=UserResponse)
async def signup(user: UserCreate):
    user_data = user.model_dump()

    user_data['user_id'] = str(uuid.uuid4())
    user_data['password_hash'] = get_password_hash(user_data['password'])
    del user_data['password']
    
    result = await create_user(user_data)
    
    if result['status'] == 'success':
        return {
            'user_id': result['user_id'],
            'username': user_data['username'],
            'email': user_data['email']
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result['message']
        )
    
@app.post("/token")
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
) -> LoginResponse:
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )

    # Return token and user id
    response = LoginResponse(
        user_id=user.user_id,
        username=user.username,
        email=user.email,
        access_token=access_token,
        token_type="bearer"
    )
    
    return response

@app.get("/users/me/", response_model=User)
async def read_users_me(
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return current_user


@app.put("/users/{user_id}", response_model=Dict[str, Any])
async def update_user(user_id: str, user_update: UserUpdate):
    update_data = {k: v for k, v in user_update.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    result = update_db_user(user_id, update_data)
    
    if result['status'] == 'success':
        return {"message": "User updated successfully", "updated_fields": result['updated_attributes']}
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result['message']
        )

@app.delete("/users/{user_id}")
async def delete_user(user_id: str):
    result = delete_db_user(user_id)
    
    if result['status'] == 'success':
        return {"message": result['message']}
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result['message']
        )


####################
# Thread endpoints
####################
@app.post("/threads", response_model=Dict[str, str], status_code=status.HTTP_201_CREATED)
async def create_thread(thread: ThreadCreate):
    result = db_manager.create_thread(thread.user_id)
    
    if result['status'] == 'success':
        return {"thread_id": result['thread_id']}
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result['message']
        )

@app.get("/users/{user_id}/threads")
async def get_user_threads(user_id: str):
    result = db_manager.get_user_threads(user_id)
    
    if result['status'] == 'success':
        return result['threads']
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result['message']
        )

@app.delete("/threads/{thread_id}")
async def delete_thread(thread_id: str):
    result = db_manager.delete_thread(thread_id)
    
    if result['status'] == 'success':
        return {"message": result['message']}
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result['message']
        )

# Message endpoints
@app.post("/threads/{thread_id}/messages", response_model=Dict[str, str], status_code=status.HTTP_201_CREATED)
async def create_message(thread_id: str, message: MessageCreate):
    message_details = message.dict()
    
    result = db_manager.create_message(thread_id, message_details)
    
    if result['status'] == 'success':
        return {"message_id": result['message_id']}
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result['message']
        )

@app.get("/threads/{thread_id}/messages")
async def get_thread_messages(thread_id: str):
    result = db_manager.get_thread_messages(thread_id)
    
    if result['status'] == 'success':
        return result['messages']
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result['message']
        )

@app.delete("/messages/{message_id}")
async def delete_message(message_id: str):
    result = db_manager.delete_message(message_id)
    
    if result['status'] == 'success':
        return {"message": result['message']}
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result['message']
        )
    
@app.post("/threads/{thread_id}/messages/image")
async def image_to_text(image_data: str) -> str:
    try:
        text = multi_modal_llm_client.image_to_text(image_data, "Extract text from image")
        return {"text": text}
    except Exception as e:
        print(f"Error processing image: {str(e)}")
        return ""

# Run the application
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.environ.get("HOST", "127.0.0.1"),
        port=int(os.environ.get("PORT", 8000)),
        reload=True
    )