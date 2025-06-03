import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url'; 



export const getSystemPrompt = (): string => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const systemPromptFile = "../res/prompt.txt";
    const filePath = path.resolve(__dirname, systemPromptFile);
    const currentDateTime = new Date().toISOString();

    try {
        const promptTemplate = fs.readFileSync(filePath, 'utf-8');
        const finalPrompt = promptTemplate.replace('{{ currentDateTime }}', currentDateTime);

        return finalPrompt;
    } catch (error) {
        console.error("Error reading or processing system prompt file:", error);
        throw new Error("Failed to load system prompt");
    }
};