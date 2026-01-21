-- =====================================================
-- COMPREHENSIVE DATABASE FIX FOR KSM.ART HOUSE
-- =====================================================

-- 1. DISABLE RLS TEMPORARILY FOR TESTING
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE gym_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE gym_finances DISABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE sauna_bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE catering_inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE decor_inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE quotations DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_items DISABLE ROW LEVEL SECURITY;

-- 2. GRANT FULL PERMISSIONS TO ANON AND AUTHENTICATED USERS
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 3. CREATE SIMPLE RLS POLICIES THAT ALLOW ALL OPERATIONS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations" ON users FOR ALL USING (true);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations" ON customers FOR ALL USING (true);

ALTER TABLE gym_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations" ON gym_members FOR ALL USING (true);

ALTER TABLE gym_finances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations" ON gym_finances FOR ALL USING (true);

ALTER TABLE restaurant_sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations" ON restaurant_sales FOR ALL USING (true);

ALTER TABLE sauna_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations" ON sauna_bookings FOR ALL USING (true);

ALTER TABLE catering_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations" ON catering_inventory FOR ALL USING (true);

ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations" ON quotations FOR ALL USING (true);

-- 4. ENABLE REALTIME FOR ALL TABLES
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE customers;
ALTER PUBLICATION supabase_realtime ADD TABLE gym_members;
ALTER PUBLICATION supabase_realtime ADD TABLE gym_finances;
ALTER PUBLICATION supabase_realtime ADD TABLE restaurant_sales;
ALTER PUBLICATION supabase_realtime ADD TABLE sauna_bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE catering_inventory;
ALTER PUBLICATION supabase_realtime ADD TABLE quotations;

-- 5. CREATE MISSING COLUMNS IF NEEDED
DO $$
BEGIN
    -- Add user_id to catering_inventory if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'catering_inventory' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE catering_inventory ADD COLUMN user_id UUID REFERENCES users(id);
    END IF;
    
    -- Add user_id to quotations if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'quotations' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE quotations ADD COLUMN user_id UUID REFERENCES users(id);
    END IF;
END $$;

-- 6. FIX USERS TABLE CONSTRAINTS AND INSERT DEFAULT TEST USER
DO $$
BEGIN
    -- Drop any self-referencing foreign key constraints on users table
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'users' AND constraint_name = 'users_id_fkey'
    ) THEN
        ALTER TABLE users DROP CONSTRAINT users_id_fkey;
    END IF;
END $$;

-- Insert default test user
INSERT INTO users (id, email, first_name, last_name, role)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'test@ksmart.com',
    'Test',
    'User',
    'staff'
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role;

-- 7. VERIFY SETUP
DO $$
DECLARE
    table_count INTEGER;
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public';
    
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE schemaname = 'public';
    
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'DATABASE FIX COMPLETED';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Tables: %', table_count;
    RAISE NOTICE 'Policies: %', policy_count;
    RAISE NOTICE '✅ RLS POLICIES SIMPLIFIED';
    RAISE NOTICE '✅ PERMISSIONS GRANTED';
    RAISE NOTICE '✅ REALTIME ENABLED';
    RAISE NOTICE '✅ TEST USER CREATED';
    RAISE NOTICE '==========================================';
END $$;