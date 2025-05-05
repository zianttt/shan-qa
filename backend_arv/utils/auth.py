from datetime import datetime, timedelta, timezone
import os
from typing import Annotated, Dict

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jwt.exceptions import InvalidTokenError
from passlib.context import CryptContext

from db import DynamoDBManager
from models import TokenData, User, UserInDB


END_SECRET_KEY = os.getenv("END_SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")

db_manager = DynamoDBManager(
    region_name=os.environ.get("AWS_REGION", "us-east-1"),
    endpoint_url=os.environ.get("DYNAMODB_ENDPOINT_URL")
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str):
    return pwd_context.hash(password)


def get_user(db_manager: DynamoDBManager, username: str):
    result = db_manager.get_user_by_email(username)
    print("Result:", result)
    if result["status"] == "success":
        user = result["user"]
        return UserInDB(
            user_id=user['user_id'], username=user["username"], email=user["email"], hashed_password=user["password_hash"]
        )
    else:
        return None


def authenticate_user(username: str, password: str):
    user = get_user(db_manager, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, END_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, END_SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except InvalidTokenError:
        raise credentials_exception
    user = get_user(db_manager, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)],
):
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


async def db_init():
    try:
        if not os.path.exists('dynamodb_config.json'):
            from db import generate_table_config
            generate_table_config()
        
        results = db_manager.create_tables_from_config('dynamodb_config.json')
        print("Database initialization results:", results)
        
        
    except Exception as e:
        print(f"Error initializing database: {str(e)}")

async def create_user(user_data):
    result = db_manager.create_user(user_data)
    return result

async def update_db_user(user_id: str, user_update: Dict):
    result = db_manager.update_user(user_id, user_update)
    return result

async def delete_db_user(user_id: str):
    result = db_manager.delete_user(user_id)
    return result