import mongoose from "mongoose";
import { randomUUID } from "crypto";

const chatroomSchema = new mongoose.Schema({
    id: {
        type: String,
        default: randomUUID(),
    },
    name: {
        type: String,
        required: true,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
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


export default mongoose.model("Chatroom", chatroomSchema);