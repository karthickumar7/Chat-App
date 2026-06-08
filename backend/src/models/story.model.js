import mongoose from "mongoose";

const storySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    mediaUrl: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 86400 // Automatically deletes the document 24 hours after creation
    }
}, { timestamps: true });

const Story = mongoose.model("Story", storySchema);
export default Story;
