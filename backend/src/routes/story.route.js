import express from "express";
import { protectRoute } from "../middleware/auth.middle.js";
import { createStory, getStories } from "../controllers/story.controller.js";

const router = express.Router();

router.post("/create", protectRoute, createStory);
router.get("/all", protectRoute, getStories);

export default router;
