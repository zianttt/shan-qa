import { NextFunction, Request, Response } from "express";
import User from "../models/User.js";
import Chatroom from "../models/Chatroom.js";
import Message from "../models/Message.js";
import { generateChatCompletion, multimodalCompletion } from "../utils/llm-api.js";
import { formatDescriptions } from "../utils/formats.js";
import { CompletionMessageDto } from "../utils/types.js";
import { canUserAccessFile, deleteS3Objects, generateSignedUrl, generateSignedUrls, getChatroomAttachmentKeys, uploadToS3 } from "../utils/image-uploads.js";

export const sendMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findById(res.locals.jwtData.id);
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }
    
    const userId = user._id.toString();
    const { chatroomId, model } = req.body as { chatroomId: string, model: string };
    
    // Parse the JSON string back to object
    let messages: CompletionMessageDto[];
    try {
      messages = JSON.parse(req.body.messages);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Invalid messages format",
      });
      return;
    }

    const uploadedFiles = req.files as Express.Multer.File[];

    const latestMessage: CompletionMessageDto = messages[messages.length - 1];
    console.log("Latest message content:", latestMessage);

    if (!latestMessage || !latestMessage.content) {
      res.status(400).json({
        success: false,
        message: "No content in latest message",
      });
      return;
    }

    // Upload attachments to S3 (now returns S3 keys instead of public URLs)
    let uploadedAttachmentKeys: string[] = [];
    if (uploadedFiles && uploadedFiles.length > 0) {
      try {
        uploadedAttachmentKeys = await uploadToS3(uploadedFiles, userId);
      } catch (uploadError) {
        console.error("Failed to upload attachments to S3:", uploadError);
        res.status(500).json({
          success: false,
          message: "Failed to upload attachments",
        });
        return;
      }
    }

    // Store S3 keys in the database instead of URLs
    const userAttachments = uploadedAttachmentKeys.map((s3Key, index) => ({
        s3Key, // Store S3 key instead of URL
        description: latestMessage.attachments[index]?.description || "",
        fileName: uploadedFiles[index]?.originalname || "",
        contentType: uploadedFiles[index]?.mimetype || "",
    }));

    const userMessage = await Message.create({
      attachments: userAttachments,
      chatroom_id: chatroomId,
      content: latestMessage.content,
      sender: "user",
      user_id: userId, // Add user_id to track message ownership
    });

    const formattedMessages = messages.map((msg) => ({
        role: msg.role,
        content: msg.attachments.length > 0 ? `${msg.content}\n\n${formatDescriptions(
            msg.attachments.map((attachment) => attachment.description).filter(Boolean)
        )}` : msg.content
    }));

    const completeResponse = await generateChatCompletion(formattedMessages, model);
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

    // Generate signed URLs for response (valid for 1 hour)
    let signedAttachmentUrls: string[] = [];
    if (uploadedAttachmentKeys.length > 0) {
      try {
        signedAttachmentUrls = await generateSignedUrls(uploadedAttachmentKeys, 3600);
      } catch (signedUrlError) {
        console.error("Failed to generate signed URLs:", signedUrlError);
        // Continue without signed URLs - client can request them separately
      }
    }

    res.status(200).json({
      success: true,
      message: "Message sent successfully",
      userMessage: userMessage.content,
      assistantMessage: assistantMessage.content,
      attachments: signedAttachmentUrls, // Return signed URLs instead of S3 keys
      attachmentKeys: uploadedAttachmentKeys, // Optionally return keys for client reference
    });

  } catch (error) {
    console.error("Error in sendMessage:", error);
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to process message",
    });
  }
};

// Add this endpoint to handle signed URL requests
export const getSignedAttachmentUrl = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findById(res.locals.jwtData.id);
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    const userId = user._id.toString();
    const { s3Key } = req.params;
    const { expiresIn = 3600 } = req.query; // Default 1 hour expiration

    // Check if user has access to this file
    const hasAccess = await canUserAccessFile(userId, s3Key);
    if (!hasAccess) {
      res.status(403).json({
        success: false,
        message: "Access denied to this file",
      });
      return;
    }

    try {
      const signedUrl = await generateSignedUrl(s3Key, Number(expiresIn));
      
      res.status(200).json({
        success: true,
        signedUrl,
        expiresIn: Number(expiresIn),
        expiresAt: new Date(Date.now() + Number(expiresIn) * 1000).toISOString(),
      });
    } catch (signedUrlError) {
      console.error("Failed to generate signed URL:", signedUrlError);
      res.status(500).json({
        success: false,
        message: "Failed to generate signed URL",
      });
    }

  } catch (error) {
    console.error("Error in getSignedAttachmentUrl:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to get signed URL",
    });
  }
};

