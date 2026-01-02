-- KSM ART HOUSE - PROFESSIONAL DATABASE AUDIT SCRIPT
-- This script verifies that your Supabase tables match the new codebase architecture.

-- 1. Check for Required Tables
-- Ensures all core modules have their corresponding database storage.
SELECT 
    tablename, 
    rowsecurity as rls_enabled,
    hasindexes as indexed
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'users', 'customers', 'gym_members', 'gym_finances', 
    'sauna_bookings', 'restaurant_sales', 'event_items', 
    'catering_inventory', 'decor_allocations', 'decor_inventory', 'quotations'
)
ORDER BY tablename;

-- 2. Verify Foreign Key Connections
-- Confirms that all data is correctly linked to the 'users' table for security.
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
AND ccu.table_name = 'users';

-- 3. Check Data Connectivity
-- Provides a quick snapshot of the current data volume.
SELECT 'customers' as table_name, COUNT(*) FROM customers
UNION ALL
SELECT 'gym_members', COUNT(*) FROM gym_members
UNION ALL
SELECT 'decor_inventory', COUNT(*) FROM decor_inventory
UNION ALL
SELECT 'decor_allocations', COUNT(*) FROM decor_allocations;

-- 4. Verify Security Policies (RLS)
-- Crucial for ensuring that users only see their own data.
SELECT 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
