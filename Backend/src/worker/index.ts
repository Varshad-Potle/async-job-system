import redisClient from "../db/redis";
import pool from "../db";
import { JobStatus } from "../constants";

async function processJob(jobId: string) {
    try {
        // fetch job metadata from postgres
        const jobQuery = await pool.query("SELECT * FROM jobs WHERE id = $1", [jobId]);
        const job = jobQuery.rows[0];

        if (!job) {
            console.log(`Job ${jobId} found in Redis but not in DB. Skipping.`);
            return;
        }

        console.log(`Processing Job #${jobId} (${job.payload.type})...`);

        // update STATUS -> PROCESSING
        await pool.query("UPDATE jobs SET status = $1, updated_at = NOW() WHERE id = $2", [
            JobStatus.PROCESSING,
            jobId,
        ]);

        // execute the task simulating 5 second task
        await new Promise((resolve) => setTimeout(resolve, 5000));

        // update STATUS -> SUCCESS
        const result = { processedOn: new Date().toISOString(), output: "Success" };

        await pool.query(
            "UPDATE jobs SET status = $1, result = $2, updated_at = NOW() WHERE id = $3",
            [JobStatus.COMPLETED, result, jobId]
        );

        console.log(`Job #${jobId} Completed.`);
    } catch (error) {
        console.error(`Job #${jobId} Failed:`, error);

        // mark as failed in DB
        await pool.query("UPDATE jobs SET status = $1, updated_at = NOW() WHERE id = $2", [
            JobStatus.FAILED,
            jobId,
        ]);
    }
}

async function startWorker() {
    console.log("Worker Service Started. Waiting for jobs...");

    while (true) {
        try {
            // brpop from Redis
            const response = await redisClient.brpop("job_queue", 0);

            if (response) {
                const jobId = response[1];
                await processJob(jobId);
            }
        } catch (error) {
            console.error("Worker Connection Error:", error);
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    }
}

startWorker();