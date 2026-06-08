import cloudinary from "../lib/cloudinary.js";
import Story from "../models/story.model.js";

export const createStory = async (req, res) => {
    try {
        const { media } = req.body;
        if (!media) {
            return res.status(400).json({ msg: "Story media (image) is required", success: false });
        }
        
        // Upload story base64 to Cloudinary
        const uploadResponse = await cloudinary.uploader.upload(media);
        
        const newStory = new Story({
            userId: req.user._id,
            mediaUrl: uploadResponse.secure_url
        });
        
        await newStory.save();
        
        // Populate user details for immediate response use
        const populatedStory = await newStory.populate("userId", "fullName nickName profilePic");
        
        return res.status(201).json({ story: populatedStory, success: true });
    } catch (err) {
        console.error("Error in createStory: ", err.message);
        return res.status(500).json({ msg: `createStoryError: ${err.message}`, success: false });
    }
};

export const getStories = async (req, res) => {
    try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        // Find stories created in the last 24 hours, populating user details
        const stories = await Story.find({
            createdAt: { $gte: twentyFourHoursAgo }
        })
        .populate("userId", "fullName nickName profilePic")
        .sort({ createdAt: -1 });
        
        return res.status(200).json({ stories, success: true });
    } catch (err) {
        console.error("Error in getStories: ", err.message);
        return res.status(500).json({ msg: `getStoriesError: ${err.message}`, success: false });
    }
};
