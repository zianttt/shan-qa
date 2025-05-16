export type Chatroom = {
    id: string;
    name: string;
    owner: string;
    created_at: string;
    updated_at: string;
}

export interface Message {
    id: string;
    content: string;
    sender: 'user' | 'assistant';
    timestamp: Date;
    attachments?: string[]; // URLs to images
}

export interface Chats {
    id: string;
    title: string;
    messages: Message[];
    createdAt: Date;
    updatedAt: Date;
}

export interface CompletionMessage {
    role: 'user' | 'assistant';
    content: string;
}