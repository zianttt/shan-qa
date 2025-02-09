from app.repositories.user_repository import UserRepository

class UserService:
    @staticmethod
    def register_user(username: str, password_hash: str):
        if UserRepository.find_user_by_username(username):
            return {"error": "Username already registered"}
        UserRepository.create_user(username, password_hash)
        return {"message": "User registered successfully"}

    @staticmethod
    def authenticate_user(username: str, password_hash: str):
        user = UserRepository.find_user_by_username(username)
        if not user or user["password_hash"] != password_hash:
            return None
        return user  # Return user object
