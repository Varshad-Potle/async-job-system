import dotenv from "dotenv";
import { app } from "./app";
import { initDb } from "./db/schema";

dotenv.config();

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        // initialize database
        await initDb();

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