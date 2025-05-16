import { Router } from 'express';
import { verifyToken } from '../utils/token-manager.js';
import { createChatroom, deleteChatroom, getChatroomMessages, getUserChatrooms, imageToText, sendMessage } from '../controllers/chat-controllers.js';

const chatRoutes = Router();

chatRoutes.post(
    "/chat",
    verifyToken,
    sendMessage
)

chatRoutes.post(
    "/image-to-text",
    verifyToken,
    imageToText
)

chatRoutes.post(
    "/new-chatroom",
    verifyToken,
    createChatroom
)

chatRoutes.delete(
    "/delete-chatroom/:chatroomId",
    verifyToken,
    deleteChatroom
)

chatRoutes.get(
    "/chatrooms",
    verifyToken,
    getUserChatrooms
)

chatRoutes.get(
    "/chatrooms/:chatroomId",
    verifyToken,
    getChatroomMessages
)

export default chatRoutes;