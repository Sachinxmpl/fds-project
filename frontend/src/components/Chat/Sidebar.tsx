import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiHome, FiSettings, FiLogOut, FiPlus } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { Conversation } from '../../types';
import UserAvatar from './UserAvatar';

interface SidebarProps {
  conversations: Conversation[];
  activeConversation: string | null;
  onNewConversation: () => void;
  onSelectConversation: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversation,
  onNewConversation,
  onSelectConversation,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col h-full">
      <div className="px-4 py-5 flex items-center">
        <Link to="/" className="text-xl font-bold text-white">
          GPT Model
        </Link>
      </div>

      <div className="px-4 py-2">
        <button
          onClick={onNewConversation}
          className="w-full flex items-center justify-center px-4 py-2 border border-gray-700 rounded-md text-sm font-medium text-white hover:bg-gray-800"
        >
          <FiPlus className="mr-2" /> New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2">
        {conversations.map((conversation) => (
          <button
            key={conversation.id}
            onClick={() => onSelectConversation(conversation.id)}
            className={`w-full text-left px-3 py-2 my-1 rounded-md text-sm ${
              activeConversation === conversation.id ? 'bg-gray-800' : 'hover:bg-gray-800'
            }`}
          >
            {conversation.title || 'New Conversation'}
          </button>
        ))}
      </div>

      <div className="border-t border-gray-700 px-4 py-3">
        <div className="flex items-center">
          {user && (
            <>
              <div className="flex-shrink-0">
                <UserAvatar user={user} size="sm" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">Hi, {user.username}</p>
              </div>
            </>
          )}
        </div>
        <div className="mt-3 space-y-1">
          <Link
            to="/"
            className="flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-800"
          >
            <FiHome className="mr-3 h-4 w-4" />
            Home
          </Link>
          <Link
            to="/settings"
            className="flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-800"
          >
            <FiSettings className="mr-3 h-4 w-4" />
            Settings
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center px-2 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-800"
          >
            <FiLogOut className="mr-3 h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;