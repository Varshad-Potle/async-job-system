import dotenv from "dotenv";
import { app } from "./app";
import { initDb } from "./db/schema";
import { redisClient, redisBlockingClient } from "./db/redis";
import pool from "./db";

dotenv.config();

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        // Initialize Database
        await initDb();
        console.log("Database Initialized");

        // Start HTTP Server
        const server = app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });

        // Graceful Shutdown Logic
        const shutdown = async (signal: string) => {
            console.log(`\n ${signal} received. Closing resources...`);

            // Stop HTTP server first
            server.close(() => {
                console.log("   - HTTP Server closed");
            });

            try {
                // Close Redis connections
                redisBlockingClient.disconnect();
                await redisClient.quit();
                console.log("   - Redis connections closed");

                // Close DB Pool
                await pool.end();
                console.log("   - Database pool closed");

                console.log("Graceful shutdown complete.");
                process.exit(0);
            } catch (err) {
                console.error("   - Error during shutdown:", err);
                process.exit(1);
            }
        };

        // Listen for termination signals
        process.on("SIGINT", () => shutdown("SIGINT"));   // Ctrl+C
        process.on("SIGTERM", () => shutdown("SIGTERM")); // Docker stop

    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};

startServer();