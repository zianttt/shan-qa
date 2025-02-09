from app.repositories.sessions_repository import SessionsRepository

class SessionsService:
    @staticmethod
    def get_chat_sessions(user_id: str):
        """Retrieve all chat sessions."""
        sessions = SessionsRepository.get_chat_sessions_by_user_id(user_id)
        return [
            {
                "session_id": str(session["_id"]),
                "user_id": session["user_id"],
                "created_at": session["created_at"]
            }
            for session in sessions
        ]
    
    @staticmethod
    def is_session_exists(session_id: str, user_id: str):
        """Check if a session exists."""
        return SessionsRepository.is_session_exists(session_id, user_id)