-- KSM ART HOUSE - FINAL SECURITY STANDARDIZATION (V4)
-- This script reaches 100% uniformity and automatically detects user columns (id vs user_id).

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
    col_name text;
    tables_list text[] := ARRAY[
        'customers', 'decor_allocations', 'decor_inventory', 
        'gym_members', 'gym_finances', 'sauna_bookings', 
        'quotations', 'restaurant_sales', 'catering_inventory',
        'catering_items', 'event_items', 'spa_bookings', 
        'sauna_spa_finances', 'cloud_sync_data', 'restaurant_monthly_inventory',
        'catering_inventory_data', 'decor_inventory_data', 'monthly_allocations',
        'custom_users', 'users'
    ];
BEGIN
    FOR current_table IN SELECT unnest(tables_list) LOOP
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = current_table) THEN
            
            -- Detect correct column (id for users/profiles, user_id for records)
            IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = current_table AND column_name = 'user_id') THEN
                col_name := 'user_id';
            ELSIF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = current_table AND column_name = 'id') THEN
                col_name := 'id';
            ELSE
                RAISE NOTICE 'Skipping table %: No id or user_id column found', current_table;
                CONTINUE;
            END IF;

            -- Drop all existing policies
            FOR current_policy IN 
                SELECT policyname FROM pg_policies 
                WHERE schemaname = 'public' AND tablename = current_table 
            LOOP
                EXECUTE format('DROP POLICY IF EXISTS %I ON %I', current_policy, current_table);
            END LOOP;
            
            -- Apply standardized Owner Access
            EXECUTE format('
                CREATE POLICY "Owner Access" ON %I 
                FOR ALL 
                TO authenticated 
                USING (auth.uid() = %I) 
                WITH CHECK (auth.uid() = %I)', 
            current_table, col_name, col_name);
        END IF;
    END LOOP;
END $$;

-- 3. VERIFY FINAL STATE
SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;
