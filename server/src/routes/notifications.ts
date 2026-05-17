import express from "express";
import { protect } from "../middleware/authMiddleware";
import { getNotifications, markAsRead, markAllAsRead, clearAllNotifications } from "../controllers/notificationController";

const router = express.Router();

router.get("/", protect, getNotifications);
router.put("/read-all", protect, markAllAsRead);
router.put("/:id/read", protect, markAsRead);
router.delete("/clear", protect, clearAllNotifications);

export default router;
