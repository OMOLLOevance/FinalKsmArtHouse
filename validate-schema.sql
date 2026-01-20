-- Schema validation and diagnostic script
-- Run this to check current table structure

-- Check if cloud_sync_data table exists and show its structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'cloud_sync_data'
ORDER BY ordinal_position;

-- Check indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'cloud_sync_data';

-- Check RLS policies
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'cloud_sync_data';

-- Test basic operations
SELECT 'Schema validation complete' as status;