import express from "express";
import { protect } from "../middleware/authMiddleware";
import { getJobRecommendations, getSmartReply, getGroupRecommendations } from "../controllers/recommendationController";

const router = express.Router();

router.get("/jobs", protect, getJobRecommendations);
router.get("/groups", protect, getGroupRecommendations);
router.post("/smart-reply", protect, getSmartReply);

export default router;
