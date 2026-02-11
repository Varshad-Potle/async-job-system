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
        await redisClient.lpush("job_queue", String(newJob.id));

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
    const jobId = String(req.params.id);

    const queryText = "SELECT id, status, result, created_at FROM jobs WHERE id = $1";
    const result = await pool.query(queryText, [jobId]);

    if (result.rows.length === 0) {
        throw new ApiError(HttpStatusCode.NOT_FOUND, "Job not found");
    }

    res.status(HttpStatusCode.OK).json(
        new ApiResponse(HttpStatusCode.OK, result.rows[0], "Job status retrieved")
    );
});

// function to manually retry a job
export const retryJob = asyncHandler(async (req: Request, res: Response) => {
    const id = String(req.params.id);

    // fetch current status to ensure safety
    const jobQuery = await pool.query("SELECT status FROM jobs WHERE id = $1", [id]);
    if (jobQuery.rows.length === 0) {
        throw new ApiError(HttpStatusCode.NOT_FOUND, "Job not found");
    }

    const job = jobQuery.rows[0];

    // do not retry jobs that are already pending or running
    if (job.status === JobStatus.PENDING || job.status === JobStatus.PROCESSING || job.status === JobStatus.RETRYING) {
        throw new ApiError(HttpStatusCode.BAD_REQUEST, `Cannot retry job in active ${job.status} state. Wait for it to finish or fail.`)
    }

    // reset the job in postgres
    const updateQuery = `
        UPDATE jobs
        SET status = $1,
        attempts = 0,
        error_message = NULL,
        result = NULL,
        next_run_at = NOW(),
        updated_at = NOW(),
        processing_started_at = NULL
        WHERE id = $2
        RETURNING id
    `;

    await pool.query(updateQuery, [JobStatus.PENDING, id]);

    // remove from DLQ if it exists
    await redisClient.lrem("dead_jobs", 0, id);

    // add to redis queue
    await redisClient.lpush("job_queue", id);

    res.status(HttpStatusCode.OK).json(
        new ApiResponse(HttpStatusCode.OK, { jobId: id }, "Job retried successfully")
    )
});


// function to get list of all dead jobs 
export const getDeadJobs = asyncHandler(async (req: Request, res: Response) => {
    const result = await pool.query(
        "SELECT id, error_message, attempts, created_at FROM jobs WHERE status = $1 ORDER BY updated_at DESC LIMIT 50",
        [JobStatus.DEAD]
    );
    return res.status(HttpStatusCode.OK).json(
        new ApiResponse(HttpStatusCode.OK, result.rows, "Dead jobs retrieved successfully")
    );
});