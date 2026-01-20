-- IMMEDIATE FIX for PGRST204 Error
-- Copy and paste this entire script into Supabase SQL Editor and run it

-- Step 1: Add missing change_log column
ALTER TABLE cloud_sync_data ADD COLUMN IF NOT EXISTS change_log JSONB DEFAULT '[]'::jsonb;

-- Step 2: Add missing version column  
ALTER TABLE cloud_sync_data ADD COLUMN IF NOT EXISTS version TEXT DEFAULT '3.0';

-- Step 3: Ensure user_id is text type (for local auth compatibility)
ALTER TABLE cloud_sync_data ALTER COLUMN user_id TYPE text USING user_id::text;

-- Step 4: Update any existing records to have proper defaults
UPDATE cloud_sync_data 
SET 
  change_log = COALESCE(change_log, '[]'::jsonb),
  version = COALESCE(version, '3.0')
WHERE change_log IS NULL OR version IS NULL;

-- Step 5: Force schema cache refresh
NOTIFY pgrst, 'reload schema';

-- Step 6: Verify the fix worked
SELECT 'SUCCESS: Schema fixed!' as status,
       COUNT(*) as total_records
FROM cloud_sync_data;