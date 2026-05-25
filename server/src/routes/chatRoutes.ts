import express from "express";
import { protect } from "../middleware/authMiddleware";
import { accessChat, fetchChats, deleteChat } from "../controllers/chatController";

const router = express.Router();

router.route("/").post(protect, accessChat);
router.route("/").get(protect, fetchChats);
router.route("/:chatId").delete(protect, deleteChat);

export default router;
