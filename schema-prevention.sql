-- Schema Prevention Strategy
-- Run this periodically to ensure schema consistency

-- 1. Create a function to validate expected schema
CREATE OR REPLACE FUNCTION validate_cloud_sync_schema()
RETURNS TABLE(
  column_name text,
  expected_type text,
  actual_type text,
  status text
) AS $$
BEGIN
  RETURN QUERY
  WITH expected_columns AS (
    SELECT 'id'::text as col_name, 'uuid'::text as exp_type
    UNION ALL SELECT 'user_id', 'text'
    UNION ALL SELECT 'data', 'jsonb'
    UNION ALL SELECT 'device_id', 'text'
    UNION ALL SELECT 'version', 'text'
    UNION ALL SELECT 'change_log', 'jsonb'
    UNION ALL SELECT 'created_at', 'timestamp with time zone'
    UNION ALL SELECT 'updated_at', 'timestamp with time zone'
  ),
  actual_columns AS (
    SELECT 
      column_name::text as col_name,
      data_type::text as act_type
    FROM information_schema.columns 
    WHERE table_name = 'cloud_sync_data'
  )
  SELECT 
    e.col_name,
    e.exp_type,
    COALESCE(a.act_type, 'MISSING') as actual_type,
    CASE 
      WHEN a.act_type IS NULL THEN 'MISSING'
      WHEN e.exp_type = a.act_type THEN 'OK'
      ELSE 'TYPE_MISMATCH'
    END as status
  FROM expected_columns e
  LEFT JOIN actual_columns a ON e.col_name = a.col_name
  ORDER BY e.col_name;
END;
$$ LANGUAGE plpgsql;

-- 2. Create a function to auto-fix schema issues
CREATE OR REPLACE FUNCTION fix_cloud_sync_schema()
RETURNS text AS $$
DECLARE
  result text := '';
BEGIN
  -- Check and fix each column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'cloud_sync_data' AND column_name = 'change_log') THEN
    ALTER TABLE cloud_sync_data ADD COLUMN change_log JSONB DEFAULT '[]'::jsonb;
    result := result || 'Added change_log column. ';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'cloud_sync_data' AND column_name = 'version') THEN
    ALTER TABLE cloud_sync_data ADD COLUMN version TEXT DEFAULT '3.0';
    result := result || 'Added version column. ';
  END IF;
  
  -- Ensure proper indexes exist
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'cloud_sync_data' AND indexname = 'idx_cloud_sync_user_id') THEN
    CREATE INDEX idx_cloud_sync_user_id ON cloud_sync_data(user_id);
    result := result || 'Added user_id index. ';
  END IF;
  
  IF result = '' THEN
    result := 'Schema is already correct.';
  END IF;
  
  -- Refresh schema cache
  NOTIFY pgrst, 'reload schema';
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Usage examples:
-- SELECT * FROM validate_cloud_sync_schema();
-- SELECT fix_cloud_sync_schema();