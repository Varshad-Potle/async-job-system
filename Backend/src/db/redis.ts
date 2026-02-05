import Redis from "ioredis";
import dotenv from "dotenv";
import path from "path";

// load env vars from root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null,
    retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    }
};

// General Client (For LPUSH, SET, etc.)
export const redisClient = new Redis(redisConfig);

// Blocking Client (For BRPOP only)
export const redisBlockingClient = new Redis(redisConfig);

redisClient.on('connect', () => console.log('Redis General Client Connected'));
redisBlockingClient.on('connect', () => console.log('Redis Blocking Client Connected'));

redisClient.on('error', (err) => console.error('Redis General Error:', err));
redisBlockingClient.on('error', (err) => console.error('Redis Blocking Error:', err));