export interface Attachment {
    url: string;
    description?: string;
}

export interface CompletionMessageDto {
    role: 'user' | 'assistant';
    content: string;
    attachments: Attachment[];
}

export interface CompletionMessage {
    role: 'user' | 'assistant';
    content: string;
}