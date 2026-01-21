-- =====================================================
-- SIMPLE DATABASE FIX FOR KSM.ART HOUSE
-- =====================================================

-- 1. DISABLE RLS ON ALL TABLES
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gym_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gym_finances DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS restaurant_sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sauna_bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS spa_bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS catering_inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS decor_inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS entertainment_bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS quotations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS quotation_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS quotation_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS event_payments DISABLE ROW LEVEL SECURITY;

-- 2. GRANT PERMISSIONS
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 3. ENABLE SIMPLE RLS POLICIES FOR ALL TABLES
DO $$
DECLARE
    table_name text;
BEGIN
    FOR table_name IN 
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
        EXECUTE format('DROP POLICY IF EXISTS "Allow all operations" ON %I', table_name);
        EXECUTE format('CREATE POLICY "Allow all operations" ON %I FOR ALL USING (true)', table_name);
    END LOOP;
END $$;

-- 4. FIX ID CONSTRAINTS FOR ALL TABLES
DO $$
DECLARE
    table_name text;
BEGIN
    FOR table_name IN 
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE %I ALTER COLUMN id SET DEFAULT gen_random_uuid()', table_name);
        EXCEPTION WHEN OTHERS THEN
            -- Skip if no id column
        END;
    END LOOP;
END $$;

-- 5. CREATE TEST USER IF NOT EXISTS
INSERT INTO users (email, first_name, last_name, role)
VALUES ('test@ksmart.com', 'Test', 'User', 'staff')
ON CONFLICT (email) DO NOTHING;

-- 6. VERIFY SETUP
SELECT 
    'DATABASE FIX COMPLETED' as status,
    count(*) as total_tables
FROM pg_tables 
WHERE schemaname = 'public';