// Endpoint to get multiple signed URLs at once
export const getSignedAttachmentUrls = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findById(res.locals.jwtData.id);
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    const userId = user._id.toString();
    const { s3Keys } = req.body as { s3Keys: string[] };
    const { expiresIn = 3600 } = req.query; // Default 1 hour expiration

    if (!Array.isArray(s3Keys) || s3Keys.length === 0) {
      res.status(400).json({
        success: false,
        message: "s3Keys must be a non-empty array",
      });
      return;
    }

    // Check access for all files
    const accessChecks = await Promise.all(
      s3Keys.map(s3Key => canUserAccessFile(userId, s3Key))
    );

    const accessibleKeys = s3Keys.filter((_, index) => accessChecks[index]);
    const deniedKeys = s3Keys.filter((_, index) => !accessChecks[index]);

    if (accessibleKeys.length === 0) {
      res.status(403).json({
        success: false,
        message: "Access denied to all requested files",
        deniedKeys,
      });
      return;
    }

    try {
      const signedUrls = await generateSignedUrls(accessibleKeys, Number(expiresIn));
      
      // Create a mapping of S3 keys to signed URLs
      const urlMapping = accessibleKeys.reduce((acc, key, index) => {
        acc[key] = signedUrls[index];
        return acc;
      }, {} as Record<string, string>);

      res.status(200).json({
        success: true,
        signedUrls: urlMapping,
        accessibleKeys,
        deniedKeys,
        expiresIn: Number(expiresIn),
        expiresAt: new Date(Date.now() + Number(expiresIn) * 1000).toISOString(),
      });
    } catch (signedUrlError) {
      console.error("Failed to generate signed URLs:", signedUrlError);
      res.status(500).json({
        success: false,
        message: "Failed to generate signed URLs",
      });
    }

  } catch (error) {
    console.error("Error in getSignedAttachmentUrls:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to get signed URLs",
    });
  }
};

export const imageToText = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
        if (!req.file) {
            console.error("No image file found in request");
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
        return;

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
    try {
        const { chatroomId } = req.params;
        const { deleteAttachments = true, force = false } = req.body;
        
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

        let deletedAttachments = 0;
        let attachmentErrors: string[] = [];

        // Delete S3 attachments if requested
        if (deleteAttachments) {
            try {
                const s3Keys = await getChatroomAttachmentKeys(chatroomId);
                
                if (s3Keys.length > 0) {
                    console.log(`Found ${s3Keys.length} attachments to delete for chatroom ${chatroomId}`);
                    
                    await deleteS3Objects(s3Keys);
                    deletedAttachments = s3Keys.length;
                    
                    console.log(`Successfully deleted ${deletedAttachments} attachments from S3`);
                }
            } catch (attachmentError) {
                console.error('Error deleting chatroom attachments:', attachmentError);
                attachmentErrors.push(
                    attachmentError instanceof Error ? attachmentError.message : 'Unknown attachment deletion error'
                );
                // Continue with chatroom deletion even if attachment deletion fails
            }
        }

        // Delete all messages in the chatroom
        const messageDeleteResult = await Message.deleteMany({ chatroom_id: chatroomId });
        console.log(`Deleted ${messageDeleteResult.deletedCount} messages from chatroom ${chatroomId}`);

        // Delete the chatroom
        await chatroom.deleteOne();
        
        const response: any = {
            success: true,
            message: "Chatroom deleted successfully",
            details: {
                messagesDeleted: messageDeleteResult.deletedCount,
                attachmentsDeleted: deletedAttachments,
            }
        };

        // Include attachment errors in response if any occurred
        if (attachmentErrors.length > 0) {
            response.warnings = {
                attachmentDeletionErrors: attachmentErrors,
                message: "Chatroom and messages were deleted, but some attachments may not have been removed from storage"
            };
        }

        res.status(200).json(response);
        
    } catch (error) {
        console.error("Error in deleteChatroom:", error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Failed to delete chatroom",
        });
    }
};

export const deleteChatroomForce = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { chatroomId } = req.params;
        const { 
            deleteAttachments = true, 
            force = false // Force delete even if attachment deletion fails
        } = req.body;
        
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

        let deletedAttachments = 0;
        let attachmentErrors: string[] = [];

        // Delete S3 attachments if requested
        if (deleteAttachments) {
            try {
                const s3Keys = await getChatroomAttachmentKeys(chatroomId);
                
                if (s3Keys.length > 0) {
                    await deleteS3Objects(s3Keys);
                    deletedAttachments = s3Keys.length;
                }
            } catch (attachmentError) {
                const errorMessage = attachmentError instanceof Error ? attachmentError.message : 'Unknown attachment deletion error';
                attachmentErrors.push(errorMessage);
                
                if (!force) {
                    // If not forcing deletion and attachment deletion fails, return error
                    res.status(500).json({
                        success: false,
                        message: "Failed to delete attachments. Use force=true to delete chatroom anyway.",
                        error: errorMessage
                    });
                    return;
                }
            }
        }

        // Delete all messages in the chatroom
        const messageDeleteResult = await Message.deleteMany({ chatroom_id: chatroomId });

        // Delete the chatroom
        await chatroom.deleteOne();
        
        const response: any = {
            success: true,
            message: "Chatroom deleted successfully",
            details: {
                messagesDeleted: messageDeleteResult.deletedCount,
                attachmentsDeleted: deletedAttachments,
                forceDeleted: force && attachmentErrors.length > 0
            }
        };

        if (attachmentErrors.length > 0) {
            response.warnings = {
                attachmentDeletionErrors: attachmentErrors,
                message: "Some attachments may not have been removed from storage"
            };
        }

        res.status(200).json(response);
        
    } catch (error) {
        console.error("Error in deleteChatroomForce:", error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Failed to delete chatroom",
        });
    }
};

export const editChatroom = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { chatroomId } = req.params;
    const { name } = req.body;

    try {
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

        chatroom.name = name || chatroom.name;
        await chatroom.save();

        res.status(200).json({
            success: true,
            message: "Chatroom updated successfully",
            chatroom,
        });
    } catch (error) {
        console.error("Error in editChatroom:", error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Failed to update chatroom",
        });
    }
}
