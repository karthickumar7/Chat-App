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

import fs from "fs"

const distPath = path.join(__dirname, "../../frontend/dist");

// Serve Frontend in Production if build files exist
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    
    app.get("/:any*", (req, res) => {
        res.sendFile(path.resolve(distPath, "index.html"));
    });
} else {
    // 404 Handler
    app.use((req, res) => res.status(404).json({ msg: "Route not found" }));
}

const startServer = async () => {
    try {
        await connectDB();
        server.listen(PORT, () => {
            console.log(`App is Running on PORT ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
    }
};

startServer();