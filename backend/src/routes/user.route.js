import express from "express";
import { protectRoute } from "../middleware/auth.middle.js";
import { updateProfile } from "../controllers/auth.controller.js";
const router=express.Router();

router.put("/update-profile",protectRoute,updateProfile)
export default router