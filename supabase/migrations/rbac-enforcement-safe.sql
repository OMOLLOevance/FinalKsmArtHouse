-- RBAC Enforcement Migration - Safe Version
-- Execute this in Supabase SQL Editor

-- 1. First, check what roles currently exist
SELECT DISTINCT role, COUNT(*) as count 
FROM public.users 
WHERE role IS NOT NULL 
GROUP BY role;

-- 2. Update existing roles to match RBAC requirements
UPDATE public.users 
SET role = CASE 
  WHEN role = 'admin' THEN 'director'
  WHEN role = 'manager' THEN 'operations_manager'
  WHEN role = 'staff' THEN 'staff'
  WHEN role = 'director' THEN 'director'
  WHEN role IS NULL THEN 'staff'
  ELSE 'staff'  -- Default fallback for any other roles
END;

-- 3. Now safely update the role constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('staff', 'operations_manager', 'director', 'investor'));

-- 4. Create helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.users WHERE id = user_uuid;
  RETURN COALESCE(user_role, 'staff');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Drop existing RLS policies for transaction tables
DROP POLICY IF EXISTS "Users can manage own gym finances" ON public.gym_finances;
DROP POLICY IF EXISTS "Users can manage own restaurant sales" ON public.restaurant_sales;
DROP POLICY IF EXISTS "Users can manage own sauna finances" ON public.sauna_spa_finances;

-- 6. Create RBAC-compliant RLS policies for gym_finances
CREATE POLICY "Staff can create gym finances" ON public.gym_finances
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff can read own gym finances" ON public.gym_finances
  FOR SELECT USING (
    auth.uid() = user_id OR 
    get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')
  );

CREATE POLICY "Staff cannot update gym finances" ON public.gym_finances
  FOR UPDATE USING (false);

CREATE POLICY "Only directors can delete gym finances" ON public.gym_finances
  FOR DELETE USING (
    get_user_role(auth.uid()) IN ('director', 'investor')
  );

-- 7. Create RBAC-compliant RLS policies for restaurant_sales
CREATE POLICY "Staff can create restaurant sales" ON public.restaurant_sales
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff can read own restaurant sales" ON public.restaurant_sales
  FOR SELECT USING (
    auth.uid() = user_id OR 
    get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')
  );

CREATE POLICY "Staff cannot update restaurant sales" ON public.restaurant_sales
  FOR UPDATE USING (false);

CREATE POLICY "Only directors can delete restaurant sales" ON public.restaurant_sales
  FOR DELETE USING (
    get_user_role(auth.uid()) IN ('director', 'investor')
  );

-- 8. Create RBAC-compliant RLS policies for sauna_spa_finances
CREATE POLICY "Staff can create sauna finances" ON public.sauna_spa_finances
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff can read own sauna finances" ON public.sauna_spa_finances
  FOR SELECT USING (
    auth.uid() = user_id OR 
    get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')
  );

CREATE POLICY "Staff cannot update sauna finances" ON public.sauna_spa_finances
  FOR UPDATE USING (false);

CREATE POLICY "Only directors can delete sauna finances" ON public.sauna_spa_finances
  FOR DELETE USING (
    get_user_role(auth.uid()) IN ('director', 'investor')
  );

-- 9. Also need to handle sauna_bookings table (which is used for transactions)
DROP POLICY IF EXISTS "Users can manage own sauna bookings" ON public.sauna_bookings;

CREATE POLICY "Staff can create sauna bookings" ON public.sauna_bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff can read own sauna bookings" ON public.sauna_bookings
  FOR SELECT USING (
    auth.uid() = user_id OR 
    get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')
  );

CREATE POLICY "Staff cannot update sauna bookings" ON public.sauna_bookings
  FOR UPDATE USING (false);

CREATE POLICY "Only directors can delete sauna bookings" ON public.sauna_bookings
  FOR DELETE USING (
    get_user_role(auth.uid()) IN ('director', 'investor')
  );

-- 10. Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO authenticated;

-- 11. Verify the migration worked
SELECT 'Migration completed successfully. Current role distribution:' as status;
SELECT role, COUNT(*) as count FROM public.users GROUP BY role ORDER BY role;