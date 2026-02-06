import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import pool from "../db";
import { redisClient } from "../db/redis";
import { JobStatus, HttpStatusCode } from "../constants";

export const createJob = asyncHandler(async (req: Request, res: Response) => {
    const { type, data } = req.body;

    // validation
    if (!type || !data) {
        throw new ApiError(HttpStatusCode.BAD_REQUEST, "Job 'type' and 'data' are required")
    }

    try {
        // create a permanent record in db
        const jobPayload = { type, data };

        const insertQuery = `
        INSERT INTO jobs (status, payload)
        VALUES ($1, $2)
        RETURNING id, status, created_at
        `;

        const result = await pool.query(insertQuery, [JobStatus.PENDING, jobPayload]);
        const newJob = result.rows[0];

        if (!newJob) {
            throw new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, "Failed to create job")
        }

        // add job to redis
        await redisClient.lpush("job_queue", newJob.id);

        // respond to user without waiting for the job to finish
        res.status(HttpStatusCode.CREATED).json(
            new ApiResponse(HttpStatusCode.CREATED, { jobId: newJob.id }, "Job submitted successfully!")
        );
    } catch (error) {
        // if redis fails, we might want to delete the DB record (simple rollback)
        throw error;
    }
});

// Endpoint to check job status
export const getJobStatus = asyncHandler(async (req: Request, res: Response) => {
    const jobId = req.params.id;

    const queryText = "SELECT id, status, result, created_at FROM jobs WHERE id = $1";
    const result = await pool.query(queryText, [jobId]);

    if (result.rows.length === 0) {
        throw new ApiError(HttpStatusCode.NOT_FOUND, "Job not found");
    }

    res.status(HttpStatusCode.OK).json(
        new ApiResponse(HttpStatusCode.OK, result.rows[0], "Job status retrieved")
    );
});