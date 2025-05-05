// src/components/Sidebar/NewChatButton.tsx
import React from 'react';

interface NewChatButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

const NewChatButton: React.FC<NewChatButtonProps> = ({ onClick, disabled }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg mb-4 flex items-center justify-center transition-colors"
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
          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
        />
      </svg>
      New Chat
    </button>
  );
};

export default NewChatButton;