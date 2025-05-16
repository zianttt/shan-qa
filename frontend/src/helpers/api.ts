import axios from "axios"
import type { CompletionMessage } from "./types";

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
    return data;
}

export const deleteChatroom = async (chatroomId: string) => {
    const res = await axios.delete(`/chats/delete-chatroom/${chatroomId}`);
    if (res.status !== 200) {
        throw new Error("Failed to delete chatroom");
    }

    const data = await res.data;
    return data;
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

export const sendChat = async (chatroomId: string, messages: CompletionMessage[], attachments: string[]) => {
    const res = await axios.post("/chats/chat", { chatroomId, messages, attachments });
    if (res.status !== 200) {
        throw new Error("Failed to generate chat completion");
    }

    const data = await res.data;
    return data;
}

export const imageToText = async (image: File): Promise<string> => {
  const formData = new FormData();
  formData.append("image", image);

  const res = await axios.post("/chats/image-to-text", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  if (res.status !== 200 || !res.data.success) {
    console.error(res.data?.message ?? "Unknown error");
    throw new Error("Failed to convert image to text");
  }

  // return the plain string
  return res.data.message;
};