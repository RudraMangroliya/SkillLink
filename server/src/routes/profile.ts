import express from "express";
import { getMyProfile, updateProfile, uploadResume, uploadProfileImage, uploadBackgroundImage, getAllProfiles, searchProfiles, endorseSkill, addRecommendation, generateRecommendationDraft, getProfileByUserId, followUser, unfollowUser, getSuggestedProfiles, getMutualConnections } from "../controllers/profileController";
import { protect } from "../middleware/authMiddleware";
import { upload, uploadRaw } from "../config/cloudinary";

const router = express.Router();

router.route("/")
  .get(protect, getMyProfile)
  .post(protect, updateProfile);

router.get("/user/:userId", protect, getProfileByUserId);
router.get("/all", protect, getAllProfiles);

router.get("/search", protect, searchProfiles);
router.get("/suggested", protect, getSuggestedProfiles);
router.get("/mutual/:userId", protect, getMutualConnections);

router.post("/follow/:userId", protect, followUser);
router.post("/unfollow/:userId", protect, unfollowUser);

router.post("/endorse/:userId", protect, endorseSkill);
router.post("/recommend/:userId", protect, addRecommendation);
router.get("/generate-draft/:userId", protect, generateRecommendationDraft);

router.post("/upload-resume", protect, uploadRaw.single("resume"), uploadResume);
router.post("/upload-image", protect, upload.single("image"), uploadProfileImage);
router.post("/upload-background", protect, upload.single("backgroundImage"), uploadBackgroundImage);

export default router;
