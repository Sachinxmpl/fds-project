import axios from "axios";
// import { User, Message, Conversation } from '../types';

const API_BASE_URL = "http://localhost:3000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

//interceptor for attaching tokens to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post("/api/auth/login", { email, password });
    localStorage.setItem("authToken", response.data.token);
    return response.data.user;
  },
  signup: async (username: string, email: string, password: string) => {
    const response = await api.post("/api/auth/register", {
      username,
      email,
      password,
    });
    localStorage.setItem("authToken", response.data.token);
    return response.data.user;
  },
  logout: () => {
    localStorage.removeItem("authToken");
  },
  getCurrentUser: async () => {
    const response = await api.get("/api/auth/verify");
    return response.data.user;
  },
};

export const chatService = {
  getConversations: async () => {
    const response = await api.get("/api/model/chats");
    return response.data.chats;
  },
  getConversation: async (id: string) => {
    const response = await api.get(`/api/model/chats/${id}`);
    return response.data.chat;
  },
  createConversation: async () => {
    const response = await api.post("/api/model/chats");
    return response.data.chat;
  },
  sendMessage: async (conversationId: string, content: string) => {
    const response = await api.post(
      `/api/model/chats/${conversationId}/messages`,
      {
        content,
      }
    );
    return response.data.modelMessage;
  },
};
