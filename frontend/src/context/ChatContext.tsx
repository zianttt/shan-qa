import { createContext, useContext, useEffect, useState } from "react"
import type { Chats, Message, CompletionMessageDto, FileObj } from "../helpers/types";
import { createChatroom, deleteChatroom, sendChat, getChatroomMessages, getChatrooms, imageToText, fetchSignedUrl, fetchSignedUrls, editChatroom } from "../helpers/api";
import { llmMapping } from "../helpers/constants";

type SignedUrlCache = {
  url: string;
  expiresAt: Date;
};

type ChatContextType = {
  message: string;
  chats: Chats[];
  currentChat: Chats | null;
  files: FileObj[];
  isLoading: boolean;
  signedUrlCache: Map<string, SignedUrlCache>; // Cache for signed URLs
  model: string;
  setModel: (model: string) => void;
  handleCreateNewChatroom: () => void;
  deleteChat: (chatId: string) => Promise<void>;
  renameChat: (chatId: string, newTitle: string) => Promise<void>;
  sendMessage: () => Promise<void>;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeFiles: (index: number) => void;
  setActiveChat: (chatId: string) => Promise<void>;
  setMessage: (message: string) => void;
  getSignedUrl: (s3Key: string) => Promise<string | null>;
}

const ChatContext = createContext<ChatContextType | null>(null);

