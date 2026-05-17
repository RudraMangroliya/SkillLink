import express from "express";
import { 
  createJob, getJobs, applyForJob, editJob, deleteJob, toggleSaveJob, getSavedJobs, 
  updateApplicationStatus, getRecruiterJobs, getCandidateApplications, getDashboardStats 
} from "../controllers/jobController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/dashboard/stats", protect, getDashboardStats);
router.get("/dashboard/recruiter", protect, getRecruiterJobs);
router.get("/dashboard/candidate", protect, getCandidateApplications);
router.get("/saved", protect, getSavedJobs);

router.route("/")
  .get(getJobs)
  .post(protect, createJob);

router.route("/:id")
  .put(protect, editJob)
  .delete(protect, deleteJob);

router.post("/:id/apply", protect, applyForJob);
router.post("/:id/save", protect, toggleSaveJob);
router.put("/:jobId/applications/:applicationId", protect, updateApplicationStatus);

export default router;
