import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export const signup = async (req, res) => {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) {
        return res.status(400).json({ msg: "All fields Required", success: false })
    }
    try {
        if (password.length < 6) {
            return res.status(400).json({ msg: "Password must be at least 6 characters", success: false })
        }
        const exists = await User.findOne({ email });
        if (exists) {
            return res.status(400).json({ msg: "User already exists", success: false });
        }
        const hashedPass = await bcrypt.hash(password, 10);
        const user = await User.create({
            fullName,
            email,
            password: hashedPass
        });
        generateToken(user._id, res);
        res.status(201).json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            profilePic: user.profilePic,
            nickName: user.nickName,
            status: user.status,
            success: true,
        });
    } catch (err) {
        return res.status(500).json({ msg: `SignUp Error : ${err.message}`, success: false })
    }
}

export const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ msg: "All fields required", success: false });
    }
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ msg: "Invalid Credentials", success: false })
        }
        const compare = await bcrypt.compare(password, user.password)
        if (!compare) {
            return res.status(401).json({ msg: "Invalid Credentials", success: false })
        }
        generateToken(user._id, res);
        res.status(200).json({
            user: {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                profilePic: user.profilePic,
                nickName: user.nickName,
                status: user.status,
            },
            success: true,
        });
    } catch (err) {
        return res.status(500).json({ msg: `Login Error : ${err.message}`, success: false })
    }
}

export const logout = async (req, res) => {
    try {
        res.cookie("jwt", "", { maxAge: 0 });
        res.status(200).json({ msg: "Logged Out successfully ", success: true })
    } catch (error) {
        return res.status(500).json({ msg: `Logout Error :${error.message}`, success: false })
    }
}

export const updateProfile = async (req, res) => {
    try {
        const { profilePic, fullName, nickName, status } = req.body;
        const userId = req.user._id;

        const updateFields = {};
        if (profilePic) {
            const uploadResponse = await cloudinary.uploader.upload(profilePic);
            updateFields.profilePic = uploadResponse.secure_url;
        }
        if (fullName) {
            if (fullName.trim().length < 2) {
                return res.status(400).json({ msg: "Full Name must be at least 2 characters", success: false });
            }
            updateFields.fullName = fullName.trim();
        }
        if (nickName !== undefined) {
            updateFields.nickName = nickName.trim();
        }
        if (status !== undefined) {
            updateFields.status = status.trim();
        }

        const updateduser = await User.findByIdAndUpdate(userId, updateFields, { new: true }).select("-password");
        res.status(200).json({ ...updateduser.toObject(), success: true })
    } catch (err) {
        return res.status(500).json({ msg: `Updateprofile Error :${err.message}`, success: false })
    }
}

export const getUser = async (req, res) => {
    try {
        res.status(200).json({ ...req.user.toObject(), success: true });
    } catch (err) {
        return res.status(500).json({ msg: `getUserError : ${err.message}`, success: false })
    }
}

export const forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ msg: "Email is required", success: false });
    }
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ msg: "User not found with this email", success: false });
        }

        const resetToken = crypto.randomBytes(20).toString("hex");

        user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        await user.save();

        const devResetUrl = `http://localhost:5173/reset-password/${resetToken}`;
        console.log("\n================ PASSWORD RESET LINK ================");
        console.log(devResetUrl);
        console.log("=====================================================\n");

        res.status(200).json({
            msg: "Password reset link logged to server console (development mode)",
            success: true
        });
    } catch (err) {
        return res.status(500).json({ msg: `Forgot Password Error: ${err.message}`, success: false });
    }
};

export const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
        return res.status(400).json({ msg: "Password must be at least 6 characters", success: false });
    }

    try {
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ msg: "Invalid or expired reset token", success: false });
        }

        user.password = await bcrypt.hash(password, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.status(200).json({ msg: "Password reset successfully", success: true });
    } catch (err) {
        return res.status(500).json({ msg: `Reset Password Error: ${err.message}`, success: false });
    }
};

export const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ msg: "All fields are required", success: false });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ msg: "New password must be at least 6 characters", success: false });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: "User not found", success: false });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: "Incorrect current password", success: false });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.status(200).json({ msg: "Password updated successfully", success: true });
    } catch (err) {
        return res.status(500).json({ msg: `Change Password Error: ${err.message}`, success: false });
    }
};
