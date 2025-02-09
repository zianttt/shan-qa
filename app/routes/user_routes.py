from fastapi import APIRouter, HTTPException
from app.services.user_service import UserService
from app.models.models import UserCreate, UserLogin

router = APIRouter()

@router.post("/auth/register")
def register_user(user: UserCreate):
    """
    Register a new user with the given username and password hash.

    Args:
    user (UserCreate): The request object containing the username and password hash.
    """
    result = UserService.register_user(user.username, user.password_hash)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@router.post("/auth/login")
def login_user(user: UserLogin):
    """
    Login a user with the given username and password hash.

    Args:
    user (UserLogin): The request object containing the username and password hash.
    """
    authenticated_user = UserService.authenticate_user(user.username, user.password_hash)
    if not authenticated_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"message": "Login successful"}
