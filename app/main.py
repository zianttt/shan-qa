from fastapi import FastAPI
from app.routes import user_routes, chat_routes
from dotenv import load_dotenv; load_dotenv()
from fastapi.middleware.cors import CORSMiddleware

API_VERSION = "v1"
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Add your frontend URL
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Set base route for the API
@app.get("/")
def read_root():
    return {"message": "Welcome to the Chatbot API!"}

app.include_router(user_routes.router, prefix=f"/api/{API_VERSION}")
app.include_router(chat_routes.router, prefix=f"/api/{API_VERSION}")