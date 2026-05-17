import { sendConnectionRequest, acceptConnection, getMyConnections, getConnectionStatuses, rejectConnection, getPendingRequests, removeConnection } from "../controllers/connectionController";
import { protect } from "../middleware/authMiddleware";
import express from "express";

const router = express.Router();

router.post("/request", protect, sendConnectionRequest);
router.post("/accept/:id", protect, acceptConnection);
router.post("/reject/:id", protect, rejectConnection);
router.delete("/remove/:userId", protect, removeConnection);
router.get("/pending", protect, getPendingRequests);
router.get("/", protect, getMyConnections);
router.get("/status", protect, getConnectionStatuses);

export default router;
