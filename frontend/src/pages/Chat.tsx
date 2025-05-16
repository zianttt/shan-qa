import React, { useState, useRef, useEffect } from 'react';
import { Send, PlusCircle, Trash2, Edit, MessageSquare, Menu, X } from 'lucide-react';
import { formatTime } from '../helpers/utils';
import { useChatContext } from '../context/ChatContext';
import type { Message } from '../helpers/types';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Chat() {

  const chatContext = useChatContext();
  const auth = useAuth();

  let navigate = useNavigate();

  useEffect(() => {
    if (!auth?.isLoaggedIn) {
      navigate('/login');
    }
  }, [auth?.isLoaggedIn, navigate]);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  useEffect(() => { 
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatContext?.currentChat?.messages]);

  // Effect to create initial chat if none exists
  useEffect(() => {
    chatContext?.fetchChatrooms();
  }, []);

  // Handle Enter key for sending message
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      chatContext?.sendMessage();
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">
      {/* Sidebar Toggle for Mobile */}
      <button 
        className="md:hidden absolute top-4 left-4 z-50"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 bg-gray-100 w-64 overflow-y-auto flex flex-col border-r border-gray-200 absolute md:relative h-full z-40`}>
        <div className="p-4 border-b border-gray-200">
          <button 
            onClick={chatContext?.createNewChatroom}
            className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-md flex items-center justify-center font-medium"
          >
            <PlusCircle size={18} className="mr-2" /> New Chat
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {chatContext?.chats.map(chat => (
            <div 
              key={chat.createdAt.toISOString()} 
              className={`p-2 mb-1 rounded-md cursor-pointer flex items-center justify-between group ${chatContext?.currentChat?.id === chat.id ? 'bg-blue-100' : 'hover:bg-gray-200'}`}
              onClick={() => chatContext?.setActiveChat(chat.id)}
            >
              <div className="flex items-center flex-1 overflow-hidden">
                <MessageSquare size={16} className="mr-2 flex-shrink-0" />
                <div className="truncate">{chat.title}</div>
              </div>
              
              <div className="hidden group-hover:flex items-center">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    const newTitle = prompt('Enter new name:', chat.title);
                    if (newTitle) chatContext?.renameChat(chat.id, newTitle);
                  }}
                  className="p-1 text-gray-500 hover:text-gray-700"
                >
                  <Edit size={16} />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Are you sure you want to delete this chat?')) {
                      chatContext?.deleteChat(chat.id);
                    }
                  }}
                  className="p-1 text-gray-500 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={auth?.logout}
            className="w-full py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-md flex items-center justify-center font-medium"
          >
            Logout
          </button>
        </div>
        
      </div>
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {chatContext?.currentChat?.messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center p-6 max-w-md">
                <h2 className="text-2xl font-bold mb-2">Welcome to Chat</h2>
                <p className="text-gray-600 mb-4">Start a conversation with your AI assistant</p>
              </div>
            </div>
          ) : (
            chatContext?.currentChat?.messages.map((msg: Message) => (
              <div 
                key={msg.timestamp.toISOString()} 
                className={`mb-4 flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`rounded-lg p-3 max-w-[80%] ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                  {msg.content}
                  
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {msg.attachments.map((img, i) => (
                        <img 
                          key={i} 
                          src={img} 
                          alt="Attachment" 
                          className="rounded-md max-h-40 object-cover"
                        />
                      ))}
                    </div>
                  )}
                  
                  <div className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                    {formatTime(msg.timestamp)}
                  </div>
                </div>
              </div>
            ))
          )}
          
          {/* Loading indicator */}
          {chatContext?.isLoading && (
            <div className="flex items-center space-x-2 p-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
              <span className="text-sm text-gray-500">Thinking...</span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Image Previews */}
        {(chatContext?.images.length && chatContext?.images.length > 0 ) ? (
          <div className="px-4 pb-2 flex flex-wrap gap-2">
            {chatContext?.images.map((img, index) => (
              <div key={index} className="relative">
                <img 
                  src={img} 
                  alt="Upload preview" 
                  className="h-16 w-16 object-cover rounded-md"
                />
                <button 
                  onClick={() => chatContext?.removeImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        ) : null}
        
        {/* Input Area */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-end bg-white rounded-lg border border-gray-300 overflow-hidden">
            <textarea
              value={chatContext?.message}
              onChange={(e) => chatContext?.setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 outline-none resize-none max-h-32"
              rows={1}
            />
            
            <div className="flex items-center p-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={chatContext?.handleImageUpload}
                accept="image/*"
                multiple
                className="hidden"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-500 hover:text-blue-500"
              >
                <PlusCircle size={20} />
              </button>
              
              <button 
                onClick={chatContext?.sendMessage}
                disabled={chatContext?.isLoading || (!chatContext?.message.trim() && chatContext?.images.length === 0)}
                className={`p-2 rounded-full ${chatContext?.isLoading || (!chatContext?.message.trim() && chatContext?.images.length === 0) ? 'text-gray-400' : 'text-blue-500 hover:bg-blue-50'}`}
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}