import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import { errorHandler } from "./middleware/errorHandler";

const app: Application = express();

// 1. Global Middleware

// Use ONE smart CORS configuration
const allowedOrigins = [
    'http://localhost:5173', // For local development
    'https://async-job-system.vercel.app' // For production Vercel frontend
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true
}));

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Routes
import jobRoutes from './routes/job.routes';
app.use("/api/v1/jobs", jobRoutes);

// 3. Health Check
app.get("/health", (req, res) => {
    res.status(200).json({ status: "OK", uptime: process.uptime() });
});

// 4. Global Error Handler (Must be last)
app.use(errorHandler);

export { app };