from app.db import get_db
from datetime import datetime
from pymongo.synchronous.collection import Collection

db = get_db()
user_collection: Collection = db.users

class UserRepository:
    @staticmethod
    def find_user_by_username(username: str):
        return user_collection.find_one({"username": username})

    @staticmethod
    def create_user(username: str, password_hash: str):
        user_collection.insert_one({
            "username": username,
            "password_hash": password_hash,
            "created_at": datetime.now()
        })