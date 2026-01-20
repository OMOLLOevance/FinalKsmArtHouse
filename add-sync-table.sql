-- Fix cloud_sync_data table schema mismatch
-- Run this in Supabase SQL Editor

-- First, check if table exists and add missing columns
DO $$
BEGIN
  -- Add change_log column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'cloud_sync_data' AND column_name = 'change_log') THEN
    ALTER TABLE cloud_sync_data ADD COLUMN change_log JSONB DEFAULT '[]'::jsonb;
  END IF;
  
  -- Add version column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'cloud_sync_data' AND column_name = 'version') THEN
    ALTER TABLE cloud_sync_data ADD COLUMN version TEXT NOT NULL DEFAULT '3.0';
  END IF;
  
  -- Add id column if missing (for proper primary key)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'cloud_sync_data' AND column_name = 'id') THEN
    ALTER TABLE cloud_sync_data ADD COLUMN id UUID DEFAULT gen_random_uuid();
  END IF;
  
  -- Add created_at column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'cloud_sync_data' AND column_name = 'created_at') THEN
    ALTER TABLE cloud_sync_data ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- Ensure user_id is text type (not UUID) for local auth compatibility
ALTER TABLE cloud_sync_data ALTER COLUMN user_id TYPE text USING user_id::text;

-- Create indexes for performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_cloud_sync_user_id ON cloud_sync_data(user_id);
CREATE INDEX IF NOT EXISTS idx_cloud_sync_updated_at ON cloud_sync_data(updated_at DESC);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';