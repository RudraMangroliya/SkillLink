import express from "express";
import { protect } from "../middleware/authMiddleware";
import { allMessages, sendMessage, markMessagesAsRead, markMessagesAsDelivered, deleteMessage, editMessage, reactToMessage, uploadAttachment, searchMessages, pinMessage } from "../controllers/messageController";
import { uploadMedia } from "../config/cloudinary";

const router = express.Router();

router.route("/:chatId").get(protect, allMessages);
router.route("/").post(protect, sendMessage);
router.route("/upload").post(protect, uploadMedia.single("file"), uploadAttachment);
router.route("/read").put(protect, markMessagesAsRead);
router.route("/deliver").put(protect, markMessagesAsDelivered);
router.route("/:id").delete(protect, deleteMessage);
router.route("/:id").put(protect, editMessage);
router.route("/:id/react").post(protect, reactToMessage);
router.route("/:id/pin").post(protect, pinMessage);
router.route("/:chatId/search").get(protect, searchMessages);

export default router;
