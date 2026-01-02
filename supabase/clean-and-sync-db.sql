-- KSM ART HOUSE - FINAL SECURITY STANDARDIZATION
-- This script removes ALL duplicate policies and applies the "Gold Standard" of Owner Access.

-- 1. FIX TABLE NAMES (Sync with Codebase)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'decor_inventory_data') 
       AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'decor_inventory') THEN
        ALTER TABLE decor_inventory_data RENAME TO decor_inventory;
        RAISE NOTICE 'Renamed decor_inventory_data to decor_inventory';
    END IF;
END $$;

-- 2. STANDARDIZE POLICIES
DO $$ 
DECLARE 
    current_table text;
    current_policy text;
    tables_list text[] := ARRAY[
        'customers', 'decor_allocations', 'decor_inventory', 
        'gym_members', 'gym_finances', 'sauna_bookings', 
        'quotations', 'restaurant_sales', 'catering_inventory',
        'catering_items', 'event_items', 'spa_bookings', 
        'sauna_spa_finances', 'cloud_sync_data', 'restaurant_monthly_inventory'
    ];
BEGIN
    FOR current_table IN SELECT unnest(tables_list) LOOP
        -- Drop all existing policies to clear clutter
        FOR current_policy IN 
            SELECT policyname FROM pg_policies 
            WHERE schemaname = 'public' AND tablename = current_table 
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I', current_policy, current_table);
        END LOOP;
        
        -- Apply the single standardized policy
        EXECUTE format('
            CREATE POLICY "Owner Access" ON %I 
            FOR ALL 
            TO authenticated 
            USING (auth.uid() = user_id) 
            WITH CHECK (auth.uid() = user_id)', 
        current_table);
    END LOOP;

    -- Clean up users table
    FOR current_policy IN SELECT policyname FROM pg_policies WHERE tablename = 'users' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON users', current_policy);
    END LOOP;
    
    CREATE POLICY "Owner Access" ON users FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
END $$;

-- 3. VERIFY FINAL STATE
SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;