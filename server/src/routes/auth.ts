import express from "express";
import rateLimit from "express-rate-limit";
import { 
  register, 
  login, 
  googleLogin, 
  logout, 
  refreshToken, 
  forgotPassword, 
  resetPassword,
  deleteAccount
} from "../controllers/authController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: { message: "Too many authentication attempts from this IP, please try again after 15 minutes." }
});

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/google", googleLogin);
router.post("/logout", logout);
router.post("/refresh", refreshToken);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);
router.delete("/delete-account", protect, deleteAccount);

export default router;
