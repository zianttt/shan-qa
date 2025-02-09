from app.repositories.chat_repository import ChatRepository
from app.repositories.sessions_repository import SessionsRepository
from app.utils.llm import StatefulLLM
from openai import OpenAI

class ChatService:
    llm = None

    @staticmethod
    def get_chat_history(session_id: str, user_id: str):
        """Return past messages of a session."""
        # Check if user owns the session
        if not SessionsRepository.is_session_exists(session_id, user_id):
            return None
        
        return ChatRepository.get_chat_history(session_id)

    @staticmethod
    async def send_message(session_id: str, user_id: str, user_message: str):
        """
        Send a message to the LLM and get a response.
        """
        if not session_id or not SessionsRepository.is_session_exists(session_id, user_id):
            session_id = SessionsRepository.create_session(user_id)

        if ChatService.llm is None or ChatService.llm.session_id != session_id:
            ChatService.llm = StatefulLLM(session_id)

        response = await ChatService.llm.query_llm(user_message)
        # return response["messages"][-1].content
        return session_id, response
    
    @staticmethod
    def text_extraction(image_data: str, prompt: str) -> str:
        """Extract text from an image."""    
        # client = OpenAI(api_key=os.getenv('GROQ_API_KEY'), base_url=os.getenv('GROQ_BASE_URL'))
        client = OpenAI()

        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_data}",
                            },
                        },
                    ],
                }
            ],
            # model="llama-3.2-90b-vision-preview",
            model="gpt-4o-mini"
        )

        return chat_completion.choices[0].message.content