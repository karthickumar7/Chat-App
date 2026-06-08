import cloudinary from "../lib/cloudinary.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSideBar = async (req, res) => {
    try {
        const userId = req.user._id;
        const filteredUsers = await User.find({ _id: { $ne: userId } }).select("-password");
        res.status(200).json({ users: filteredUsers, success: true })
    } catch (err) {
        console.error("Error in getUsersForSideBar: ", err.message);
        return res.status(500).json({ msg: `getUsersError:${err.message}`, success: false })
    }
}

export const getMessages = async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const myId = req.user._id;
        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId }
            ]
        })
        return res.status(200).json({ messages: messages, success: true })
    } catch (err) {
        console.error("Error in getMessages: ", err.message);
        return res.status(500).json({ msg: `getMessageError:${err.message}`, success: false })
    }
}

export const sendMessage = async (req, res) => {
    try {
        const { text, image, file, fileName, audio } = req.body;
        if (!text && !image && !file && !audio) {
            return res.status(400).json({
                msg: "Message content is required",
                success: false
            })
        }
        const { id: receiverId } = req.params;
        const senderId = req.user._id;
        let imageurl;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageurl = uploadResponse.secure_url;
        }
        let fileurl;
        if (file) {
            const uploadResponse = await cloudinary.uploader.upload(file, {
                resource_type: "auto"
            });
            fileurl = uploadResponse.secure_url;
        }
        let audiourl;
        if (audio) {
            const uploadResponse = await cloudinary.uploader.upload(audio, {
                resource_type: "video"
            });
            audiourl = uploadResponse.secure_url;
        }
        const newMesage = new Message({
            senderId,
            receiverId,
            text,
            image: imageurl,
            file: fileurl,
            fileName,
            audio: audiourl
        })
        await newMesage.save();

        // Real-time notification using socket.io
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMesage);
        }

        return res.status(201).json({ message: newMesage, success: true })
    } catch (err) {
        console.error("Error in sendMessage: ", err.message);
        return res.status(500).json({ msg: `sendMessageError:${err.message}`, success: false })
    }
}

export const deleteMessage = async (req, res) => {
    try {
        const { id: messageId } = req.params;
        const userId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ msg: "Message not found", success: false });
        }

        // Verify ownership (only sender can delete)
        if (message.senderId.toString() !== userId.toString()) {
            return res.status(403).json({ msg: "Unauthorized to delete this message", success: false });
        }

        await Message.findByIdAndDelete(messageId);

        // Notify the receiver in real-time via socket
        const receiverSocketId = getReceiverSocketId(message.receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("messageDeleted", messageId);
        }

        return res.status(200).json({ msg: "Message deleted successfully", success: true });
    } catch (err) {
        console.error("Error in deleteMessage: ", err.message);
        return res.status(500).json({ msg: `deleteMessageError:${err.message}`, success: false });
    }
};