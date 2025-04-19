import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiSend, FiMenu, FiX, FiPause } from 'react-icons/fi'; // Added FiPause
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import ChatMessage from './ChatMessage';
import UserAvatar from './UserAvatar';
import { Conversation, Message } from '../../types';
import { chatService } from '../../services/api';

const ChatPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const loadConversations = async () => {
      try {
        const convos = await chatService.getConversations();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mappedConvos: Conversation[] = convos.map((c: any) => ({
          id: c.id,
          title: c.title,
          messages: [],
          createdAt: new Date(c.createdAt).getTime(),
          updatedAt: new Date(c.updatedAt).getTime(),
        }));
        setConversations(mappedConvos);
        if (mappedConvos.length > 0) {
          setActiveConversation(mappedConvos[0].id);
          const convo = await chatService.getConversation(mappedConvos[0].id);
          setMessages(mapMessages(convo.messages));
        } else {
          handleNewConversation();
        }
      } catch (error) {
        console.error('Failed to load conversations:', error);
      }
    };

    loadConversations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapMessages = (backendMessages: any[]): Message[] => {
    return backendMessages.map((m) => ({
      id: m.id,
      content: m.content,
      timestamp: new Date(m.createdAt).getTime(),
      sender: m.isUser ? 'user' : 'ai',
    }));
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleNewConversation = async () => {
    try {
      const newConvo = await chatService.createConversation();
      const mappedConvo: Conversation = {
        id: newConvo.id,
        title: newConvo.title,
        messages: [],
        createdAt: new Date(newConvo.createdAt).getTime(),
        updatedAt: new Date(newConvo.updatedAt).getTime(),
      };
      setConversations([mappedConvo, ...conversations]);
      setActiveConversation(mappedConvo.id);
      setMessages([]);
      setSidebarOpen(false);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } catch (error) {
      console.error('Failed to create new conversation:', error);
    }
  };

  const selectConversation = async (id: string) => {
    if (id === activeConversation) return;

    try {
      const convo = await chatService.getConversation(id);
      setActiveConversation(id);
      setMessages(mapMessages(convo.messages));
      setSidebarOpen(false);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeConversation || isSending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      timestamp: Date.now(),
      sender: 'user',
    };

    setMessages([...messages, userMessage]);
    setInput('');
    setIsSending(true);

    try {
      const response = await chatService.sendMessage(activeConversation, userMessage.content);
      const aiMessage: Message = {
        id: response.id,
        content: response.content,
        timestamp: new Date(response.createdAt).getTime(),
        sender: 'ai',
      };
      setMessages([...messages, userMessage, aiMessage]);

      const updatedConvos = conversations.map((c) =>
        c.id === activeConversation
          ? { ...c, messages: [...c.messages, userMessage, aiMessage] }
          : c
      );
      setConversations(updatedConvos);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as unknown as React.FormEvent);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-gray-800 text-white">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-gray-900">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <FiX className="h-6 w-6 text-white" />
            </button>
          </div>
          <Sidebar
            conversations={conversations}
            activeConversation={activeConversation}
            onNewConversation={handleNewConversation}
            onSelectConversation={selectConversation}
          />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar
          conversations={conversations}
          activeConversation={activeConversation}
          onNewConversation={handleNewConversation}
          onSelectConversation={selectConversation}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top navigation */}
        <nav className="bg-gray-900">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center lg:hidden">
                  <button onClick={() => setSidebarOpen(true)} className="text-gray-300 hover:text-white">
                    <FiMenu className="h-6 w-6" />
                  </button>
                </div>
              </div>
              <div className="flex items-center">
                <div className="ml-3 relative">
                  <div>
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="max-w-xs bg-gray-900 flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                    >
                      {user && <UserAvatar user={user} />}
                    </button>
                  </div>
                  {userMenuOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <Link
                        to="/"
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Home
                      </Link>
                      <Link
                        to="/settings"
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Chat area */}
        <div className="flex-1 flex flex-col bg-gray-800 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4" onClick={() => setUserMenuOpen(false)}>
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center">
                <h2 className="text-2xl text-gray-400 mb-4">GPT Language Model</h2>
                <p className="text-gray-500 max-w-md text-center mb-8">
                  Start a conversation with our advanced language model trained on the WikiText-2 dataset.
                </p>
              </div>
            ) : (
              messages.map((message) => <ChatMessage key={message.id} message={message} />)
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-gray-700 px-6 py-6">
  {isSending && (
    <div className="flex justify-center mb-4">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )}
  <form onSubmit={handleSendMessage} className="flex items-center">
    <div className="flex-1 min-w-0">
      <textarea
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message..."
        rows={2}
        className="block w-full pl-4 pr-12 py-2 resize-none border rounded-md border-gray-600 bg-gray-700 text-white focus:ring-blue-500 focus:border-blue-500 sm:text-base"
      />
    </div>
    <button
      type="submit"
      disabled={!input.trim() || isSending}
      className={`ml-4 inline-flex items-center px-5 py-2.5 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${
        !input.trim() || isSending
          ? 'bg-gray-600 cursor-not-allowed'
          : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
      }`}
    >
      {isSending ? <FiPause className="h-6 w-6" /> : <FiSend className="h-6 w-6" />} 
    </button>
  </form>
</div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;