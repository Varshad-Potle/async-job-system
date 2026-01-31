import dotenv from "dotenv";
import { app } from "./app";

dotenv.config();

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        // TODO: Connect to PostgreSQL
        // TODO: Connect to Redis
        // console.log("📦 Database & Queue connected");

        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
};

startServer();