-- Test if customers table has data and structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'customers' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if there's any data
SELECT COUNT(*) as customer_count FROM customers;