-- KSM ART HOUSE: GLOBAL RBAC MANAGEMENT FIX
-- Location: supabase/migrations/moffat/global_rbac_fix_management.sql
-- Purpose: Grants Directors, Investors, and Operations Managers full visibility across all departments.

-- 1. SECURE ROLE HELPER FUNCTION
-- This function allows the database to identify if a user is management.
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

-- 2. UNIVERSAL READ ACCESS FOR MANAGEMENT
-- Standard staff can only see their own records (auth.uid() = user_id).
-- Management can see EVERYTHING.

---------------------------------------------------------
-- CORE CUSTOMERS
---------------------------------------------------------
DROP POLICY IF EXISTS "RBAC read customers" ON public.customers;
CREATE POLICY "RBAC read customers" ON public.customers
FOR SELECT USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')
);

---------------------------------------------------------
-- MONTHLY ALLOCATIONS (Tents, Chairs, Tables)
---------------------------------------------------------
DROP POLICY IF EXISTS "RBAC read allocations" ON public.monthly_allocations;
CREATE POLICY "RBAC read allocations" ON public.monthly_allocations
FOR SELECT USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')
);

---------------------------------------------------------
-- DECOR SETUP ALLOCATIONS
---------------------------------------------------------
DROP POLICY IF EXISTS "RBAC read decor allocations" ON public.decor_allocations;
CREATE POLICY "RBAC read decor allocations" ON public.decor_allocations
FOR SELECT USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')
);

---------------------------------------------------------
-- GYM MEMBERS
---------------------------------------------------------
DROP POLICY IF EXISTS "RBAC read gym members" ON public.gym_members;
CREATE POLICY "RBAC read gym members" ON public.gym_members
FOR SELECT USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')
);

---------------------------------------------------------
-- SAUNA BOOKINGS
---------------------------------------------------------
DROP POLICY IF EXISTS "RBAC read sauna bookings" ON public.sauna_bookings;
CREATE POLICY "RBAC read sauna bookings" ON public.sauna_bookings
FOR SELECT USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')
);

---------------------------------------------------------
-- QUOTATIONS
---------------------------------------------------------
DROP POLICY IF EXISTS "RBAC read quotations" ON public.quotations;
CREATE POLICY "RBAC read quotations" ON public.quotations
FOR SELECT USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')
);

---------------------------------------------------------
-- DECOR INVENTORY
---------------------------------------------------------
DROP POLICY IF EXISTS "RBAC read decor inventory" ON public.decor_inventory;
CREATE POLICY "RBAC read decor inventory" ON public.decor_inventory
FOR SELECT USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')
);

---------------------------------------------------------
-- GYM FINANCES
---------------------------------------------------------
DROP POLICY IF EXISTS "RBAC read gym finances" ON public.gym_finances;
CREATE POLICY "RBAC read gym finances" ON public.gym_finances
FOR SELECT USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')
);

---------------------------------------------------------
-- RESTAURANT SALES
---------------------------------------------------------
DROP POLICY IF EXISTS "RBAC read restaurant sales" ON public.restaurant_sales;
CREATE POLICY "RBAC read restaurant sales" ON public.restaurant_sales
FOR SELECT USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')
);

---------------------------------------------------------
-- CATERING INVENTORY
---------------------------------------------------------
DROP POLICY IF EXISTS "RBAC read catering inventory" ON public.catering_inventory;
CREATE POLICY "RBAC read catering inventory" ON public.catering_inventory
FOR SELECT USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')
);
