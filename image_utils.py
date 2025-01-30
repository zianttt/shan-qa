from openai import OpenAI
from openai.types.chat.chat_completion import ChatCompletion

def image_to_text(base64_image: str, prompt: str) -> ChatCompletion:
    
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
                            "url": f"data:image/jpeg;base64,{base64_image}",
                        },
                    },
                ],
            }
        ],
        # model="llama-3.2-90b-vision-preview",
        model="gpt-4o-mini"
    )

    return chat_completion