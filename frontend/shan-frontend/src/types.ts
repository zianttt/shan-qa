// User types
export interface User {
  user_id: string;
  username: string;
  email: string;
  disabled?: boolean;
}

export interface UserCredentials {
  username: string;
  email: string;
  password: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user_id: string;
  username: string;
  email: string;
  access_token: string;
  token_type: string;
}

// Thread types
export interface Thread {
  thread_id: string;
  created_at?: string;
  updated_at?: string;
  preview?: string;
}

export interface ThreadCreateResponse {
  thread_id: string;
}

// Message types
export interface Message {
  message_id?: string;
  thread_id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
  pending?: boolean;
}

export interface MessageCreateResponse {
  message_id: string;
}

export interface ImageToTextResponse {
  text: string;
}

// Auth context types
export interface AuthContextType {
  currentUser: User | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  loading: boolean;
}
