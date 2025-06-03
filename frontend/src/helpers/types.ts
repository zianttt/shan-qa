export type Chatroom = {
    id: string;
    name: string;
    owner: string;
    created_at: string;
    updated_at: string;
}

export interface FileObj {
    file: File;
    previewUrl?: string;
    description?: string;
}

export interface Attachment {
    s3Key: string;
    description?: string;
    fileName?: string;
    contentType?: string;
    signedUrl?: string;
    urlExpiresAt?: string;
}

export interface Message {
    id: string;
    content: string;
    sender: string;
    timestamp: Date;
    attachments?: Attachment[];
}


export interface Chats {
    id: string;
    title: string;
    messages: Message[];
    createdAt: Date;
    updatedAt: Date;
}

export interface CompletionMessageDto {
    role: string;
    content: string;
    attachments: Attachment[];
}

export interface DeleteChatroomOptions {
    deleteAttachments?: boolean;
    force?: boolean;
}