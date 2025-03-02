import React from 'react';
import { Message } from '../../types';
import { useAuth } from '../../context/AuthContext';
import UserAvatar from './UserAvatar';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const { user } = useAuth();
  const isUserMessage = message.sender === 'user';

  return (
    <div className={`flex ${isUserMessage ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isUserMessage && (
        <div className="mr-3 flex-shrink-0">
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-sm">
            AI
          </div>
        </div>
      )}
      <div
        className={`max-w-3xl px-4 py-2 rounded-lg ${
          isUserMessage ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white'
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        <span className="text-xs text-gray-300 block mt-1">
          {new Date(message.timestamp).toLocaleTimeString()}
        </span>
      </div>
      {isUserMessage && user && (
        <div className="ml-3 flex-shrink-0">
          <UserAvatar user={user} size="sm" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;