import { query } from './index';

export const initDb = async () => {
    const createTableQuery = `
    CREATE TABLE IF NOT EXISTS jobs (
      id SERIAL PRIMARY KEY,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      payload JSONB NOT NULL,
      result JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

    try {
        await query(createTableQuery);
        console.log("Jobs table checked/created");
    } catch (error) {
        console.error("Failed to initialize DB schema:", error);
        process.exit(1);
    }
};