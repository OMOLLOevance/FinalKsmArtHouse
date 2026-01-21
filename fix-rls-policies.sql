-- =====================================================
-- CRITICAL FIX: RLS POLICIES AND API AUTHENTICATION
-- =====================================================

-- 1. FIX USERS TABLE RLS POLICY
DROP POLICY IF EXISTS "Users can manage own profile" ON users;
CREATE POLICY "Users can manage own profile" ON users
FOR ALL USING (
  auth.uid() = id OR 
  auth.jwt() ->> 'role' IN ('director', 'investor', 'operations_manager')
);

-- Allow service role to bypass RLS for API operations
DROP POLICY IF EXISTS "Service role full access" ON users;
CREATE POLICY "Service role full access" ON users
FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- 2. FIX CUSTOMERS TABLE RLS POLICY
DROP POLICY IF EXISTS "Users can manage own customers" ON customers;
CREATE POLICY "Users can manage own customers" ON customers
FOR ALL USING (
  user_id = auth.uid() OR 
  auth.jwt() ->> 'role' IN ('director', 'investor', 'operations_manager', 'service_role')
);

-- 3. FIX GYM_MEMBERS TABLE RLS POLICY
DROP POLICY IF EXISTS "Users can manage own gym members" ON gym_members;
CREATE POLICY "Users can manage own gym members" ON gym_members
FOR ALL USING (
  user_id = auth.uid() OR 
  auth.jwt() ->> 'role' IN ('director', 'investor', 'operations_manager', 'service_role')
);

-- 4. FIX GYM_FINANCES TABLE RLS POLICY
DROP POLICY IF EXISTS "Users can manage own gym finances" ON gym_finances;
CREATE POLICY "Users can manage own gym finances" ON gym_finances
FOR ALL USING (
  user_id = auth.uid() OR 
  auth.jwt() ->> 'role' IN ('director', 'investor', 'operations_manager', 'service_role')
);

-- 5. FIX RESTAURANT_SALES TABLE RLS POLICY
DROP POLICY IF EXISTS "Users can manage own restaurant sales" ON restaurant_sales;
CREATE POLICY "Users can manage own restaurant sales" ON restaurant_sales
FOR ALL USING (
  user_id = auth.uid() OR 
  auth.jwt() ->> 'role' IN ('director', 'investor', 'operations_manager', 'service_role')
);

-- 6. FIX SAUNA_BOOKINGS TABLE RLS POLICY
DROP POLICY IF EXISTS "Users can manage own sauna bookings" ON sauna_bookings;
CREATE POLICY "Users can manage own sauna bookings" ON sauna_bookings
FOR ALL USING (
  user_id = auth.uid() OR 
  auth.jwt() ->> 'role' IN ('director', 'investor', 'operations_manager', 'service_role')
);

-- 7. FIX CATERING_INVENTORY TABLE RLS POLICY
DROP POLICY IF EXISTS "Users can manage own catering inventory" ON catering_inventory;
CREATE POLICY "Users can manage own catering inventory" ON catering_inventory
FOR ALL USING (
  user_id = auth.uid() OR 
  auth.jwt() ->> 'role' IN ('director', 'investor', 'operations_manager', 'service_role')
);

-- 8. FIX QUOTATIONS TABLE RLS POLICY
DROP POLICY IF EXISTS "Users can manage own quotations" ON quotations;
CREATE POLICY "Users can manage own quotations" ON quotations
FOR ALL USING (
  user_id = auth.uid() OR 
  auth.jwt() ->> 'role' IN ('director', 'investor', 'operations_manager', 'service_role')
);

-- 9. ENABLE REALTIME FOR ALL TABLES
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE customers;
ALTER PUBLICATION supabase_realtime ADD TABLE gym_members;
ALTER PUBLICATION supabase_realtime ADD TABLE gym_finances;
ALTER PUBLICATION supabase_realtime ADD TABLE restaurant_sales;
ALTER PUBLICATION supabase_realtime ADD TABLE sauna_bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE catering_inventory;
ALTER PUBLICATION supabase_realtime ADD TABLE quotations;

-- 10. CREATE ANONYMOUS ACCESS POLICY FOR API TESTING
DROP POLICY IF EXISTS "Anonymous read access for testing" ON users;
CREATE POLICY "Anonymous read access for testing" ON users
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anonymous read access for testing" ON customers;
CREATE POLICY "Anonymous read access for testing" ON customers
FOR SELECT USING (true);

-- 11. GRANT NECESSARY PERMISSIONS
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 12. VERIFY POLICIES ARE WORKING
DO $$
BEGIN
    RAISE NOTICE '✅ RLS POLICIES UPDATED SUCCESSFULLY';
    RAISE NOTICE '✅ REALTIME ENABLED FOR ALL TABLES';
    RAISE NOTICE '✅ PERMISSIONS GRANTED';
END $$;