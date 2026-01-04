-- GLOBAL RBAC ENFORCEMENT MIGRATION
-- This script ensures Directors, Investors, and Operations Managers can see ALL data
-- across all departments, while standard staff are restricted to their own.

-- 1. Ensure helper function exists
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.users WHERE id = user_uuid;
  RETURN COALESCE(user_role, 'staff');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO authenticated;

-- 2. Define a macro-like approach for creating RBAC policies
-- Since we can't easily loop over tables in standard SQL for policies, 
-- we will explicitly define them for core tables.

-- List of tables: 
-- customers, monthly_allocations, gym_members, sauna_bookings, 
-- decor_inventory, gym_finances, restaurant_sales, catering_inventory

---------------------------------------------------------
-- CUSTOMERS
---------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own data" ON public.customers;
DROP POLICY IF EXISTS "Users can manage own customers" ON public.customers;
DROP POLICY IF EXISTS "customers_all" ON public.customers;
DROP POLICY IF EXISTS "RBAC read customers" ON public.customers;

CREATE POLICY "RBAC read customers" ON public.customers
FOR SELECT USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')
);

CREATE POLICY "RBAC manage customers" ON public.customers
FOR ALL USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')
) WITH CHECK (auth.uid() = user_id OR get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor'));

---------------------------------------------------------
-- MONTHLY ALLOCATIONS
---------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own allocations" ON public.monthly_allocations;
DROP POLICY IF EXISTS "Manage own monthly allocations" ON public.monthly_allocations;
DROP POLICY IF EXISTS "RBAC Select monthly_allocations" ON public.monthly_allocations;

CREATE POLICY "RBAC read allocations" ON public.monthly_allocations
FOR SELECT USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')
);

CREATE POLICY "RBAC manage allocations" ON public.monthly_allocations
FOR ALL USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')
) WITH CHECK (auth.uid() = user_id OR get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor'));

---------------------------------------------------------
-- GYM MEMBERS
---------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own gym members" ON public.gym_members;
DROP POLICY IF EXISTS "Manage own gym members" ON public.gym_members;
DROP POLICY IF EXISTS "gym_members_all" ON public.gym_members;

CREATE POLICY "RBAC read gym members" ON public.gym_members
FOR SELECT USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')
);

CREATE POLICY "RBAC manage gym members" ON public.gym_members
FOR ALL USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')
) WITH CHECK (auth.uid() = user_id OR get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor'));

---------------------------------------------------------
-- SAUNA BOOKINGS
---------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own sauna bookings" ON public.sauna_bookings;
DROP POLICY IF EXISTS "Manage own sauna bookings" ON public.sauna_bookings;
DROP POLICY IF EXISTS "sauna_bookings_select" ON public.sauna_bookings;

CREATE POLICY "RBAC read sauna bookings" ON public.sauna_bookings
FOR SELECT USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')
);

CREATE POLICY "RBAC manage sauna bookings" ON public.sauna_bookings
FOR ALL USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')
) WITH CHECK (auth.uid() = user_id OR get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor'));

---------------------------------------------------------
-- GYM FINANCES
---------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own gym finances" ON public.gym_finances;
DROP POLICY IF EXISTS "Manage own gym finances" ON public.gym_finances;
DROP POLICY IF EXISTS "Staff can read own gym finances" ON public.gym_finances;

CREATE POLICY "RBAC read gym finances" ON public.gym_finances
FOR SELECT USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')
);

CREATE POLICY "RBAC manage gym finances" ON public.gym_finances
FOR ALL USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')
) WITH CHECK (auth.uid() = user_id OR get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor'));

---------------------------------------------------------
-- RESTAURANT SALES
---------------------------------------------------------
DROP POLICY IF EXISTS "Users can manage own restaurant sales" ON public.restaurant_sales;
DROP POLICY IF EXISTS "RBAC restaurant sales" ON public.restaurant_sales;

CREATE POLICY "RBAC read restaurant sales" ON public.restaurant_sales
FOR SELECT USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')
);

CREATE POLICY "RBAC manage restaurant sales" ON public.restaurant_sales
FOR ALL USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')
) WITH CHECK (auth.uid() = user_id OR get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor'));

---------------------------------------------------------
-- DECOR INVENTORY (Re-apply for safety)
---------------------------------------------------------
DROP POLICY IF EXISTS "RBAC read decor inventory" ON public.decor_inventory;
DROP POLICY IF EXISTS "RBAC manage decor inventory" ON public.decor_inventory;

CREATE POLICY "RBAC read decor inventory" ON public.decor_inventory
FOR SELECT USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')
);

CREATE POLICY "RBAC manage decor inventory" ON public.decor_inventory
FOR ALL USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')
) WITH CHECK (auth.uid() = user_id OR get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor'));
