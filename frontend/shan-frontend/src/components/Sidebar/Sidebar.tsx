// src/components/Sidebar/Sidebar.tsx
import React from 'react';
import NewChatButton from './NewChatButton';
import ThreadList from './ThreadList';
import { useAuth } from '../../contexts/AuthContext';
import { Thread } from '../../types';

interface SidebarProps {
  threads: Thread[];
  activeThreadId: string | null;
  onThreadSelect: (threadId: string) => void;
  onNewChat: () => void;
  loading: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  threads, 
  activeThreadId, 
  onThreadSelect, 
  onNewChat, 
  loading 
}) => {
  const { currentUser, logout } = useAuth();

  return (
    <div className="flex flex-col h-full bg-gray-50 border-r border-gray-200 w-64">
      <div className="p-4">
        <h1 className="text-xl font-bold text-gray-800 mb-2">AI Chatbot</h1>
        <p className="text-sm text-gray-600 mb-4">
          Welcome, {currentUser?.username || 'User'}
        </p>
        
        <NewChatButton onClick={onNewChat} disabled={loading} />
      </div>
      
      <ThreadList
        threads={threads}
        activeThreadId={activeThreadId}
        onThreadSelect={onThreadSelect}
      />
      
      <div className="mt-auto p-4 border-t border-gray-200">
        <button
          onClick={logout}
          className="w-full py-2 px-4 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Log Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;