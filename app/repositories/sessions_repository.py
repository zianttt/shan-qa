from app.db import get_db
from datetime import datetime
from pymongo.synchronous.collection import Collection
from bson.objectid import ObjectId

db = get_db()
sessions_collection: Collection = db.sessions

class SessionsRepository:
    @staticmethod
    def create_session(user_id: str):
        """Create a new chat session."""
        session = sessions_collection.insert_one({
            "user_id": user_id,
            "created_at": datetime.now()
        })

        return str(session.inserted_id)
        
    @staticmethod
    def get_chat_sessions_by_user_id(user_id: str):
        """Retrieve all chat sessions. Return most recent first."""
        return list(sessions_collection.find({"user_id": user_id}).sort("created_at", -1))
    
    @staticmethod
    def is_session_exists(session_id: str, user_id: str):
        return sessions_collection.find_one({"_id": ObjectId(session_id), "user_id": user_id}) is not None