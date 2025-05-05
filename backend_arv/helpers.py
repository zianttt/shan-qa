import os
import uuid
from fastapi import HTTPException, status, Request, File, UploadFile, Form

from models import *
from db import DynamoDBManager

db_manager = DynamoDBManager(
    region_name=os.environ.get("AWS_REGION", "us-east-1"),
    endpoint_url=os.environ.get("DYNAMODB_ENDPOINT_URL")
)


async def get_user(user_id: str):
    result = db_manager.get_user(user_id)
    
    if result['status'] == 'success':
        user = result['user']
        return {
            'user_id': user['user_id'],
            'username': user['username'],
            'email': user['email']
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=result['message']
        )


async def get_thread(thread_id: str):
    result = db_manager.get_thread(thread_id)
    
    if result['status'] == 'success':
        return result['thread']
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=result['message']
        )


async def get_message(message_id: str):
    result = db_manager.get_message(message_id)
    
    if result['status'] == 'success':
        return result['message']
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=result['message']
        )
