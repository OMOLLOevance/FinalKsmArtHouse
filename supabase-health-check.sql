-- =====================================================
-- KSM.ART HOUSE - COMPREHENSIVE DATABASE VERIFICATION
-- =====================================================

-- 1. VERIFY ALL REQUIRED TABLES EXIST
DO $$
DECLARE
    missing_tables TEXT[] := ARRAY[]::TEXT[];
    table_name TEXT;
    required_tables TEXT[] := ARRAY[
        'users', 'customers', 'gym_members', 'gym_finances',
        'restaurant_sales', 'sauna_bookings', 'spa_bookings',
        'catering_inventory', 'decor_inventory', 'decor_allocations',
        'customer_requirements', 'quotations', 'event_items',
        'monthly_allocations', 'payments', 'cloud_sync_data'
    ];
BEGIN
    FOREACH table_name IN ARRAY required_tables
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = table_name
        ) THEN
            missing_tables := array_append(missing_tables, table_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE NOTICE 'MISSING TABLES: %', array_to_string(missing_tables, ', ');
    ELSE
        RAISE NOTICE '✅ ALL REQUIRED TABLES EXIST';
    END IF;
END $$;

-- 2. VERIFY RLS (ROW LEVEL SECURITY) IS ENABLED
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '✅ ENABLED'
        ELSE '❌ DISABLED'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'users', 'customers', 'gym_members', 'gym_finances',
    'restaurant_sales', 'sauna_bookings', 'catering_inventory'
)
ORDER BY tablename;

-- 3. VERIFY ESSENTIAL COLUMNS EXIST
DO $$
DECLARE
    table_checks RECORD;
BEGIN
    -- Check users table structure
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'role'
    ) THEN
        RAISE NOTICE '❌ users.role column missing';
    ELSE
        RAISE NOTICE '✅ users table structure OK';
    END IF;
    
    -- Check customers table structure
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'user_id'
    ) THEN
        RAISE NOTICE '❌ customers.user_id column missing';
    ELSE
        RAISE NOTICE '✅ customers table structure OK';
    END IF;
END $$;

-- 4. TEST DATA INSERTION (SAFE TEST)
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
BEGIN
    -- Test user creation
    INSERT INTO users (id, email, first_name, last_name, role)
    VALUES (test_user_id, 'test@ksmart.com', 'Test', 'User', 'staff');
    
    -- Test customer creation
    INSERT INTO customers (user_id, name, contact, event_type)
    VALUES (test_user_id, 'Test Customer', '123456789', 'Wedding');
    
    -- Clean up test data
    DELETE FROM customers WHERE user_id = test_user_id;
    DELETE FROM users WHERE id = test_user_id;
    
    RAISE NOTICE '✅ DATA INSERTION/DELETION TEST PASSED';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ DATA INSERTION TEST FAILED: %', SQLERRM;
END $$;

-- 5. VERIFY INDEXES FOR PERFORMANCE
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'customers', 'gym_members')
ORDER BY tablename, indexname;

-- 6. CHECK TABLE SIZES AND ROW COUNTS
SELECT 
    schemaname,
    tablename,
    n_tup_ins as total_inserts,
    n_tup_upd as total_updates,
    n_tup_del as total_deletes,
    n_live_tup as current_rows
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY current_rows DESC;

-- 7. VERIFY FOREIGN KEY CONSTRAINTS
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
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

-- 8. FINAL HEALTH CHECK SUMMARY
DO $$
DECLARE
    table_count INTEGER;
    user_count INTEGER;
    customer_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public';
    
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO customer_count FROM customers;
    
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'KSM.ART HOUSE DATABASE HEALTH SUMMARY';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Total Tables: %', table_count;
    RAISE NOTICE 'Total Users: %', user_count;
    RAISE NOTICE 'Total Customers: %', customer_count;
    RAISE NOTICE '==========================================';
    
    IF table_count >= 10 AND user_count >= 0 THEN
        RAISE NOTICE '✅ DATABASE STATUS: HEALTHY';
    ELSE
        RAISE NOTICE '⚠️  DATABASE STATUS: NEEDS ATTENTION';
    END IF;
END $$;