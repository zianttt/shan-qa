from typing import List
import pymongo
from pymongo import MongoClient

client = MongoClient('localhost', 27017)

def get_chatrooms_by_user_id(user_id) -> List:
    return list(client.chatrooms.find({'user_id': user_id}))

def get_messages_by_chatroom_id(chatroom_id) -> List:
    return list(client.messages.find({'chatroom_id': chatroom_id}).sort('timestamp', pymongo.ASCENDING))

def update_message(message_id: str, text: str):
    client.messages.update_one({'_id': message_id}, {'$set': {'text': text}})