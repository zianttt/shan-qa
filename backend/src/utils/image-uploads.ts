import multer from 'multer';
import { DeleteObjectCommand, DeleteObjectsCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createS3Client, getS3BucketName } from "../db/aws-connection.js";
import path from 'path';
import { v4 as uuidv4 } from "uuid";
import Message from '../models/Message.js';
import Chatroom from '../models/Chatroom.js';

export const upload = multer({ 
  storage: multer.memoryStorage(), // Store files in memory
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

export const uploadToS3 = async (files: Express.Multer.File[], userId: string): Promise<string[]> => {
  if (!files || files.length === 0) {
    return [];
  }

  try {
    const uploadPromises = files.map(async (file): Promise<string> => {
      // Generate unique filename with user ID for better organization
      const fileExtension = path.extname(file.originalname);
      const uniqueFileName = `${uuidv4()}${fileExtension}`;
      const s3Key = `attachments/${userId}/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${uniqueFileName}`;

      const bucketName = getS3BucketName();
      if (!bucketName) {
        throw new Error("Bucket name is not defined in environment variables");
      }

      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
        Body: file.buffer, // Multer files have buffer property
        ContentType: file.mimetype,
        ContentDisposition: `attachment; filename="${file.originalname}"`,
        ServerSideEncryption: 'AES256',
        Metadata: {
          originalName: file.originalname,
          uploadedAt: new Date().toISOString(),
          size: file.size.toString(),
          uploadedBy: userId, // Track who uploaded the file
        },
        // Remove ACL: 'public-read' to make files private
      });

      const s3Client = createS3Client();
      await s3Client.send(command);
      
      // Return the S3 key instead of public URL
      return s3Key;
    });

    const uploadedKeys = await Promise.all(uploadPromises);
    return uploadedKeys;
    
  } catch (error) {
    // console.error('Error uploading files to S3:', error);
    throw new Error(`Failed to upload files to S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// New function to generate signed URLs
export const generateSignedUrl = async (s3Key: string, expiresIn: number = 3600): Promise<string> => {
  try {
    const bucketName = getS3BucketName();
    if (!bucketName) {
      throw new Error("Bucket name is not defined in environment variables");
    }

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
    });

    const s3Client = createS3Client();
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    
    return signedUrl;
  } catch (error) {
    // console.error('Error generating signed URL:', error);
    throw new Error(`Failed to generate signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// New function to generate multiple signed URLs
export const generateSignedUrls = async (s3Keys: string[], expiresIn: number = 3600): Promise<string[]> => {
  try {
    const signedUrlPromises = s3Keys.map(key => generateSignedUrl(key, expiresIn));
    return await Promise.all(signedUrlPromises);
  } catch (error) {
    // console.error('Error generating signed URLs:', error);
    throw new Error(`Failed to generate signed URLs: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Helper function to check if user can access file
export const canUserAccessFile = async (userId: string, s3Key: string): Promise<boolean> => {
  try {
    // Check if the file path includes the user's ID
    if (s3Key.includes(`attachments/${userId}/`)) {
      return true;
    }

    // Additional check: verify from database if needed
    // You might want to check your Message model to see if the user has access to this attachment
    const message = await Message.findOne({
      'attachments.s3Key': s3Key,
      $or: [
        { sender: 'user', user_id: userId }, // User's own message
        { 
          chatroom_id: { 
            $in: await getChatroomIdsForUser(userId) // User is part of the chatroom
          } 
        }
      ]
    });

    return !!message;
  } catch (error) {
    // console.error('Error checking file access:', error);
    return false;
  }
};

// Helper function to get chatroom IDs for a user (implement based on your chatroom model)
export const getChatroomIdsForUser = async (userId: string): Promise<string[]> => {
  // Implement this based on your chatroom/user relationship model
  // This is a placeholder - adjust according to your data structure
  try {
    const chatrooms = await Chatroom.find({
      participants: userId
    }).select('_id');
    
    return chatrooms.map(room => room._id.toString());
  } catch (error) {
    // console.error('Error getting chatroom IDs:', error);
    return [];
  }
};


// Delete functions
export const deleteS3Object = async (s3Key: string): Promise<void> => {
  try {
    const bucketName = getS3BucketName();
    if (!bucketName) {
      throw new Error("Bucket name is not defined in environment variables");
    }

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
    });

    const s3Client = createS3Client();
    await s3Client.send(command);
    
    // console.log(`Successfully deleted S3 object: ${s3Key}`);
  } catch (error) {
    // console.error(`Error deleting S3 object ${s3Key}:`, error);
    throw new Error(`Failed to delete S3 object: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Helper function to delete multiple S3 objects (more efficient for bulk operations)
export const deleteS3Objects = async (s3Keys: string[]): Promise<void> => {
  if (!s3Keys || s3Keys.length === 0) {
    return;
  }

  try {
    const bucketName = getS3BucketName();
    if (!bucketName) {
      throw new Error("Bucket name is not defined in environment variables");
    }

    // AWS S3 allows deleting up to 1000 objects at once
    const chunkSize = 1000;
    const chunks = [];
    
    for (let i = 0; i < s3Keys.length; i += chunkSize) {
      chunks.push(s3Keys.slice(i, i + chunkSize));
    }

    const s3Client = createS3Client();

    for (const chunk of chunks) {
      const deleteParams = {
        Bucket: bucketName,
        Delete: {
          Objects: chunk.map(key => ({ Key: key })),
          Quiet: false, // Set to true if you don't want detailed response
        },
      };

      const command = new DeleteObjectsCommand(deleteParams);
      const result = await s3Client.send(command);
      
      // console.log(`Successfully deleted ${chunk.length} S3 objects`);
      
      // Log any errors that occurred during deletion
      if (result.Errors && result.Errors.length > 0) {
        // console.error('Some objects failed to delete:', result.Errors);
      }
    }
  } catch (error) {
    // console.error('Error deleting S3 objects:', error);
    throw new Error(`Failed to delete S3 objects: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Helper function to get all attachment S3 keys from a chatroom
export const getChatroomAttachmentKeys = async (chatroomId: string): Promise<string[]> => {
  try {
    const messages = await Message.find({ 
      chatroom_id: chatroomId,
      'attachments.0': { $exists: true } // Only get messages that have attachments
    }).select('attachments.s3Key');

    const s3Keys: string[] = [];
    
    messages.forEach(message => {
      message.attachments.forEach(attachment => {
        if (attachment.s3Key) {
          s3Keys.push(attachment.s3Key);
        }
      });
    });

    return s3Keys;
  } catch (error) {
    // console.error('Error getting chatroom attachment keys:', error);
    throw new Error(`Failed to get attachment keys: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};