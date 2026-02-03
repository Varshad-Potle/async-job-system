import { Router } from "express";
import { createJob, getJobStatus } from "../controllers/job.controller";

const router = Router();

// POST /api/v1/jobs
router.post("/", createJob);

// GET /api/v1/jobs/:id
router.get("/:id", getJobStatus);

export default router;