-- KSM ART HOUSE - DATABASE REFINEMENT & SECURITY SYNC
-- Run this script to clean up policy clutter and enforce strict user data isolation.

-- 1. FIX TABLE NAMES (Sync with Codebase)
-- Uses a safe block to prevent "already exists" errors.
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'decor_inventory_data') 
       AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'decor_inventory') THEN
        ALTER TABLE decor_inventory_data RENAME TO decor_inventory;
        RAISE NOTICE 'Renamed decor_inventory_data to decor_inventory';
    ELSIF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'decor_inventory') THEN
        RAISE NOTICE 'Table decor_inventory already exists, skipping rename';
    END IF;
END $$;

-- 2. CLEAN UP REDUNDANT/OVER-PERMISSIVE POLICIES
-- Removing policies that might allow "any" authenticated user to see data.
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON customers;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON decor_items;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON monthly_allocations;

-- Remove duplicates for Catering
DROP POLICY IF EXISTS "Users can manage own catering inventory" ON catering_inventory;
DROP POLICY IF EXISTS "Users can manage own catering items" ON catering_items;

-- 3. ENFORCE STRICT USER ISOLATION (Professional Standard)
-- This loop applies a single, robust "Owner Access" policy to all core tables.
-- It ensures that users can ONLY see and modify their own records.
DO $$ 
DECLARE 
    t text;
    tables_to_fix text[] := ARRAY['customers', 'decor_allocations', 'decor_inventory', 'gym_members', 'gym_finances', 'sauna_bookings', 'quotations', 'restaurant_sales'];
BEGIN
    FOR t IN SELECT unnest(tables_to_fix) LOOP
        -- Remove existing diverse owner policies to avoid confusion
        EXECUTE format('DROP POLICY IF EXISTS "Manage own %s" ON %I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "Users can manage own %s" ON %I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "Owner Access" ON %I', t);
        
        -- Create the new standardized policy
        EXECUTE format('CREATE POLICY "Owner Access" ON %I FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)', t);
        
        RAISE NOTICE 'Applied standardized Owner Access to table: %', t;
    END LOOP;
END $$;

-- 4. VERIFY FINAL STATE
-- Use this output to confirm only one "Owner Access" policy exists per table.
SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;
