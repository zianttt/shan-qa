import { NextFunction, Request, Response } from "express";
import User from "../models/User.js";
import Chatroom from "../models/Chatroom.js";
import Message from "../models/Message.js";
import multer from "multer";
import { generateChatCompletion, multimodalCompletion } from "../utils/api.js";

const upload = multer();

export const sendMessage = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { chatroomId, messages, attachments } = req.body;
    const user = await User.findById(res.locals.jwtData.id);
    if (!user) {
        res.status(404).json({
            success: false,
            message: "User not found",
        });
        return;
    } 

    const userMessage = await Message.create({
        attachments: attachments,
        chatroom_id: chatroomId,
        content: messages[messages.length - 1].content,
        sender: "user",
    });

    const completeResponse = await generateChatCompletion(messages);
    if (!completeResponse) {
        res.status(500).json({
            success: false,
            message: "Failed to generate chat completion",
        });
        return;
    }

    const assistantMessage = await Message.create({
        chatroom_id: chatroomId,
        content: completeResponse,
        sender: "assistant",
    });

    res.status(200).json({
        success: true,
        message: "Message sent successfully",
        userMessage: userMessage.content,
        assistantMessage: assistantMessage.content,
    });

    return;
}

export const imageToText = async (
    req: Request & { file: Express.Multer.File },
    res: Response,
    next: NextFunction
  ) => {
      try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: "No image file found in request",
      });
        return;
    }

    const imageBuffer = req.file.buffer;
    const imageBase64 = imageBuffer.toString("base64");

    const text = await multimodalCompletion(imageBase64);

    res.status(200).json({
      success: true,
      message: text,
    });
    return
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "An error occurred while processing the image",
    });
    return;
  }
  };

export const getUserChatrooms = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const user = await User.findById(res.locals.jwtData.id);
    if (!user) {
        res.status(404).json({
            success: false,
            message: "User not found",
        });
        return;
    }
    const chatrooms = await Chatroom.find({ owner: user._id });
    res.status(200).json({
        success: true,
        chatrooms,
    });
}

export const getChatroomMessages = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { chatroomId } = req.params;
    const messages = await Message
                            .find({ chatroom_id: chatroomId })
                            .sort({
                                created_at: -1,
                            });
    res.status(200).json({
        success: true,
        messages,
    });
}

export const createChatroom = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { name } = req.body;
    const user = await User.findById(res.locals.jwtData.id);
    if (!user) {
        res.status(404).json({
            success: false,
            message: "User not found",
        });
        return;
    }
    const chatroom = await Chatroom.create({
        name,
        owner: user._id,
    });
    res.status(200).json({
        success: true,
        chatroom,
    });
}

export const deleteChatroom = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { chatroomId } = req.params;
    const user = await User.findById(res.locals.jwtData.id);
    if (!user) {
        res.status(404).json({
            success: false,
            message: "User not found",
        });
        return;
    }
    const chatroom = await Chatroom.findById(chatroomId);
    if (!chatroom) {
        res.status(404).json({
            success: false,
            message: "Chatroom not found",
        });
        return;
    }
    if (chatroom.owner.toString() !== user._id.toString()) {
        res.status(401).json({
            success: false,
            message: "Unauthorized",
        });
        return;
    }
    await chatroom.deleteOne();
    res.status(200).json({
        success: true,
        message: "Chatroom deleted successfully",
    });
}

