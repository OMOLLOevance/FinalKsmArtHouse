-- Safe Database Verification Script
-- First check what columns actually exist, then test accordingly

-- 1. Check actual table structure
SELECT 
    'Table Structure' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'monthly_allocations' 
ORDER BY ordinal_position;

-- 2. Check NOT NULL constraints
SELECT 
    'NOT NULL Constraints' as check_type,
    column_name,
    'NOT NULL' as constraint_type
FROM information_schema.columns 
WHERE table_name = 'monthly_allocations' 
AND is_nullable = 'NO';

-- 3. Check indexes
SELECT 
    'Indexes' as check_type,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'monthly_allocations';

-- 4. Check RLS policies
SELECT 
    'RLS Policies' as check_type,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'monthly_allocations';

-- 5. Check current data count
SELECT 
    'Data Count' as check_type,
    COUNT(*) as total_records
FROM monthly_allocations;

-- 6. Check decor_inventory integration
SELECT 
    'Decor Inventory' as check_type,
    COUNT(*) as total_items,
    COUNT(CASE WHEN inventory_limit > 0 THEN 1 END) as items_with_limits
FROM decor_inventory;

-- 7. System readiness check
SELECT 
    'System Status' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'monthly_allocations')
        THEN 'monthly_allocations table exists'
        ELSE 'monthly_allocations table missing'
    END as status;