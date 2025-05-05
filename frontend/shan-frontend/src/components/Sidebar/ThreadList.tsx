// src/components/Sidebar/ThreadList.tsx
import React from 'react';
import { Thread } from '../../types';

interface ThreadListProps {
  threads: Thread[];
  activeThreadId: string | null;
  onThreadSelect: (threadId: string) => void;
}

const ThreadList: React.FC<ThreadListProps> = ({ threads, activeThreadId, onThreadSelect }) => {
  // Format the date
  const formatDate = (timestamp?: string): string => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  // Get first message from thread to use as preview
  const getThreadPreview = (thread: Thread): string => {
    if (thread.preview) return thread.preview;
    return 'New conversation';
  };

  return (
    <div className="flex-grow overflow-y-auto">
      <h2 className="text-sm font-medium text-gray-500 mb-2 px-3">Recent Chats</h2>
      <ul className="space-y-1">
        {threads.length > 0 ? (
          threads.map((thread) => (
            <li key={thread.thread_id}>
              <button
                onClick={() => onThreadSelect(thread.thread_id)}
                className={`w-full text-left p-3 rounded-lg transition-colors flex items-center ${
                  activeThreadId === thread.thread_id
                    ? 'bg-gray-200'
                    : 'hover:bg-gray-100'
                }`}
              >
                <div className="mr-3 text-gray-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {getThreadPreview(thread)}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {formatDate(thread.created_at)}
                  </p>
                </div>
              </button>
            </li>
          ))
        ) : (
          <li className="px-3 py-2 text-sm text-gray-500">
            No conversations yet
          </li>
        )}
      </ul>
    </div>
  );
};

export default ThreadList;