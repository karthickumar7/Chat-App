import express from "express"
import { protectRoute } from "../middleware/auth.middle.js";
import { getMessages, getUsersForSideBar, sendMessage, deleteMessage, markMessagesAsRead, addReaction, clearChat } from "../controllers/message.controller.js";
const router=express.Router();

router.get("/users",protectRoute,getUsersForSideBar)
router.get("/:id",protectRoute,getMessages)
router.post("/send/:id",protectRoute,sendMessage)
router.delete("/:id",protectRoute,deleteMessage)
router.put("/read/:id",protectRoute,markMessagesAsRead)
router.post("/react/:id",protectRoute,addReaction)
router.delete("/clear/:id",protectRoute,clearChat)
export default router