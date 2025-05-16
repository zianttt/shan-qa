import { createContext, useContext, useState } from "react"
import type { Chats, Message, CompletionMessage } from "../helpers/types";
import { createChatroom, deleteChatroom, sendChat, getChatroomMessages, getChatrooms, imageToText } from "../helpers/api";
import { formatDescriptions } from "../helpers/utils";


type ChatContextType = {
  message: string;
  chats: Chats[];
  currentChat: Chats | null;
  images: string[];
  isLoading: boolean;
  fetchChatrooms: () => Promise<void>;
  createNewChatroom: () => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  renameChat: (chatId: string, newTitle: string) => Promise<void>;
  sendMessage: () => Promise<void>;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeImage: (index: number) => void;
  setActiveChat: (chatId: string) => Promise<void>;
  setMessage: (message: string) => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

const ChatProvider = ({ children }: { children: React.ReactNode}) => {

  const [message, setMessage] = useState('');
  const [chats, setChats] = useState<Chats[]>([]);
  const [currentChat, setCurrentChat] = useState<Chats | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [imageDescriptions, setImageDescriptions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

    if (chatrooms.length > 0) {
      setCurrentChat(chatrooms[0]);
    } else {
      await createNewChatroom();
    }
  }

  const createNewChatroom = async () => {
    if (currentChat && currentChat.messages.length === 0) {
      console.log("No current chat to create a new chat from");
      return;
    }

    const chatroomName = `New Chat ${chats.length + 1}`;
    const data = await createChatroom(chatroomName);
    if (!data) {
      console.error("Failed to create chatroom");
      return;
    }

    const newChat: Chats = {
      id: data._id,
      title: chatroomName,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    setChats([...chats, newChat]);
    setCurrentChat(newChat);
  }

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
        attachments: msg.attachments
      })).sort((a: Message, b: Message) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
    };

    setCurrentChat(updatedChat);
    const updatedChats = chats.map(c => 
      c.id === chatId ? updatedChat : c
    );
    setChats(updatedChats);    
  }

  const deleteChat = async (chatId: string) => {
    const data = await deleteChatroom(chatId); 
    if (!data) {
      console.error("Failed to delete chatroom");
      return;
    }
    
    const updatedChats = chats.filter(chat => chat.id !== chatId);
    setChats(updatedChats);
    if (currentChat?.id === chatId) {
      setCurrentChat(updatedChats[0] || null);
    }
  };

  const renameChat = async (chatId: string, newTitle: string) => {
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
    if (!e.target.files) return;

    const fileArray = Array.from(e.target.files);
    const fileUrls = fileArray.map((file) => URL.createObjectURL(file));

    // kick off all OCR calls in parallel
    try {
      const descriptions = await Promise.all(
        fileArray.map((file) => imageToText(file))
      );

      setImages((prev) => [...prev, ...fileUrls]);
      setImageDescriptions((prev) => [...prev, ...descriptions]);
    } catch (err) {
      console.error("One or more images failed to process:", err);
    }
  };

  // Remove an uploaded image
  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
    const newDescriptions = [...imageDescriptions];
    newDescriptions.splice(index, 1);
    setImageDescriptions(newDescriptions);
  };

  const sendMessage = async () => {
      if (!message.trim() && images.length === 0) return;
      
      if (!currentChat) {
        createNewChatroom();
        return;
      }

      const imageDescription = (imageDescriptions.length > 0 && images.length > 0) ? formatDescriptions(imageDescriptions) : "";

      // Create user message
      const userMessage: Message = {
        id: Date.now().toString(),
        content: imageDescription + message.trim(),
        sender: 'user',
        timestamp: new Date(),
        attachments: images.length > 0 ? [...images] : undefined
      };
      
      // Update current chat with new message
      const updatedChat = {
        ...currentChat,
        messages: [...currentChat.messages, userMessage]
      };
      
      setCurrentChat(updatedChat);
      
      // Update chats list
      const updatedChats = chats.map(chat => 
        chat.id === currentChat.id ? updatedChat : chat
      );
      setChats(updatedChats);
      
      await getCompletion(currentChat.id, updatedChat, images);

      // Clear input and images
      setMessage('');
      setImages([]);
    };


  const getCompletion = async (chatroomId: string, chat: Chats, attachments: string[]) => {
    setIsLoading(true);

    const completionMessages: CompletionMessage[] = chat.messages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.content,
    }));

    const completionResponse = await sendChat(chatroomId, completionMessages, attachments);
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
    
    // Update current chat with assistant message
    const updatedChat = {
      ...chat,
      messages: [...chat.messages, assistantMessage]
    };
    
    setCurrentChat(updatedChat);    
    console.log("Messages type: ", updatedChat.messages);
    setIsLoading(false);
  };  

  const value = {
    message,
    chats,
    currentChat,
    images,
    isLoading,
    fetchChatrooms,
    createNewChatroom,
    deleteChat,
    renameChat,
    sendMessage,
    handleImageUpload,
    removeImage,
    setActiveChat,
    setMessage
  }

  return <ChatContext.Provider value={value}>
    {children}
  </ChatContext.Provider>
}

const useChatContext = () => useContext(ChatContext);

export { ChatProvider, useChatContext };