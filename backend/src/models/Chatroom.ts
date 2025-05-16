import mongoose from "mongoose";

const chatroomSchema = new mongoose.Schema({
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