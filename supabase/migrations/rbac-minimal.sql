-- Just remove the constraint for now and proceed with RLS policies
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- Create helper function
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.users WHERE id = user_uuid;
  RETURN COALESCE(user_role, 'staff');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage own gym finances" ON public.gym_finances;
DROP POLICY IF EXISTS "Users can manage own restaurant sales" ON public.restaurant_sales;
DROP POLICY IF EXISTS "Users can manage own sauna bookings" ON public.sauna_bookings;

-- Create minimal RBAC policies
CREATE POLICY "RBAC gym finances" ON public.gym_finances FOR ALL USING (
  auth.uid() = user_id OR get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')
) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "RBAC restaurant sales" ON public.restaurant_sales FOR ALL USING (
  auth.uid() = user_id OR get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')
) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "RBAC sauna bookings" ON public.sauna_bookings FOR ALL USING (
  auth.uid() = user_id OR get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')
) WITH CHECK (auth.uid() = user_id);

-- Delete policies (only directors/investors)
CREATE POLICY "Delete gym finances" ON public.gym_finances FOR DELETE USING (
  get_user_role(auth.uid()) IN ('director', 'investor')
);

CREATE POLICY "Delete restaurant sales" ON public.restaurant_sales FOR DELETE USING (
  get_user_role(auth.uid()) IN ('director', 'investor')
);

CREATE POLICY "Delete sauna bookings" ON public.sauna_bookings FOR DELETE USING (
  get_user_role(auth.uid()) IN ('director', 'investor')
);

GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO authenticated;