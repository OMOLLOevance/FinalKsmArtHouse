-- Simplified Database Verification Script
-- Run this in Supabase SQL Editor after adding user_id column

-- 1. Check table structure
SELECT 
    'Table Structure' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'monthly_allocations' 
ORDER BY ordinal_position;

-- 2. Check indexes
SELECT 
    'Indexes' as check_type,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'monthly_allocations';

-- 3. Check constraints
SELECT 
    'Constraints' as check_type,
    constraint_name,
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%monthly_allocations%';

-- 4. Check current data
SELECT 
    'Current Data' as check_type,
    COUNT(*) as total_records,
    COUNT(CASE WHEN event_date IS NOT NULL THEN 1 END) as with_date,
    COUNT(CASE WHEN customer_name IS NOT NULL THEN 1 END) as with_customer,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as with_user_id
FROM monthly_allocations;

-- 5. Check decor_inventory integration
SELECT 
    'Decor Inventory' as check_type,
    COUNT(*) as total_items,
    COUNT(CASE WHEN inventory_limit > 0 THEN 1 END) as with_limits
FROM decor_inventory;

-- 6. Final status
SELECT 
    'System Status' as check_type,
    'monthly_allocations ready' as message,
    COUNT(*) as record_count
FROM monthly_allocations;