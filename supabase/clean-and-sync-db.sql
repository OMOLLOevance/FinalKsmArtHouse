-- KSM ART HOUSE - FINAL SECURITY STANDARDIZATION (V2)
-- This script reaches 100% uniformity across all tables, including legacy data tables.

-- 1. FIX TABLE NAMES (Sync with Codebase)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'decor_inventory_data') 
       AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'decor_inventory') THEN
        ALTER TABLE decor_inventory_data RENAME TO decor_inventory;
    END IF;
END $$;

-- 2. STANDARDIZE EVERY SINGLE TABLE
DO $$ 
DECLARE 
    current_table text;
    current_policy text;
    -- Full list of all public tables
    tables_list text[] := ARRAY[
        'customers', 'decor_allocations', 'decor_inventory', 
        'gym_members', 'gym_finances', 'sauna_bookings', 
        'quotations', 'restaurant_sales', 'catering_inventory',
        'catering_items', 'event_items', 'spa_bookings', 
        'sauna_spa_finances', 'cloud_sync_data', 'restaurant_monthly_inventory',
        'catering_inventory_data', 'decor_inventory_data', 'monthly_allocations'
    ];
BEGIN
    FOR current_table IN SELECT unnest(tables_list) LOOP
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = current_table) THEN
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
        END IF;
    END LOOP;

    -- Standardize users table specifically (uses 'id' instead of 'user_id')
    FOR current_policy IN SELECT policyname FROM pg_policies WHERE tablename = 'users' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON users', current_policy);
    END LOOP;
    CREATE POLICY "Owner Access" ON users FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
END $$;

Decor & Lighting Items
0 customers configured


-- 3. VERIFY FINAL STATE
SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;
