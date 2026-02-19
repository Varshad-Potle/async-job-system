import { Router } from "express";
import { createJob, getJobStatus, retryJob, getDeadJobs, getJobStats, getAllJobs } from "../controllers/job.controller";

const router = Router();

// --- Dashboard Endpoints ---

// GET /api/v1/jobs/stats (Gets counts for the top cards)
router.get("/stats", getJobStats);

// GET /api/v1/jobs (Gets the list for the table)
router.get("/", getAllJobs);

// POST /api/v1/jobs
router.post("/", createJob);

// GET /api/v1/jobs/dead
router.get("/dead", getDeadJobs);

// POST /api/v1/jobs/:id/retry
router.post("/:id/retry", retryJob);

// GET /api/v1/jobs/:id
router.get("/:id", getJobStatus);

export default router;