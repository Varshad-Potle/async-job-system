import Redis, { RedisOptions } from "ioredis";
import dotenv from "dotenv";
import path from "path";

// load env vars from root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Base options needed for worker queue logic
const baseOptions: RedisOptions = {
    maxRetriesPerRequest: null,
    family: 4, 
    enableReadyCheck: false,
    retryStrategy: (times: number) => {
        console.log(`[Redis] Retrying connection... (Attempt ${times})`);
        return Math.min(times * 100, 3000); // Max wait of 3 seconds between retries
    },
    reconnectOnError: (err) => {
        console.warn(`[Redis] Reconnecting after error: ${err.message}`);
        return true; // Force ioredis to actively reconnect on ANY error
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