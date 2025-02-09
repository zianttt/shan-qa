import json
import logging
from app.db import get_db
from pymongo.synchronous.collection import Collection

db = get_db()
chat_histories_collection: Collection = db.chat_histories

class ChatRepository:
    @staticmethod
    def get_chat_history(session_id: str):
        """Retrieve previous messages for a given session. Return oldest messages first."""
        entries = list(chat_histories_collection.find({"SessionId": session_id}))
        messages = [
            {
                "type": (h := json.loads(entry["History"]))["type"],
                "content": h["data"]["content"]
            } 
            for entry in entries
        ]
        return messages