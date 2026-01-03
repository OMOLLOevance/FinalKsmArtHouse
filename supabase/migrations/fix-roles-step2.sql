-- Step 5: Create helper function
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.users WHERE id = user_uuid;
  RETURN COALESCE(user_role, 'staff');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Drop existing policies
DROP POLICY IF EXISTS "Users can manage own gym finances" ON public.gym_finances;
DROP POLICY IF EXISTS "Users can manage own restaurant sales" ON public.restaurant_sales;
DROP POLICY IF EXISTS "Users can manage own sauna finances" ON public.sauna_spa_finances;
DROP POLICY IF EXISTS "Users can manage own sauna bookings" ON public.sauna_bookings;

-- Step 7: Create RBAC policies for gym_finances
CREATE POLICY "Staff can create gym finances" ON public.gym_finances
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff can read own gym finances" ON public.gym_finances
  FOR SELECT USING (
    auth.uid() = user_id OR 
    get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')
  );

CREATE POLICY "Only directors can delete gym finances" ON public.gym_finances
  FOR DELETE USING (
    get_user_role(auth.uid()) IN ('director', 'investor')
  );

-- Step 8: Create RBAC policies for restaurant_sales
CREATE POLICY "Staff can create restaurant sales" ON public.restaurant_sales
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff can read own restaurant sales" ON public.restaurant_sales
  FOR SELECT USING (
    auth.uid() = user_id OR 
    get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')
  );

CREATE POLICY "Only directors can delete restaurant sales" ON public.restaurant_sales
  FOR DELETE USING (
    get_user_role(auth.uid()) IN ('director', 'investor')
  );

-- Step 9: Create RBAC policies for sauna_bookings
CREATE POLICY "Staff can create sauna bookings" ON public.sauna_bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff can read own sauna bookings" ON public.sauna_bookings
  FOR SELECT USING (
    auth.uid() = user_id OR 
    get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')
  );

CREATE POLICY "Only directors can delete sauna bookings" ON public.sauna_bookings
  FOR DELETE USING (
    get_user_role(auth.uid()) IN ('director', 'investor')
  );

-- Step 10: Grant permissions
GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO authenticated;