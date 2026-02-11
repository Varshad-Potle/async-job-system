import dotenv from "dotenv";
import { initDb } from "./db/schema";
import { startWorker } from "./worker/index";

dotenv.config();

const run = async () => {
    try {
        await initDb();
        console.log("Worker Process ID:", process.pid);
        await startWorker();
    } catch (error: any) {
        console.error("Worker failed to start", error);
        process.exit(1);
    }
};

run();