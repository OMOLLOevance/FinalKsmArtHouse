-- Fix cloud_sync_data table structure
-- Run this in Supabase SQL Editor

-- Add missing columns to cloud_sync_data table
ALTER TABLE cloud_sync_data 
ADD COLUMN IF NOT EXISTS change_log JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

SELECT 'Cloud sync table fixed!' as result;