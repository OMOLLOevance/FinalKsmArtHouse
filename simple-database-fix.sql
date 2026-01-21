-- =====================================================
-- SIMPLE DATABASE FIX FOR KSM.ART HOUSE
-- =====================================================

-- 1. DISABLE RLS ON ALL TABLES
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE gym_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE gym_finances DISABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE sauna_bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE catering_inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE quotations DISABLE ROW LEVEL SECURITY;

-- 2. GRANT PERMISSIONS
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 3. ENABLE SIMPLE RLS POLICIES
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations" ON users;
CREATE POLICY "Allow all operations" ON users FOR ALL USING (true);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations" ON customers;
CREATE POLICY "Allow all operations" ON customers FOR ALL USING (true);

ALTER TABLE gym_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations" ON gym_members;
CREATE POLICY "Allow all operations" ON gym_members FOR ALL USING (true);

ALTER TABLE gym_finances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations" ON gym_finances;
CREATE POLICY "Allow all operations" ON gym_finances FOR ALL USING (true);

ALTER TABLE restaurant_sales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations" ON restaurant_sales;
CREATE POLICY "Allow all operations" ON restaurant_sales FOR ALL USING (true);

ALTER TABLE sauna_bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations" ON sauna_bookings;
CREATE POLICY "Allow all operations" ON sauna_bookings FOR ALL USING (true);

ALTER TABLE catering_inventory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations" ON catering_inventory;
CREATE POLICY "Allow all operations" ON catering_inventory FOR ALL USING (true);

ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations" ON quotations;
CREATE POLICY "Allow all operations" ON quotations FOR ALL USING (true);

-- 4. FIX ID CONSTRAINTS AND CREATE TEST USER
-- Ensure all tables have proper UUID defaults
ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE customers ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE gym_members ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE gym_finances ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE restaurant_sales ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE sauna_bookings ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE quotations ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Make ID columns NOT NULL with defaults
ALTER TABLE users ALTER COLUMN id SET NOT NULL;
ALTER TABLE customers ALTER COLUMN id SET NOT NULL;
ALTER TABLE gym_members ALTER COLUMN id SET NOT NULL;

-- Create test user (will get auto-generated UUID)
DELETE FROM users WHERE email = 'test@ksmart.com';
INSERT INTO users (email, first_name, last_name, role)
VALUES ('test@ksmart.com', 'Test', 'User', 'staff');

SELECT 'DATABASE FIX COMPLETED - ALL TABLES NOW ACCESSIBLE' as status;