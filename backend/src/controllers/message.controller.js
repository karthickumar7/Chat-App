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
            ],
            $or: [
                { expiresAt: { $exists: false } },
                { expiresAt: null },
                { expiresAt: { $gt: new Date() } }
            ]
        }).populate("replyTo");

        return res.status(200).json({ messages: messages, success: true })
    } catch (err) {
        console.error("Error in getMessages: ", err.message);
        return res.status(500).json({ msg: `getMessageError:${err.message}`, success: false })
    }
}

export const sendMessage = async (req, res) => {
    try {
        const { text, image, file, fileName, audio, replyTo, expiresIn } = req.body;
        if (!text && !image && !file && !audio) {
            return res.status(400).json({
                msg: "Message content is required",
                success: false
            })
        }
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        const sender = await User.findById(senderId);
        const receiver = await User.findById(receiverId);

        if (!sender || !receiver) {
            return res.status(404).json({ msg: "User not found", success: false });
        }

        // Check blocks
        if (receiver.blockedUsers.includes(senderId)) {
            return res.status(403).json({ msg: "You have been blocked by this user", success: false });
        }
        if (sender.blockedUsers.includes(receiverId)) {
            return res.status(403).json({ msg: "You have blocked this user. Unblock them to send messages.", success: false });
        }

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

        let expiresAt = null;
        if (expiresIn) {
            expiresAt = new Date(Date.now() + expiresIn * 1000);
        }

        const newMesage = new Message({
            senderId,
            receiverId,
            text,
            image: imageurl,
            file: fileurl,
            fileName,
            audio: audiourl,
            replyTo,
            expiresAt
        })
        await newMesage.save();
        await newMesage.populate("replyTo");

        // Real-time notification using socket.io
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMesage);
        }

        // Auto-delete scheduling in memory
        if (expiresIn) {
            setTimeout(async () => {
                try {
                    await Message.findByIdAndDelete(newMesage._id);
                    const rSocket = getReceiverSocketId(receiverId);
                    const sSocket = getReceiverSocketId(senderId);
                    if (rSocket) io.to(rSocket).emit("messageDeleted", newMesage._id);
                    if (sSocket) io.to(sSocket).emit("messageDeleted", newMesage._id);
                } catch (e) {
                    console.error("Auto-delete message error:", e);
                }
            }, expiresIn * 1000);
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

export const markMessagesAsRead = async (req, res) => {
    try {
        const { id: senderId } = req.params;
        const myId = req.user._id;

        await Message.updateMany(
            { senderId, receiverId: myId, isRead: false },
            { $set: { isRead: true } }
        );

        // Notify the sender in real-time via socket
        const senderSocketId = getReceiverSocketId(senderId);
        if (senderSocketId) {
            io.to(senderSocketId).emit("messagesRead", { readerId: myId, senderId });
        }

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error("Error in markMessagesAsRead: ", err.message);
        return res.status(500).json({ msg: err.message, success: false });
    }
};

export const addReaction = async (req, res) => {
    try {
        const { id: messageId } = req.params;
        const { emoji } = req.body;
        const myId = req.user._id;

        if (!emoji) {
            return res.status(400).json({ msg: "Emoji is required", success: false });
        }

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ msg: "Message not found", success: false });
        }

        // Check if user already reacted
        const existingReactionIdx = message.reactions.findIndex(
            (r) => r.userId.toString() === myId.toString()
        );

        if (existingReactionIdx > -1) {
            message.reactions[existingReactionIdx].emoji = emoji;
        } else {
            message.reactions.push({ userId: myId, emoji });
        }

        await message.save();

        const receiverSocketId = getReceiverSocketId(message.receiverId);
        const senderSocketId = getReceiverSocketId(message.senderId);

        const payload = { messageId, userId: myId, emoji };
        
        if (receiverSocketId) io.to(receiverSocketId).emit("messageReaction", payload);
        if (senderSocketId) io.to(senderSocketId).emit("messageReaction", payload);

        return res.status(200).json({ message, success: true });
    } catch (err) {
        console.error("Error in addReaction: ", err.message);
        return res.status(500).json({ msg: err.message, success: false });
    }
};

export const clearChat = async (req, res) => {
    try {
        const { id: partnerId } = req.params;
        const myId = req.user._id;

        await Message.deleteMany({
            $or: [
                { senderId: myId, receiverId: partnerId },
                { senderId: partnerId, receiverId: myId }
            ]
        });

        const partnerSocketId = getReceiverSocketId(partnerId);
        if (partnerSocketId) {
            io.to(partnerSocketId).emit("chatCleared", { clearedBy: myId });
        }

        return res.status(200).json({ msg: "Chat cleared successfully", success: true });
    } catch (err) {
        console.error("Error in clearChat: ", err.message);
        return res.status(500).json({ msg: err.message, success: false });
    }
};

export const blockUser = async (req, res) => {
    try {
        const { id: userToBlockId } = req.params;
        const myId = req.user._id;

        if (userToBlockId === myId.toString()) {
            return res.status(400).json({ msg: "You cannot block yourself", success: false });
        }

        const user = await User.findById(myId);
        if (!user.blockedUsers.includes(userToBlockId)) {
            user.blockedUsers.push(userToBlockId);
            await user.save();
        }

        return res.status(200).json({ msg: "User blocked successfully", blockedUsers: user.blockedUsers, success: true });
    } catch (err) {
        console.error("Error in blockUser: ", err.message);
        return res.status(500).json({ msg: err.message, success: false });
    }
};

export const unblockUser = async (req, res) => {
    try {
        const { id: userToUnblockId } = req.params;
        const myId = req.user._id;

        const user = await User.findById(myId);
        user.blockedUsers = user.blockedUsers.filter(id => id.toString() !== userToUnblockId);
        await user.save();

        return res.status(200).json({ msg: "User unblocked successfully", blockedUsers: user.blockedUsers, success: true });
    } catch (err) {
        console.error("Error in unblockUser: ", err.message);
        return res.status(500).json({ msg: err.message, success: false });
    }
};

export const globalSearchUsers = async (req, res) => {
    try {
        const { query } = req.query;
        const myId = req.user._id;

        if (!query) {
            return res.status(200).json({ users: [], success: true });
        }

        const searchedUsers = await User.find({
            _id: { $ne: myId },
            $or: [
                { fullName: { $regex: query, $options: "i" } },
                { email: { $regex: query, $options: "i" } }
            ]
        }).select("-password");

        return res.status(200).json({ users: searchedUsers, success: true });
    } catch (err) {
        console.error("Error in globalSearchUsers: ", err.message);
        return res.status(500).json({ msg: err.message, success: false });
    }
};

export const globalSearchMessages = async (req, res) => {
    try {
        const { query } = req.query;
        const myId = req.user._id;

        if (!query) {
            return res.status(200).json({ messages: [], success: true });
        }

        const messages = await Message.find({
            $or: [
                { senderId: myId },
                { receiverId: myId }
            ],
            text: { $regex: query, $options: "i" }
        }).populate("senderId", "fullName profilePic")
          .populate("receiverId", "fullName profilePic")
          .sort({ createdAt: -1 });

        return res.status(200).json({ messages, success: true });
    } catch (err) {
        console.error("Error in globalSearchMessages: ", err.message);
        return res.status(500).json({ msg: err.message, success: false });
    }
};