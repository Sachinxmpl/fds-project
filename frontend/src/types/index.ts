export interface User {
    id: string;
    username: string;
    email: string;
    avatar?: string;
  }
  
  export interface Message {
    id: string;
    content: string;
    timestamp: number;
    sender: 'user' | 'ai';
  }
  
  export interface Conversation {
    id: string;
    title: string;
    messages: Message[];
    createdAt: number;
    updatedAt: number;
  }