import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    chatroom_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Chatroom",
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    attachments: {
        type: [
            {
                s3Key: { type: String, required: true },
                description: { type: String, default: "" },
                fileName: { type: String, required: true },
                contentType: { type: String, required: true }
            }
        ],
        default: [],
    },
    sender: {
        type: String,
        enum: ["user", "assistant"],
        required: true,
    },
    created_at: {
        type: Date,
        default: Date.now,
    }, 
    updated_at: {
        type: Date,
        default: Date.now,
    }
});

export default mongoose.model("Message", messageSchema);