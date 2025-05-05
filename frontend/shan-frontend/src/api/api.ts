import axios from "axios";
import {
  AuthResponse,
  ImageToTextResponse,
  Message,
  MessageCreateResponse,
  Thread,
  ThreadCreateResponse,
  User,
  UserCredentials,
} from "../types";
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const apiClient = axios.create({
  baseURL: API_URL,
});

// Attach token automatically
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const signUp = async (userData: UserCredentials): Promise<User> => {
  try {
    const response = await apiClient.post<User>("/users/signup", userData);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const login = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const formData = new URLSearchParams();
    formData.append("grant_type", "password");
    formData.append("username", email);
    formData.append("password", password);

    const response = await apiClient.post<AuthResponse>("/token", formData, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const getCurrentUser = async (): Promise<User> => {
  try {
    const response = await apiClient.get<User>("/users/me");
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

// Thread API
export const createThread = async (
  userId: string
): Promise<ThreadCreateResponse> => {
  try {
    const response = await apiClient.post<ThreadCreateResponse>("/threads", {
      user_id: userId,
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const getUserThreads = async (userId: string): Promise<Thread[]> => {
  try {
    const response = await apiClient.get<Thread[]>(`/users/${userId}/threads`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

// Message API
export const getThreadMessages = async (
  threadId: string
): Promise<Message[]> => {
  try {
    const response = await apiClient.get<Message[]>(
      `/threads/${threadId}/messages`
    );
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const sendMessage = async (
  threadId: string,
  content: string
): Promise<MessageCreateResponse> => {
  try {
    const response = await apiClient.post<MessageCreateResponse>(
      `/threads/${threadId}/messages`,
      {
        content,
        role: "user",
        metadata: {},
      }
    );
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const convertImageToText = async (
  threadId: string,
  imageData: string
): Promise<ImageToTextResponse> => {
  try {
    const response = await apiClient.post<ImageToTextResponse>(
      `/threads/${threadId}/messages/image`,
      {
        image_data: imageData,
      }
    );
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};
