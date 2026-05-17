import express from "express";
import { protect } from "../middleware/authMiddleware";
import { 
  createGroup, 
  getAllGroups, 
  getGroupById, 
  joinGroup, 
  leaveGroup,
  createDiscussion,
  getDiscussions,
  addComment,
  updateGroup,
  deleteGroup,
  removeMember,
  addMember,
  getGroupMessages,
  markGroupMessagesRead,
  sendGroupMessage,
  deleteGroupMessage,
  editGroupMessage,
  reactToGroupMessage,
  searchGroupMessages,
  deleteDiscussion
} from "../controllers/groupController";

const router = express.Router();

router.post("/", protect, createGroup);
router.get("/", protect, getAllGroups);
router.get("/:id", protect, getGroupById);
router.put("/:id", protect, updateGroup);
router.delete("/:id", protect, deleteGroup);

router.post("/:id/join", protect, joinGroup);
router.post("/:id/leave", protect, leaveGroup);

router.get("/:id/discussions", protect, getDiscussions);
router.post("/:id/discussions", protect, createDiscussion);
router.delete("/discussions/:discussionId", protect, deleteDiscussion);
router.post("/discussions/:discussionId/comments", protect, addComment);

router.post("/:id/members", protect, addMember);
router.delete("/:id/members/:userId", protect, removeMember);

router.get("/:id/messages", protect, getGroupMessages);
router.put("/:id/read-messages", protect, markGroupMessagesRead);
router.post("/:id/messages", protect, sendGroupMessage);
router.delete("/:id/messages/:messageId", protect, deleteGroupMessage);
router.put("/:id/messages/:messageId", protect, editGroupMessage);
router.post("/:id/messages/:messageId/react", protect, reactToGroupMessage);
router.get("/:id/messages/search", protect, searchGroupMessages);

export default router;
