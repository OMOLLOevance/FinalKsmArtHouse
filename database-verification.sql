-- Database Verification Script
-- Run this in Supabase SQL Editor to verify all tables exist and are properly configured

-- Check if all required tables exist
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'users',
    'customers', 
    'gym_members',
    'gym_finances',
    'sauna_bookings',
    'spa_bookings',
    'sauna_spa_finances',
    'restaurant_sales',
    'event_items',
    'catering_inventory',
    'quotations'
)
ORDER BY tablename;

-- Check table structures
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN (
    'users',
    'customers', 
    'gym_members',
    'gym_finances',
    'sauna_bookings',
    'spa_bookings',
    'sauna_spa_finances',
    'restaurant_sales',
    'event_items',
    'catering_inventory',
    'quotations'
)
ORDER BY table_name, ordinal_position;

-- Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN (
    'users',
    'customers', 
    'gym_members',
    'gym_finances',
    'sauna_bookings',
    'spa_bookings',
    'sauna_spa_finances',
    'restaurant_sales',
    'event_items',
    'catering_inventory',
    'quotations'
)
ORDER BY tablename, indexname;

-- Check foreign key constraints
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- Count records in each table (for verification)
SELECT 
    'users' as table_name, 
    COUNT(*) as record_count 
FROM users
UNION ALL
SELECT 
    'customers' as table_name, 
    COUNT(*) as record_count 
FROM customers
UNION ALL
SELECT 
    'gym_members' as table_name, 
    COUNT(*) as record_count 
FROM gym_members
UNION ALL
SELECT 
    'gym_finances' as table_name, 
    COUNT(*) as record_count 
FROM gym_finances
UNION ALL
SELECT 
    'sauna_bookings' as table_name, 
    COUNT(*) as record_count 
FROM sauna_bookings
UNION ALL
SELECT 
    'spa_bookings' as table_name, 
    COUNT(*) as record_count 
FROM spa_bookings
UNION ALL
SELECT 
    'sauna_spa_finances' as table_name, 
    COUNT(*) as record_count 
FROM sauna_spa_finances
UNION ALL
SELECT 
    'restaurant_sales' as table_name, 
    COUNT(*) as record_count 
FROM restaurant_sales
UNION ALL
SELECT 
    'event_items' as table_name, 
    COUNT(*) as record_count 
FROM event_items
UNION ALL
SELECT 
    'catering_inventory' as table_name, 
    COUNT(*) as record_count 
FROM catering_inventory
UNION ALL
SELECT 
    'quotations' as table_name, 
    COUNT(*) as record_count 
FROM quotations
ORDER BY table_name;