import dotenv from "dotenv"
dotenv.config()
import express from "express"
import { app, server } from "./lib/socket.js"
import authRoutes from "./routes/auth.route.js"
import morgan from "morgan"
import { connectDB } from "./lib/db.js";
import cookieParser from "cookie-parser";
import cors from "cors"
import userRoutes from "./routes/user.route.js"
import messageRoutes from "./routes/message.route.js"
import storyRoutes from "./routes/story.route.js"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT=process.env.PORT || 5001;
app.use(cors({
    origin: ["http://localhost:5173", process.env.FRONTEND_URL].filter(Boolean),
    credentials: true
}));
app.use(morgan("dev"))
app.use(express.json());
app.use(cookieParser());

// Health Check
app.get("/api/health", (req, res) => res.status(200).json({ status: "ok" }));

app.use("/api/auth",authRoutes)
app.use("/api/user",userRoutes)
app.use("/api/messages",messageRoutes)
app.use("/api/stories",storyRoutes)

import fs from "fs"

const distPath = path.join(__dirname, "../../frontend/dist");

// Serve Frontend in Production if build files exist
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    
    app.get("/*splat", (req, res) => {
        res.sendFile(path.resolve(distPath, "index.html"));
    });
} else {
    // 404 Handler
    app.use((req, res) => res.status(404).json({ msg: "Route not found" }));
}

import Message from "./models/message.model.js"

const startServer = async () => {
    try {
        await connectDB();
        // Clean up expired self-destructing messages
        try {
            await Message.deleteMany({ expiresAt: { $lt: new Date() } });
            console.log("Expired disappearing messages cleaned up.");
        } catch (dbErr) {
            console.error("Failed to clean up expired messages:", dbErr);
        }
        server.listen(PORT, () => {
            console.log(`App is Running on PORT ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
    }
};

startServer();