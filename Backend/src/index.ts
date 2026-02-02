import dotenv from "dotenv";
import { app } from "./app";
import { initDb } from "./db/schema";
import redisClient from "./db/redis";

dotenv.config();

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        // initialize database table
        await initDb();

        // initialize redis
        redisClient.on("connect", () => {
            console.log("Redis connected");
        });


        // start server
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};

startServer();