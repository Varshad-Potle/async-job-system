import { Pool } from "pg";
import dotenv from "dotenv";

// since .env is in root folder and not backend folder
import path from "path";
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// configure pool
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432')
});

pool.on('connect', () => {

});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

// wrapper for pool.query
export const query = (text: string, params?: any[]) => {
    return pool.query(text, params);
};

export default pool;