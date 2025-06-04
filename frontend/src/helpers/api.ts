import axios from "axios"
import type { CompletionMessageDto, DeleteChatroomOptions, FileObj } from "./types";

export const loginUser = async (email: string, password: string) => {
    const res = await axios.post("/users/login", { email, password });
    if (res.status !== 200) {
        throw new Error("Failed to login");
    }

    const data = await res.data;
    return data;
}

export const signupUser = async (name: string, email: string, password: string) => {
    const res = await axios.post("/users/signup", { name, email, password });
    if (res.status !== 201 && res.status !== 200) {
        throw new Error("Failed to signup");
    }
    const data = await res.data;
    return data;
}

export const logoutUser = async () => {
    const res = await axios.post("/users/logout");
    if (res.status !== 200) {
        throw new Error("Failed to logout");
    }

    const data = await res.data;
    return data;
}

export const checkAuthStatus = async () => {
    const res = await axios.get("/users/auth-status");
    if (res.status !== 200) {
        throw new Error("Unable to authenticate user");
    }

    const data = await res.data;
    return data;
}

export const createChatroom = async (name: string) => {
    const res = await axios.post("/chats/new-chatroom", { name });
    if (res.status !== 200) {
        throw new Error("Failed to create chatroom");
    }

    const data = await res.data;
    if (!data.success || !data.chatroom) {
        throw new Error("Chatroom creation failed");
    }
    if (!data.chatroom._id) {
        throw new Error("Chatroom ID is missing");
    }

    return data.chatroom._id;
}

export const deleteChatroom = async (
    chatroomId: string, 
    options: DeleteChatroomOptions = {}
) => {
    const { deleteAttachments = true, force = false } = options;
    
    try {
        const res = await axios.delete(
            `/chats/delete-chatroom/${chatroomId}`,
            {
                data: { 
                    deleteAttachments,
                    force
                 }
            }
        );
        
        if (res.status !== 200) {
            throw new Error("Failed to delete chatroom");
        }

        return res.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const errorData = error.response?.data;
            throw new Error(errorData?.message || "Failed to delete chatroom");
        }
        throw error;
    }
};

export const editChatroom = async (chatroomId: string, name: string) => {
    const res = await axios.put(`/chats/chatrooms/${chatroomId}`, { name });
    if (res.status !== 200) {
        throw new Error("Failed to edit chatroom");
    }
    const data = await res.data;
    if (!data.success || !data.chatroom) {
        throw new Error("Chatroom edit failed");
    }
    if (!data.chatroom._id) {
        throw new Error("Chatroom ID is missing");
    }   
    return data.chatroom._id;
}

export const getChatrooms = async () => {
    const res = await axios.get("/chats/chatrooms");
    if (res.status !== 200) {
        throw new Error("Failed to fetch chatrooms");
    }

    const data = await res.data;
    return data;
}

export const getChatroomMessages = async (chatroomId: string) => {
    const res = await axios.get(`/chats/chatrooms/${chatroomId}`);
    if (res.status !== 200) {
        throw new Error("Failed to fetch chatroom messages");
    }

    const data = await res.data;
    return data.messages;
}

export const sendChat = async (chatroomId: string, messages: CompletionMessageDto[], files: FileObj[], model: string) => {
    const formData = new FormData();
    formData.append('chatroomId', chatroomId);
    formData.append('messages', JSON.stringify(messages));
    formData.append('model', model);
    files.forEach((file, _) => {
        formData.append('files', file.file);
    });

    const res = await axios.post("/chats/chat", formData, {
        headers: {
        'Content-Type': 'multipart/form-data',
        },
    });

    if (res.status !== 200) {
        throw new Error("Failed to generate chat completion");
    }

    const data = await res.data;
    return data;
}

export const imageToText = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("image", file);

  const res = await axios.post(
    "/chats/image-to-text", 
    formData, 
    {
        headers: { "Content-Type": "multipart/form-data" },
    }
    );

  if (res.status !== 200 || !res.data.success) {
    console.error(res.data?.message ?? "Unknown error");
    throw new Error("Failed to convert image to text");
  }

  // return the plain string
  return res.data.message;
};

export const fetchSignedUrl = async (s3Key: string)
: Promise<{signedUrl: string, expiresAt: Date}> => {
    const res = await axios.get(
        `/chats/attachment/${encodeURIComponent(s3Key)}`,
        {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            },
        }
    );

    if (res.status !== 200) {
        throw new Error("Failed to get signed URLs");
    }

    const data = await res.data;
    const signedUrl = data.signedUrl;
    const expiresAt = data.expiresAt;

    if (!signedUrl || !expiresAt) {
        throw new Error("Signed URL or expiration time is missing");
    }

    return {
        signedUrl,
        expiresAt: new Date(expiresAt),
    };
}

export const fetchSignedUrls = async (s3Keys: string[])
    : Promise<{signedUrls: Record<string, string>, expiresAt: Date}> => {

    const res = await axios.post(
        '/chats/attachments/signed-urls',
        {
            s3Keys: s3Keys,
        },
        {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            },
        }
    );

    if (res.status !== 200) {
        throw new Error("Failed to get signed URLs");
    }

    const data = await res.data;
    const signedUrls = data.signedUrls;
    const expiresAt = data.expiresAt;

    if (!signedUrls || !expiresAt) {
        throw new Error("Signed URLs or expiration time is missing");
    }

    return {
        signedUrls: signedUrls,
        expiresAt: new Date(expiresAt),
    };
}