import axios from 'axios';

// --- Types ---
export interface Job {
    id: string;
    type: string;
    data: any;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'dead' | 'retrying';
    result?: any;
    error?: any;
    progress: number;
    attempts: number;
    createdAt: string;
    processedAt?: string;
}

export interface Stats {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
}

// --- API Client ---
const API_URL = 'http://localhost:8000/api/v1';

export const api = {
    // 1. Get all jobs
    getJobs: async (): Promise<Job[]> => {
        const response = await axios.get(`${API_URL}/jobs`);
        return response.data.data;
    },

    // 2. Get system stats
    getStats: async (): Promise<Stats> => {
        const response = await axios.get(`${API_URL}/jobs/stats`);
        return response.data.data;
    },

    // 3. Create a new job
    createJob: async (type: string, data: any) => {
        const response = await axios.post(`${API_URL}/jobs`, { type, data });
        return response.data;
    },

    // 4. Retry a failed job (The "Resurrect" button)
    retryJob: async (id: string) => {
        const response = await axios.post(`${API_URL}/jobs/${id}/retry`);
        return response.data;
    },

    // 5. Get dead jobs
    getDeadJobs: async (): Promise<Job[]> => {
        const response = await axios.get(`${API_URL}/jobs/dead`);
        return response.data.data;
    },

    // 6. Get failed/dead jobs (both statuses)
    getFailedJobs: async (): Promise<Job[]> => {
        const allJobs = await api.getJobs();
        return allJobs.filter(job => job.status === 'failed' || job.status === 'dead');
    },

    // 7. Clear all jobs (Optional utility for demos)
    clearJobs: async () => {
        // You might not have this endpoint yet, but it's good to plan for
        // const response = await axios.delete(`${API_URL}/jobs`);
        // return response.data;
    }
};