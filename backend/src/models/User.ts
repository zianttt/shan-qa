import mongoose from "mongoose";

const userShcema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    pwd_hash: {
        type: String,
        required: true,
    }    
});

export default mongoose.model("User", userShcema);