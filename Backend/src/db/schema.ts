import { query } from './index';

export const initDb = async () => {

  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS jobs (
      id SERIAL PRIMARY KEY,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      payload JSONB NOT NULL,
      result JSONB,

      attempts INT DEFAULT 0,
      max_attempts INT DEFAULT 3,
      error_message TEXT,
      next_run_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT chk_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'retrying'))
    );
  `;

  try {
    await query(createTableQuery);
    console.log("Jobs table checked/created (v1 Resilience Schema)");
  } catch (error) {
    console.error("Failed to initialize DB schema:", error);
    process.exit(1);
  }
};