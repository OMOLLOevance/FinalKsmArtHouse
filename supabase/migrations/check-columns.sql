-- Check table structure only
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'monthly_allocations' 
ORDER BY ordinal_position;