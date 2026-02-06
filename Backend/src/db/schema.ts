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
      processing_started_at TIMESTAMP, 

      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      CONSTRAINT chk_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'retrying', 'dead'))
    );
  `;

  // Migration scripts to upgrade v1 tables to v2 without data loss
  const migrateV2Query = `
    -- Add processing_started_at if it doesn't exist
    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMP;

    -- Update the check constraint to allow 'dead' status
    -- (We drop the old constraint and add the new one)
    DO $$ 
    BEGIN 
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_status') THEN
            ALTER TABLE jobs DROP CONSTRAINT chk_status;
        END IF;
    END $$;
    
    ALTER TABLE jobs ADD CONSTRAINT chk_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'retrying', 'dead'));
  `;

  try {
    // 1. Create table if it doesn't exist
    await query(createTableQuery);

    // 2. Run migration to ensure v2 columns/constraints exist
    await query(migrateV2Query);

    console.log("Jobs table initialized/migrated (v2 Resilience Schema)");
  } catch (error) {
    console.error("Failed to initialize DB schema:", error);
    process.exit(1);
  }
};