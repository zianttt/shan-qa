import React, { useState, useRef, useEffect } from 'react';
import { Send, PlusCircle, Trash2, Edit, MessageSquare, Menu, X, Copy, Check, User, Bot, LogOut, ImageIcon, ChevronDown } from 'lucide-react';
import { formatTime } from '../helpers/utils';
import { useChatContext } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Attachments from '../components/shared/Attachments';
import { llmMapping } from '../helpers/constants';

// Type definitions
interface Match {
  type: 'codeBlock' | 'inlineCode' | 'latex' | 'url' | 'bold' | 'italic' | 'strikethrough';
  start: number;
  end: number;
  content: string;
  fullMatch: string;
  language?: string;
}

interface ProcessedRange {
  start: number;
  end: number;
  match: Match;
}

interface InlinePattern {
  regex: RegExp;
  type: Match['type'];
}

interface MessageRendererProps {
  content: string;
}

// Enhanced Message Renderer Component
const MessageRenderer: React.FC<MessageRendererProps> = ({ content }) => {
  const [copiedBlocks, setCopiedBlocks] = useState<Set<string>>(new Set());

  const copyToClipboard = async (text: string, blockId: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedBlocks(prev => new Set([...prev, blockId]));
      setTimeout(() => {
        setCopiedBlocks(prev => {
          const newSet = new Set(prev);
          newSet.delete(blockId);
          return newSet;
        });
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const renderContent = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let blockCounter = 0;

    // Regex patterns for different content types
    const patterns = {
      codeBlock: /```(\w+)?\n([\s\S]*?)```/g,
    };

    // Find all matches and their positions
    const allMatches: Match[] = [];
    
    // Code blocks (highest priority)
    let match: RegExpExecArray | null;
    while ((match = patterns.codeBlock.exec(text)) !== null) {
      allMatches.push({
        type: 'codeBlock',
        start: match.index,
        end: match.index + match[0].length,
        language: match[1] || 'text',
        content: match[2],
        fullMatch: match[0]
      });
    }

    // Reset regex
    patterns.codeBlock.lastIndex = 0;

    // Sort matches by start position
    allMatches.sort((a, b) => a.start - b.start);

    // Process text, avoiding overlaps
    const processedRanges: ProcessedRange[] = [];
    
    allMatches.forEach(match => {
      // Check if this match overlaps with any processed range
      const hasOverlap = processedRanges.some(range => 
        (match.start >= range.start && match.start < range.end) ||
        (match.end > range.start && match.end <= range.end) ||
        (match.start <= range.start && match.end >= range.end)
      );

      if (!hasOverlap) {
        processedRanges.push({ start: match.start, end: match.end, match });
      }
    });

    // Sort processed ranges by start position
    processedRanges.sort((a, b) => a.start - b.start);

    // Build the final content
    let lastIndex = 0;

    processedRanges.forEach(({ match }) => {
      // Add text before this match
      if (match.start > lastIndex) {
        const beforeText = text.slice(lastIndex, match.start);
        parts.push(...processInlineContent(beforeText));
      }

      // Add the matched content
      if (match.type === 'codeBlock') {
        const blockId = `code-${blockCounter++}`;
        parts.push(
          <div key={blockId} className="my-3 rounded-lg overflow-hidden bg-gray-900">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-800 text-sm text-gray-300">
              <span>{match.language}</span>
              <button
                onClick={() => copyToClipboard(match.content, blockId)}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-gray-700 transition-colors"
              >
                {copiedBlocks.has(blockId) ? (
                  <>
                    <Check size={12} />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    Copy
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-sm">
              <code className="text-green-400">{match.content}</code>
            </pre>
          </div>
        );
      }

      lastIndex = match.end;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex);
      parts.push(...processInlineContent(remainingText));
    }

    return parts;
  };

  const processInlineContent = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    const lines = text.split('\n');
    
    lines.forEach((line, lineIndex) => {
      if (lineIndex > 0) parts.push(<br key={`br-${lineIndex}`} />);
      
      const lineParts: React.ReactNode[] = [];

      // Process inline patterns
      const inlinePatterns: InlinePattern[] = [
        { regex: /`([^`]+)`/g, type: 'inlineCode' },
        { regex: /\$\$([\s\S]*?)\$\$|\$([^$]+)\$/g, type: 'latex' },
        { regex: /(https?:\/\/[^\s]+)/g, type: 'url' },
        { regex: /\*\*(.*?)\*\*/g, type: 'bold' },
        { regex: /\*(.*?)\*/g, type: 'italic' },
        { regex: /~~(.*?)~~/g, type: 'strikethrough' },
      ];

      const matches: Match[] = [];
      inlinePatterns.forEach(pattern => {
        let match: RegExpExecArray | null;
        while ((match = pattern.regex.exec(line)) !== null) {
          matches.push({
            type: pattern.type,
            start: match.index,
            end: match.index + match[0].length,
            content: match[1] || match[2] || match[0],
            fullMatch: match[0]
          });
        }
        pattern.regex.lastIndex = 0;
      });

      matches.sort((a, b) => a.start - b.start);

      // Remove overlapping matches
      const validMatches: Match[] = [];
      matches.forEach(match => {
        const hasOverlap = validMatches.some(vm => 
          (match.start >= vm.start && match.start < vm.end) ||
          (match.end > vm.start && match.end <= vm.end)
        );
        if (!hasOverlap) {
          validMatches.push(match);
        }
      });

      let pos = 0;
      validMatches.forEach((match, matchIndex) => {
        // Add text before match
        if (match.start > pos) {
          lineParts.push(line.slice(pos, match.start));
        }

        // Add formatted content
        switch (match.type) {
          case 'inlineCode':
            lineParts.push(
              <code key={`inline-${lineIndex}-${matchIndex}`} className="bg-gray-200 px-1 py-0.5 rounded text-sm font-mono">
                {match.content}
              </code>
            );
            break;
          case 'latex':
            lineParts.push(
              <span key={`latex-${lineIndex}-${matchIndex}`} className="bg-blue-50 px-1 py-0.5 rounded text-sm font-mono text-blue-800">
                {match.fullMatch}
              </span>
            );
            break;
          case 'url':
            lineParts.push(
              <a 
                key={`url-${lineIndex}-${matchIndex}`}
                href={match.content} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                {match.content}
              </a>
            );
            break;
          case 'bold':
            lineParts.push(
              <strong key={`bold-${lineIndex}-${matchIndex}`}>
                {match.content}
              </strong>
            );
            break;
          case 'italic':
            lineParts.push(
              <em key={`italic-${lineIndex}-${matchIndex}`}>
                {match.content}
              </em>
            );
            break;
          case 'strikethrough':
            lineParts.push(
              <del key={`strike-${lineIndex}-${matchIndex}`}>
                {match.content}
              </del>
            );
            break;
        }

        pos = match.end;
      });

      // Add remaining text
      if (pos < line.length) {
        lineParts.push(line.slice(pos));
      }

      parts.push(...lineParts);
    });

    return parts;
  };

  return <div className="whitespace-pre-wrap">{renderContent(content)}</div>;
};


const Chat: React.FC = () => {
  let navigate = useNavigate();
  const auth = useAuth();

  useEffect(() => {
        // Only redirect if auth check is complete and user is not logged in
        if (auth && !auth.isLoading && !auth.isLoggedIn) {
            navigate('/login');
        }
  }, [auth?.isLoading, auth?.isLoggedIn]);

  // State management
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');
  const [modelDropdownOpen, setModelDropdownOpen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const chatContext = useChatContext();

  // Scroll to bottom of messages
  useEffect(() => { 
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatContext?.currentChat?.messages]);

  useEffect(() => {
    if (editingChatId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingChatId]);

  // Handle Enter key for sending message
  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      console.log(chatContext?.currentChat?.messages);
      await chatContext?.sendMessage();
    }
  };

  // Start editing a chat title
  const startEditing = (chatId: string, currentTitle: string) => {
    setEditingChatId(chatId);
    setEditingTitle(currentTitle);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingChatId(null);
    setEditingTitle('');
  };

  // Save the edited title
  const saveTitle = async (chatId: string) => {
    if (editingTitle.trim() && editingTitle.trim() !== '') {
      try {
        await chatContext?.renameChat(chatId, editingTitle.trim());
        setEditingChatId(null);
        setEditingTitle('');
      } catch (error) {
        console.error('Failed to rename chat:', error);
        // Optionally show error message to user
      }
    } else {
      cancelEditing();
    }
  };

  // Handle key events in edit input
  const handleEditKeyDown = async (e: React.KeyboardEvent, chatId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await saveTitle(chatId);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditing();
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Backdrop for mobile sidebar */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Toggle for Mobile */}
      <button 
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 hover:bg-white transition-all duration-200"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X size={20} className="text-slate-700" /> : <Menu size={20} className="text-slate-700" />}
      </button>

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-all duration-300 ease-out bg-white/70 backdrop-blur-xl w-80 overflow-hidden flex flex-col border-r border-slate-200/50 shadow-xl absolute md:relative h-full z-40`}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-200/50 bg-gradient-to-r from-blue-50 to-indigo-50 space-y-4">
          <button 
            onClick={chatContext?.handleCreateNewChatroom}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl flex items-center justify-center font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
          >
            <PlusCircle size={18} className="mr-2" />
            New Conversation
          </button>

          {/* LLM Model Selector */}
          <div className="relative">
            <button
              onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
              className="w-full py-3 px-4 bg-white/80 hover:bg-white/90 text-slate-700 rounded-xl flex items-center justify-between font-medium shadow-sm hover:shadow-md transition-all duration-200 border border-slate-200/50"
            >
              <div className="flex items-center">
                <span className="text-sm text-slate-500 mr-2">Model:</span>
                <span className="truncate">
                  {Object.keys(llmMapping).find(key => llmMapping[key] === chatContext?.model) || 'Select Model'}
                </span>
              </div>
              <ChevronDown 
                size={16} 
                className={`transition-transform duration-200 ${modelDropdownOpen ? 'rotate-180' : ''}`} 
              />
            </button>
            
            {/* Dropdown Menu */}
            {modelDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-slate-200/50 z-50 max-h-60 overflow-y-auto">
                {Object.entries(llmMapping).map(([displayName, actualName]) => (
                  <button
                    key={actualName}
                    onClick={() => {
                      chatContext?.setModel?.(actualName);
                      setModelDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors duration-150 first:rounded-t-xl last:rounded-b-xl ${
                      chatContext?.model === actualName 
                        ? 'bg-blue-50 text-blue-700 font-medium' 
                        : 'text-slate-700'
                    }`}
                  >
                    <div className="truncate">{displayName}</div>
                    {chatContext?.model === actualName && (
                      <div className="text-xs text-blue-500 mt-1">Currently selected</div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {chatContext?.chats.map(chat => (
            <div 
              key={chat.id} 
              className={`p-4 rounded-xl cursor-pointer flex items-center justify-between group transition-all duration-200 hover:scale-[1.02] ${
                chatContext?.currentChat?.id === chat.id 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg' 
                  : 'bg-white/60 hover:bg-white/80 text-slate-700 shadow-sm hover:shadow-md border border-slate-200/50'
              }`}
              onClick={() => editingChatId !== chat.id && chatContext?.setActiveChat(chat.id)}
            >
              <div className="flex items-center flex-1 overflow-hidden">
                <div className={`p-2 rounded-lg mr-3 flex-shrink-0 ${
                  chatContext?.currentChat?.id === chat.id 
                    ? 'bg-white/20' 
                    : 'bg-gradient-to-r from-blue-100 to-indigo-100'
                }`}>
                  <MessageSquare size={16} className={
                    chatContext?.currentChat?.id === chat.id ? 'text-white' : 'text-blue-600'
                  } />
                </div>
                
                {/* Editable Title */}
                {editingChatId === chat.id ? (
                  <input
                    ref={editInputRef}
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={(e) => handleEditKeyDown(e, chat.id)}
                    onBlur={() => saveTitle(chat.id)}
                    className={`flex-1 bg-transparent border-none outline-none font-medium text-sm px-2 py-1 rounded ${
                      chatContext?.currentChat?.id === chat.id
                        ? 'text-white placeholder-white/60 focus:bg-white/10'
                        : 'text-slate-700 placeholder-slate-400 focus:bg-slate-50'
                    }`}
                    placeholder="Enter chat name..."
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div className="truncate font-medium flex-1">{chat.title}</div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className={`items-center space-x-1 ${
                editingChatId === chat.id ? 'flex' : 'hidden group-hover:flex'
              }`}>
                {editingChatId === chat.id ? (
                  // Save/Cancel buttons when editing
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        saveTitle(chat.id);
                      }}
                      className={`p-2 rounded-lg transition-colors ${
                        chatContext?.currentChat?.id === chat.id 
                          ? 'hover:bg-green-500/20 text-white/70 hover:text-green-200' 
                          : 'hover:bg-green-50 text-slate-400 hover:text-green-600'
                      }`}
                      title="Save"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        cancelEditing();
                      }}
                      className={`p-2 rounded-lg transition-colors ${
                        chatContext?.currentChat?.id === chat.id 
                          ? 'hover:bg-red-500/20 text-white/70 hover:text-red-200' 
                          : 'hover:bg-red-50 text-slate-400 hover:text-red-500'
                      }`}
                      title="Cancel"
                    >
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  // Edit/Delete buttons when not editing
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(chat.id, chat.title);
                      }}
                      className={`p-2 rounded-lg transition-colors ${
                        chatContext?.currentChat?.id === chat.id 
                          ? 'hover:bg-white/20 text-white/70 hover:text-white' 
                          : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'
                      }`}
                      title="Rename"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        chatContext?.deleteChat(chat.id);
                      }}
                      className={`p-2 rounded-lg transition-colors ${
                        chatContext?.currentChat?.id === chat.id 
                          ? 'hover:bg-red-500/20 text-white/70 hover:text-red-200' 
                          : 'hover:bg-red-50 text-slate-400 hover:text-red-500'
                      }`}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-200/50 bg-gradient-to-r from-slate-50 to-slate-100/50">
          <button 
            onClick={auth?.logout}
            className="w-full py-3 px-4 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl flex items-center justify-center font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
          >
            <LogOut size={18} className="mr-2" />
            Sign Out
          </button>
        </div>
      </div>
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Chat Header */}
        <div className="p-6 border-b border-slate-200/50 bg-white/70 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {chatContext?.currentChat?.title || 'New Conversation'}
              </h2>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {(chatContext?.currentChat?.messages.length === 0 || chatContext?.currentChat == null) ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center p-8 max-w-md">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <MessageSquare size={32} className="text-white" />
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-3">
                  Shan-GPT
                </h2>
                <p className="text-slate-500 leading-relaxed">
                  Start a conversation.
                </p>
              </div>
            </div>
          ) : (
            chatContext?.currentChat?.messages.map((msg, index) => (
              <div 
                key={`${msg.timestamp.toISOString()}-${index}`} 
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[75%] ${msg.sender === 'user' ? 'order-1' : 'order-2'}`}>
                  <div className={`rounded-2xl p-4 shadow-lg ${
                    msg.sender === 'user' 
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white' 
                      : 'bg-white border border-slate-200/50 text-slate-800'
                  }`}>
                    <MessageRenderer content={msg.content} />
                    <Attachments attachments={msg.attachments || []} />
                  </div>
                  <div className={`text-xs mt-2 px-2 ${
                    msg.sender === 'user' ? 'text-right text-slate-400' : 'text-left text-slate-400'
                  }`}>
                    {formatTime(msg.timestamp)}
                  </div>
                </div>
                
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.sender === 'user' ? 'order-2 ml-3 bg-gradient-to-r from-blue-500 to-indigo-600' : 'order-1 mr-3 bg-gradient-to-r from-slate-400 to-slate-500'
                } shadow-lg`}>
                  {msg.sender === 'user' ? (
                    <User size={14} className="text-white" />
                  ) : (
                    <Bot size={14} className="text-white" />
                  )}
                </div>
              </div>
            ))
          )}
          
          {/* Loading indicator */}
          {chatContext?.isLoading && (
            <div className="flex justify-start">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-slate-400 to-slate-500 flex items-center justify-center shadow-lg">
                  <Bot size={14} className="text-white" />
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-lg border border-slate-200/50">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                    <span className="text-sm text-slate-500">AI is thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Image Previews */}
        {(chatContext?.files.length && chatContext?.files.length > 0) ? (
          <div className="px-6 pb-4">
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-slate-200/50 shadow-lg">
              <div className="flex items-center mb-3">
                <ImageIcon size={16} className="text-slate-500 mr-2" />
                <span className="text-sm font-medium text-slate-700">Attachments</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {chatContext?.files.map((file, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={file.previewUrl} 
                      alt="Upload preview" 
                      className="h-20 w-20 object-cover rounded-xl border-2 border-slate-200/50 shadow-md group-hover:shadow-lg transition-all duration-200"
                    />
                    <button 
                      onClick={() => chatContext?.removeFiles(index)}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 transform hover:scale-110"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
        
        {/* Input Area */}
        <div className="p-6 border-t border-slate-200/50 bg-white/70 backdrop-blur-xl">
          <div className="bg-white rounded-2xl border border-slate-200/50 shadow-xl overflow-hidden">
            <div className="flex items-end">
              <textarea
                value={chatContext?.message}
                onChange={(e) => chatContext?.setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message here..."
                className="flex-1 px-6 py-4 outline-none resize-none max-h-32 text-slate-800 placeholder-slate-400"
                rows={1}
              />
              
              <div className="flex items-center p-4 space-x-2">
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
                  className="p-3 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all duration-200 transform hover:scale-110"
                  title="Attach images"
                >
                  <PlusCircle size={20} />
                </button>
                
                <button 
                  onClick={chatContext?.sendMessage}
                  disabled={chatContext?.isLoading || (!chatContext?.message.trim() && chatContext?.files.length === 0)}
                  className={`p-3 rounded-xl transition-all duration-200 transform hover:scale-110 ${
                    chatContext?.isLoading || (!chatContext?.message.trim() && chatContext?.files.length === 0) 
                      ? 'text-slate-300 cursor-not-allowed' 
                      : 'text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl'
                  }`}
                  title="Send message"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;