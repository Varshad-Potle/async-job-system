import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import { errorHandler } from "./middleware/errorHandler";

const app: Application = express();

// 1. Global Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Routes (Placeholder)
import jobRoutes from './routes/job.routes';
app.use("/api/v1/jobs", jobRoutes);

// 3. Health Check
app.get("/health", (req, res) => {
    res.status(200).json({ status: "OK", uptime: process.uptime() });
});

// 4. Global Error Handler (Must be last)
app.use(errorHandler);

export { app };