import Redis from "ioredis";
import dotenv from "dotenv";

// load env vars from root
import path from "path";
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379');

// redis client instance
const redisClient = new Redis({
    host: redisHost,
    port: redisPort,
    maxRetriesPerRequest: null, // disabling retry
});

redisClient.on('connect', () => {
    console.log('Redis connected');
});

redisClient.on('error', (err) => {
    console.error('Redis Connection Error:', err);
});

export default redisClient;