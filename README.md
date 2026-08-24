# 🚀 Distributed Job Processing System

A robust, scalable background job processing system built with **Node.js**, **Redis**, and **PostgreSQL**. It supports asynchronous task execution, automatic retries with exponential backoff, crash recovery, and a Dead-Letter Queue (DLQ) for inspecting failed jobs.

---

##  Live Demo

> 🔗 **[View Live Demo](https://async-job-system.vercel.app)** — Try out the job queue system in real time.

---

## 🎯 Problem Statement

In real-world systems, heavy or long-running tasks (emails, reports, payments, etc.) cannot block API responses. This project decouples request handling from background execution using a Redis-backed queue and a worker architecture.

---

## 🏗️ Architecture Overview

```
Client
   │
   ▼
API Service (Node.js)
   ├── Stores job in PostgreSQL
   └── Pushes job ID to Redis queue
            │
            ▼
        Redis Queue
            │
            ▼
        Worker Service
   ├── Fetch job
   ├── Mark processing
   ├── Execute task
   ├── Retry with exponential backoff
   └── Move to dead-letter queue if max attempts exceeded
```

---

## 🔄 Job Lifecycle

```
PENDING → PROCESSING → COMPLETED
              ↓
           FAILED → RETRYING → DEAD
```

---

## 🛡️ Failure Handling

### Worker Crash Recovery
1. On startup, worker runs `recoverStuckJobs()`
2. Finds jobs stuck in processing for >10 minutes
3. Resets to `PENDING`
4. Requeues in Redis

### Retry Mechanism
- **Exponential Backoff**: Delays increase with each retry attempt
- **Max Attempts**: Configurable retry limit before job is marked as `DEAD`
- **Dead Letter Queue**: Failed jobs are moved to a separate queue for manual inspection

---

## 📈 Scaling Strategy

1. **Multiple worker instances** can run concurrently
2. **Redis BRPOP** ensures only one worker gets a job
3. System provides **at-least-once execution guarantee**

---

## ✨ Future Improvements

- [ ] Add support for multiple job types
- [ ] Add support for job priorities
- [ ] Add support for job scheduling
- [ ] Add support for job monitoring
- [ ] Add support for job analytics

---

## 🚀 How to Run

### Prerequisites
- Docker & Docker Compose
- Node.js (v14+)
- npm or yarn

### Development

```bash
# Start infrastructure (PostgreSQL + Redis)
docker-compose up -d

# Install dependencies
npm install

# Run API server
npm run dev:api

# Run worker (in a separate terminal)
npm run dev:worker
```

### Production

```bash
# Build the project
npm run build

# Start API server
npm run start:api

# Start worker (in a separate terminal)
npm run start:worker
```

---

## 📚 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/jobs` | Submit a new job to the queue |
| `GET` | `/api/v1/jobs` | Retrieve all active jobs |
| `GET` | `/api/v1/jobs/stats` | Retrieve queue metrics (pending, processing, etc.) |
| `GET` | `/api/v1/jobs/:id` | Get specific job status |
| `POST` | `/api/v1/jobs/:id/retry` | Manually retry a dead job |
| `GET` | `/api/v1/jobs/dead` | Get list of dead jobs in the DLQ |

---

## 🛠️ Tech Stack

- **Backend Runtime**: Node.js, TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (Supabase Serverless)
- **Queue**: Redis (Upstash)
- **Deployment Orchestration**: Railway (API & Worker), Vercel (Frontend)
- **Frontend Visualization**: React, Vite, Tailwind CSS

---

## 📁 Folder Structure

```
async-job-system/
│
├── Backend/                      # Main application directory
│   ├── src/
│   │   ├── controllers/          # Request handlers
│   │   │   └── job.controller.ts # Job-related API logic (create, status, retry, dead jobs)
│   │   │
│   │   ├── routes/               # API route definitions
│   │   │   └── job.routes.ts     # Job endpoints routing
│   │   │
│   │   ├── db/                   # Database configuration
│   │   │   ├── index.ts          # PostgreSQL connection pool
│   │   │   ├── redis.ts          # Redis client setup (standard + blocking)
│   │   │   └── schema.ts         # Database schema initialization
│   │   │
│   │   ├── worker/               # Background job processing
│   │   │   └── index.ts          # Worker logic (job processing, retry, DLQ, recovery)
│   │   │
│   │   ├── middleware/           # Express middleware
│   │   │   └── errorHandler.ts   # Global error handling middleware
│   │   │
│   │   ├── utils/                # Utility functions
│   │   │   ├── ApiError.ts       # Custom error class
│   │   │   ├── ApiResponse.ts    # Standardized API response wrapper
│   │   │   └── asyncHandler.ts   # Async route handler wrapper
│   │   │
│   │   ├── constants.ts          # Application constants (job statuses, HTTP codes)
│   │   ├── app.ts                # Express app configuration
│   │   ├── index.ts              # API server entry point
│   │   └── worker.ts             # Worker process entry point
│   │
│   ├── package.json              # Dependencies and scripts
│   ├── tsconfig.json             # TypeScript configuration
│   └── nodemon.json              # Nodemon configuration for auto-reload
│
├── Frontend/                     # React dashboard for monitoring workers
│
├── docker-compose.yml            # PostgreSQL + Redis setup
├── .env                          # Environment variables
└── README.md                     # Project documentation
```

### Key Components

- **`controllers/`**: Contains business logic for handling API requests
- **`routes/`**: Defines HTTP endpoints and maps them to controllers
- **`db/`**: Manages database connections (PostgreSQL & Redis)
- **`worker/`**: Independent process that consumes jobs from the queue
- **`middleware/`**: Express middleware for error handling and request processing
- **`utils/`**: Reusable utility functions and helper classes
- **`constants.ts`**: Centralized constants for job statuses and HTTP status codes

---

