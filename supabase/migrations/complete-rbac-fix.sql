-- COMPLETE RBAC FIX
-- Run this entire script in Supabase SQL Editor

-- 1. Check what's actually in the database
SELECT id, email, role FROM public.users;

-- 2. Drop constraint completely first
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- 3. Clean up all roles systematically
UPDATE public.users SET role = 'staff' WHERE role IS NULL;
UPDATE public.users SET role = 'operations_manager' WHERE role = 'admin';
UPDATE public.users SET role = 'operations_manager' WHERE role = 'manager';
UPDATE public.users SET role = 'director' WHERE role = 'director';
UPDATE public.users SET role = 'staff' WHERE role = 'staff';

-- 4. Handle any edge cases
UPDATE public.users SET role = 'staff' WHERE role NOT IN ('staff', 'operations_manager', 'director', 'investor');

-- 5. Now add the constraint back
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('staff', 'operations_manager', 'director', 'investor'));

-- 6. Create helper function
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.users WHERE id = user_uuid;
  RETURN COALESCE(user_role, 'staff');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Drop ALL existing policies
DROP POLICY IF EXISTS "Users can manage own gym finances" ON public.gym_finances;
DROP POLICY IF EXISTS "Users can manage own restaurant sales" ON public.restaurant_sales;
DROP POLICY IF EXISTS "Users can manage own sauna finances" ON public.sauna_spa_finances;
DROP POLICY IF EXISTS "Users can manage own sauna bookings" ON public.sauna_bookings;
DROP POLICY IF EXISTS "Users can manage own gym members" ON public.gym_members;
DROP POLICY IF EXISTS "Users can manage own customers" ON public.customers;

-- 8. Create RBAC policies for gym_finances
CREATE POLICY "gym_finances_insert" ON public.gym_finances
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "gym_finances_select" ON public.gym_finances
  FOR SELECT USING (
    auth.uid() = user_id OR 
    get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')
  );

CREATE POLICY "gym_finances_update" ON public.gym_finances
  FOR UPDATE USING (false);

CREATE POLICY "gym_finances_delete" ON public.gym_finances
  FOR DELETE USING (
    get_user_role(auth.uid()) IN ('director', 'investor')
  );

-- 9. Create RBAC policies for restaurant_sales
CREATE POLICY "restaurant_sales_insert" ON public.restaurant_sales
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "restaurant_sales_select" ON public.restaurant_sales
  FOR SELECT USING (
    auth.uid() = user_id OR 
    get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')
  );

CREATE POLICY "restaurant_sales_update" ON public.restaurant_sales
  FOR UPDATE USING (false);

CREATE POLICY "restaurant_sales_delete" ON public.restaurant_sales
  FOR DELETE USING (
    get_user_role(auth.uid()) IN ('director', 'investor')
  );

-- 10. Create RBAC policies for sauna_bookings
CREATE POLICY "sauna_bookings_insert" ON public.sauna_bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sauna_bookings_select" ON public.sauna_bookings
  FOR SELECT USING (
    auth.uid() = user_id OR 
    get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')
  );

CREATE POLICY "sauna_bookings_update" ON public.sauna_bookings
  FOR UPDATE USING (false);

CREATE POLICY "sauna_bookings_delete" ON public.sauna_bookings
  FOR DELETE USING (
    get_user_role(auth.uid()) IN ('director', 'investor')
  );

-- 11. Handle sauna_spa_finances if it exists
CREATE POLICY "sauna_spa_finances_insert" ON public.sauna_spa_finances
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sauna_spa_finances_select" ON public.sauna_spa_finances
  FOR SELECT USING (
    auth.uid() = user_id OR 
    get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')
  );

CREATE POLICY "sauna_spa_finances_update" ON public.sauna_spa_finances
  FOR UPDATE USING (false);

CREATE POLICY "sauna_spa_finances_delete" ON public.sauna_spa_finances
  FOR DELETE USING (
    get_user_role(auth.uid()) IN ('director', 'investor')
  );

-- 12. Keep existing policies for non-transaction tables
CREATE POLICY "gym_members_all" ON public.gym_members
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "customers_all" ON public.customers
  FOR ALL USING (auth.uid() = user_id);

-- 13. Grant permissions
GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO authenticated;

-- 14. Verify everything worked
SELECT 'RBAC Implementation Complete' as status;
SELECT role, COUNT(*) as count FROM public.users GROUP BY role ORDER BY role;