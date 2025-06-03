import OpenAI from "openai";
import { CompletionMessage } from "./types.js";

export const generateChatCompletion = async (messages: CompletionMessage[], model: string) => {

    const client = new OpenAI({
        apiKey: process.env.GROQ_API_KEY,
        baseURL: process.env.GROQ_BASE_URL,
    });

    const completion = await client.chat.completions.create({
        // model: "llama-3.3-70b-versatile",
        model: model,
        messages: messages,
    });
    
    console.log(completion.choices[0].message.content);
    return completion.choices[0].message.content;
}

export const multimodalCompletion = async (image: string, mode: "base64" | "url" = "base64") => {
    const openai = new OpenAI(
        {
            apiKey: process.env.GROQ_API_KEY,
            baseURL: process.env.GROQ_BASE_URL,
        }
    );
    if (mode === "base64") {
        image = `data:image/jpeg;base64,${image}`;
    }
    const response = await openai.chat.completions.create({
        // model: "gpt-4.1-mini",
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [{
            role: "user",
            content: [
                { type: "text", text: "What is in this image?" },
                {
                    type: "image_url",
                    image_url: {
                        url: image,
                    },
                },
            ],
        }],
    });

    return response.choices[0]?.message?.content?.trim() ?? "";
}