const ChatProvider = ({ children }: { children: React.ReactNode}) => {
  const [message, setMessage] = useState('');
  const [chats, setChats] = useState<Chats[]>([]);
  const [currentChat, setCurrentChat] = useState<Chats | null>(null);
  const [files, setFiles] = useState<FileObj[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [signedUrlCache, setSignedUrlCache] = useState<Map<string, SignedUrlCache>>(new Map());
  const [model, setModel] = useState<string>('');

  useEffect(() => {
    if (!model && Object.keys(llmMapping).length > 0) {
      const firstModelActualName = Object.values(llmMapping)[0];
      setModel(firstModelActualName);
    }
  }, [model]);

  const getSignedUrl = async (s3Key: string): Promise<string | null> => {
    try {
      // Check cache first
      const cached = signedUrlCache.get(s3Key);
      if (cached && cached.expiresAt > new Date()) {
        return cached.url;
      }

      const { signedUrl, expiresAt } = await fetchSignedUrl(s3Key);

      // Update cache
      setSignedUrlCache(prev => {
        const newCache = new Map(prev);
        newCache.set(s3Key, { url: signedUrl, expiresAt });
        return newCache;
      });

      return signedUrl;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      return null;
    }
  };

  // Batch fetch signed URLs for multiple attachments
  const getSignedUrls = async (s3Keys: string[]): Promise<Record<string, string>> => {
    try {
      // Filter out keys that are still valid in cache
      const now = new Date();
      const keysToFetch = s3Keys.filter(key => {
        const cached = signedUrlCache.get(key);
        return !cached || cached.expiresAt <= now;
      });

      // Get cached URLs
      const cachedUrls: Record<string, string> = {};
      s3Keys.forEach(key => {
        const cached = signedUrlCache.get(key);
        if (cached && cached.expiresAt > now) {
          cachedUrls[key] = cached.url;
        }
      });

      // Fetch new URLs if needed
      if (keysToFetch.length > 0) {
        const {signedUrls, expiresAt } = await fetchSignedUrls(keysToFetch);


        // Update cache
        setSignedUrlCache(prev => {
          const newCache = new Map(prev);
          Object.entries(signedUrls).forEach(([key, url]) => {
            newCache.set(key, { url: url as string, expiresAt });
          });
          return newCache;
        });

        return { ...cachedUrls, ...signedUrls };
      }

      return cachedUrls;
    } catch (error) {
      console.error('Error getting signed URLs:', error);
      return {};
    }
  };

  useEffect(() => {
    const fetchChatrooms = async () => {
      const data = await getChatrooms();
      if (!data) {
        console.error("Failed to fetch chatrooms");
        return;
      }
      console.log("Fetched chatrooms:", data);
      const chatrooms = data.chatrooms
        .map((chatroom: any) => ({
          id: chatroom._id,
          title: chatroom.name,
          messages: [],
          createdAt: new Date(chatroom.created_at),
          updatedAt: new Date(chatroom.updated_at)
        }))
        .sort((a: Chats, b: Chats) => b.updatedAt.getTime() - a.updatedAt.getTime());
      setChats(chatrooms);
    }

    fetchChatrooms().catch((err) => {
      console.error("Error fetching chatrooms:", err);
    });
  }, []);

  const handleCreateNewChatroom = () => {
    setMessage('');
    setFiles([]);
    setCurrentChat(null);
  }

  const createNewChatroom = async (): Promise<Chats> => {
    const chatroomName = `New Chat ${chats.length + 1}`;
    const chatroomId   = await createChatroom(chatroomName);
    if (!chatroomId) throw new Error("Failed to create chatroom");

    const newChat: Chats = {
      id:        chatroomId,
      title:     chatroomName,
      messages:  [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // queue up both state updates for next render
    setChats((prev) => [newChat, ...prev]);
    setCurrentChat(newChat);

    return newChat;
  };

  const setActiveChat = async (chatId: string) => {
    const chat = chats.find(chat => chat.id === chatId);
    if (!chat) {
      console.error("Chat not found");
      return;
    }

    const messages = await getChatroomMessages(chatId);
    if (!messages) {
      console.error("Failed to fetch chatroom messages");
      return;
    }
    
    const updatedChat: Chats = {
      ...chat,
      messages: messages.map((msg: any) => ({
        id: msg._id,
        content: msg.content,
        sender: msg.sender,
        timestamp: new Date(msg.created_at),
        attachments: msg.attachments?.map((att: any) => ({
          s3Key: att.s3Key,           // Store S3 key instead of URL
          description: att.description,
          fileName: att.fileName,
          contentType: att.contentType
        })) || []
      })).sort((a: Message, b: Message) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
    };

    setCurrentChat(updatedChat);
    const updatedChats = chats.map(c => 
      c.id === chatId ? updatedChat : c
    );
    setChats(updatedChats);

    // Prefetch signed URLs for all attachments in this chat
    const allS3Keys = updatedChat.messages.flatMap(msg => 
      msg.attachments?.map(att => att.s3Key) || []
    );
    if (allS3Keys.length > 0) {
      getSignedUrls(allS3Keys); // Prefetch URLs in background
    }

    console.log("Active chat set:", updatedChat);
  }

  const deleteChat = async (chatId: string) => {
    const data = await deleteChatroom(chatId); 
    if (!data) {
      console.error("Failed to delete chatroom");
      return;
    }
    
    const updatedChats = chats.filter(chat => chat.id !== chatId);
    setChats(updatedChats);
    setCurrentChat(null);
    setMessage('');
    setFiles([]);
  };

  const renameChat = async (chatId: string, newTitle: string) => {
    if (!newTitle.trim()) {
      console.error("Chat title cannot be empty");
      return;
    }

    const updatedChatId = await editChatroom(chatId, newTitle);
    if (!updatedChatId) {
      console.error("Failed to rename chatroom");
      return;
    }

    const updatedChats = chats.map(chat => 
      chat.id === chatId ? { ...chat, title: newTitle } : chat
    );
    setChats(updatedChats);
    if (currentChat?.id === chatId) {
      setCurrentChat({ ...currentChat, title: newTitle });
    }
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {

    const files = e.target.files;
    if (!files || files.length === 0) return;

    const selectedFiles = Array.from(files);

    for (const file of selectedFiles) {
      try {
        const previewUrl = URL.createObjectURL(file);
        const description = await imageToText(file);
        setFiles((prev) => [
          ...prev,
          { 
            file: file,
            previewUrl: previewUrl, 
            description: description
          },
        ]);
      } catch (err) {
        console.error("One or more images failed to process:", err);
      }
    }

    if (e.target) {
      e.target.value = "";
    }
  };

  const removeFiles = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  const sendMessage = async () => {
    if (!message.trim() && files.length === 0) return;

    let chat = currentChat;
    if (!chat) {
      chat = await createNewChatroom(); 
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: message.trim(),
      sender: 'user',
      timestamp: new Date(),
      attachments: files.length > 0 ? files.map(file => ({
        s3Key: '', // Will be filled after upload
        description: file.description || ''
      })) : []
    };
    
    const updatedChat = {
      ...chat,
      messages: [...chat.messages, userMessage]
    };
    
    setCurrentChat(updatedChat);
    setChats((prev) =>
      prev.map((c) => (c.id === updatedChat.id ? updatedChat : c))
    );

    setMessage('');
    setFiles([]);
    
    await getCompletion(updatedChat.id, updatedChat);
  };


  const getCompletion = async (chatroomId: string, chat: Chats) => {
    setIsLoading(true);

    const completionMessages: CompletionMessageDto[] = chat.messages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.content,
      attachments: msg.attachments?.map(att => ({
        s3Key: att.s3Key,
        description: att.description
      })) || [],
    }));

    console.log("Sending messages for completion:", completionMessages);

    const completionResponse = await sendChat(chatroomId, completionMessages, files, model);
    if (!completionResponse) {
      console.error("Failed to get completion");
      setIsLoading(false);
      return;
    }

    const assistantMsgStr = completionResponse.assistantMessage || "";
    
    const assistantMessage: Message = {
      id: Date.now().toString(),
      content: assistantMsgStr,
      sender: 'assistant',
      timestamp: new Date()
    };

    // Update the user message with actual S3 keys from server response
    const updatedMessages = [...chat.messages];
    const lastUserMessageIndex = updatedMessages.length - 1;
    if (completionResponse.attachmentKeys && updatedMessages[lastUserMessageIndex].sender === 'user') {
      updatedMessages[lastUserMessageIndex] = {
        ...updatedMessages[lastUserMessageIndex],
        attachments: updatedMessages[lastUserMessageIndex].attachments?.map((att, index) => ({
          ...att,
          s3Key: completionResponse.attachmentKeys[index] || att.s3Key
        }))
      };
    }
    
    // Update current chat with assistant message
    const updatedChat = {
      ...chat,
      messages: [...updatedMessages, assistantMessage]
    };
    
    setCurrentChat(updatedChat);    
    console.log("Messages type: ", updatedChat.messages);
    setIsLoading(false);
  };  

  // Cleanup expired URLs periodically
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = new Date();
      setSignedUrlCache(prev => {
        const newCache = new Map();
        prev.forEach((value, key) => {
          if (value.expiresAt > now) {
            newCache.set(key, value);
          }
        });
        return newCache;
      });
    }, 5 * 60 * 1000); // Clean up every 5 minutes

    return () => clearInterval(cleanupInterval);
  }, []);

  const value = {
    message,
    chats,
    currentChat,
    files,
    isLoading,
    signedUrlCache,
    model,
    setModel,
    handleCreateNewChatroom,
    deleteChat,
    renameChat,
    sendMessage,
    handleImageUpload,
    removeFiles,
    setActiveChat,
    setMessage,
    getSignedUrl
  }

  return <ChatContext.Provider value={value}>
    {children}
  </ChatContext.Provider>
}

const useChatContext = () => useContext(ChatContext);

export { ChatProvider, useChatContext };