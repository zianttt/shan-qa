import os
from openai import OpenAI

class LLMCLient:
    def __init__(self, model_name: str = "llama-3.3-70b-versatile"):
        self.client: OpenAI = OpenAI(
            api_key=os.getenv("GROQ_API_KEY"),
            base_url=os.getenv("GROQ_BASE_URL"),
        )
        self.model_name: str = model_name

    async def a_completion(self, prompt: str):
        stream = self.client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model=self.model_name,
            stream=True
        )

        for chunk in stream:
            if chunk.choices[0].delta:
                yield chunk.choices[0].delta

class MultiModalLLMClient():
    def __init__(self, model_name: str = "gpt-4o-mini"):
        self.client: OpenAI = OpenAI(
            api_key=os.getenv("OPENAI_API_KEY"),
            base_url=os.getenv("OPENAI_BASE_URL"),
        )
        self.model_name: str = model_name

    def image_to_text(self, image_data: str, prompt: str):
        completion = self.client.chat.completions.create(
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
            model=self.model_name,
        )

        return completion.choices[0].message.content

        