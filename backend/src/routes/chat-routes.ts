import { Router } from 'express';
import { verifyToken } from '../utils/token-manager.js';
import { createChatroom, deleteChatroom, editChatroom, getChatroomMessages, getSignedAttachmentUrl, getSignedAttachmentUrls, getUserChatrooms, imageToText, sendMessage } from '../controllers/chat-controllers.js';
import { upload } from '../utils/image-uploads.js';

const chatRoutes = Router();

chatRoutes.post(
    "/chat",
    verifyToken,
    upload.array("files", 5),
    sendMessage
)

chatRoutes.get(
    '/attachment/:s3Key',
     verifyToken,
     getSignedAttachmentUrl
);

chatRoutes.post(
    '/attachments/signed-urls', 
    verifyToken, 
    getSignedAttachmentUrls
)

chatRoutes.post(
    "/image-to-text",
    verifyToken,
    upload.single("image"),
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

chatRoutes.put(
    "/chatrooms/:chatroomId",
    verifyToken,
    editChatroom
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