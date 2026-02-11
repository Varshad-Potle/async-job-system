import { Router } from "express";
import { createJob, getJobStatus, retryJob, getDeadJobs } from "../controllers/job.controller";

const router = Router();

// POST /api/v1/jobs
router.post("/", createJob);

// GET /api/v1/jobs/dead
router.get("/dead", getDeadJobs);

// POST /api/v1/jobs/:id/retry
router.post("/:id/retry", retryJob);

// GET /api/v1/jobs/:id
router.get("/:id", getJobStatus);

export default router;