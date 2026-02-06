import { redisClient, redisBlockingClient } from "../db/redis";
import pool from "../db";
import { JobStatus } from "../constants";

const calculateBackoff = (attempts: number) => {
    const baseDelay = 5000;
    return baseDelay * Math.pow(2, attempts - 1);
};

// recovery Mechanism
async function recoverStuckJobs() {
    console.log("Worker starting: Checking for stuck jobs...");

    // Find jobs that are stuck in RETRYING past their due date OR stuck in PROCESSING for too long
    const query = `
        SELECT id FROM jobs 
        WHERE (status = $1 AND next_run_at <= NOW())
        OR (status = $2 AND updated_at < NOW() - INTERVAL '5 minutes')
    `;

    const { rows } = await pool.query(query, [JobStatus.RETRYING, JobStatus.PROCESSING]);

    for (const job of rows) {
        console.log(`Recovering Stuck Job #${job.id}`);
        // Resetting status from RETRYING or PROCESSING to PENDING and push to queue again
        await pool.query("UPDATE jobs SET status = $1, updated_at = NOW() WHERE id = $2", [JobStatus.PENDING, job.id]);
        await redisClient.lpush("job_queue", job.id);
    }

    if (rows.length > 0) console.log(`Recovered ${rows.length} jobs.`);
}

// Failure Handler
async function handleFailure(jobId: string, attempts: number, maxAttempts: number, errorMessage: string) {

    // Check if we have retries left
    if (attempts < maxAttempts) {
        const delay = calculateBackoff(attempts);
        const nextRun = new Date(Date.now() + delay);

        console.log(`Job #${jobId} Failed. Retrying in ${delay / 1000}s... (Attempt ${attempts}/${maxAttempts})`);

        // Update DB state
        await pool.query(
            "UPDATE jobs SET status = $1, error_message = $2, next_run_at = $3, updated_at = NOW() WHERE id = $4",
            [JobStatus.RETRYING, errorMessage, nextRun, jobId]
        );

        // Schedule re-queue into redis
        setTimeout(async () => {
            try {
                console.log(`Re-queueing Job #${jobId} into Redis.`);
                await redisClient.lpush("job_queue", jobId);
            } catch (err) {
                console.error(`Failed to re-queue job #${jobId} inside timeout`, err);
                // If this fails, the 'recoverStuckJobs' on next restart will catch it.
            }
        }, delay);

    } else {
        console.error(`Job #${jobId} Max Retries Reached. Marking FAILED.`);
        await pool.query(
            "UPDATE jobs SET status = $1, error_message = $2, updated_at = NOW() WHERE id = $3",
            [JobStatus.FAILED, errorMessage, jobId]
        );
    }
}

// job processor
async function processJob(jobId: string) {
    try {
        // Atomic increment of attempts prevents race conditions
        const jobUpdate = await pool.query(
            `UPDATE jobs 
             SET status = $1, attempts = attempts + 1, updated_at = NOW() 
             WHERE id = $2 
             RETURNING attempts, max_attempts`,
            [JobStatus.PROCESSING, jobId]
        );

        if (jobUpdate.rows.length === 0) {
            console.log(`Job ${jobId} found in Redis but missing in DB. Skipping.`);
            return;
        }

        const { attempts, max_attempts } = jobUpdate.rows[0];
        console.log(`Starting Job #${jobId} (Attempt ${attempts}/${max_attempts})...`);

        // --- SIMULATED WORK ---
        if (Math.random() < 0.5) throw new Error("Simulated Random API Failure!");
        await new Promise((resolve) => setTimeout(resolve, 2000));
        // -------------------------

        await pool.query(
            "UPDATE jobs SET status = $1, result = $2, updated_at = NOW() WHERE id = $3",
            [JobStatus.COMPLETED, JSON.stringify({ output: "Email Sent" }), jobId]
        );

        console.log(`Job #${jobId} Succeeded.`);

    } catch (error: any) {
        // Fetch current state to ensure we have latest attempts count for the handler
        const jobQuery = await pool.query("SELECT attempts, max_attempts FROM jobs WHERE id = $1", [jobId]);
        if (jobQuery.rows[0]) {
            await handleFailure(jobId, jobQuery.rows[0].attempts, jobQuery.rows[0].max_attempts, error.message);
        }
    }
}

// worker loop
export async function startWorker() {
    await recoverStuckJobs(); // Run safety check on boot

    console.log("Smart Worker Service Started. Waiting for jobs...");

    while (true) {
        try {
            // "0" means block indefinitely until a job arrives
            const response = await redisBlockingClient.brpop("job_queue", 0);

            if (response) {
                const jobId = response[1]; // brpop returns [key, value]
                await processJob(jobId);
            }
        } catch (error) {
            console.error("Worker Loop Error:", error);
            // Small delay to prevent CPU spam if Redis goes down
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    }
}

startWorker();