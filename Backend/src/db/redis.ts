import Redis, { RedisOptions } from "ioredis";
import dotenv from "dotenv";
import path from "path";

// load env vars from root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Base options needed for worker queue logic
const baseOptions: RedisOptions = {
    maxRetriesPerRequest: null,
    retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    }
};

const redisUrl = process.env.REDIS_URL;

export const redisClient = redisUrl
    ? new Redis(redisUrl, baseOptions)
    : new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        ...baseOptions
    });

export const redisBlockingClient = redisUrl
    ? new Redis(redisUrl, baseOptions)
    : new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        ...baseOptions
    });

redisClient.on('connect', () => console.log('Redis General Client Connected'));
redisBlockingClient.on('connect', () => console.log('Redis Blocking Client Connected'));

redisClient.on('error', (err) => console.error('Redis General Error:', err));
redisBlockingClient.on('error', (err) => console.error('Redis Blocking Error:', err));