import express from "express";
import { protect } from "../middleware/authMiddleware";
import { getDashboardAnalytics, deleteUser } from "../controllers/adminController";

const router = express.Router();

router.get("/analytics", protect, getDashboardAnalytics);
router.delete("/users/:id", protect, deleteUser);

export default router;
