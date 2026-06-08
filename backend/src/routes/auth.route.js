import express from "express"
import { login, logout, signup, getUser, forgotPassword, resetPassword, changePassword } from "../controllers/auth.controller.js"
import { protectRoute } from "../middleware/auth.middle.js";
 
const router=express.Router();

router.post("/signup", signup)
router.post("/login",login)
router.post("/logout",logout)
router.get("/check",protectRoute,getUser);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.post("/change-password", protectRoute, changePassword);

export default router