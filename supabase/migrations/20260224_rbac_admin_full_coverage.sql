-- GLOBAL RBAC ENFORCEMENT MIGRATION (PART 3 - FULL ADMIN COVERAGE)
-- This script adds the 'admin' role to all remaining tables not covered in previous migrations.

---------------------------------------------------------
-- 1. QUOTATIONS
---------------------------------------------------------
DROP POLICY IF EXISTS "RBAC read quotations" ON public.quotations;
CREATE POLICY "RBAC read quotations" ON public.quotations
FOR SELECT USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor', 'admin')
);

DROP POLICY IF EXISTS "RBAC manage quotations" ON public.quotations;
CREATE POLICY "RBAC manage quotations" ON public.quotations
FOR ALL USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor', 'admin')
) WITH CHECK (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor', 'admin')
);

---------------------------------------------------------
-- 2. CUSTOMER REQUIREMENTS
---------------------------------------------------------
DROP POLICY IF EXISTS "RBAC read customer_requirements" ON public.customer_requirements;
CREATE POLICY "RBAC read customer_requirements" ON public.customer_requirements
FOR SELECT USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor', 'admin')
);

DROP POLICY IF EXISTS "RBAC manage customer_requirements" ON public.customer_requirements;
CREATE POLICY "RBAC manage customer_requirements" ON public.customer_requirements
FOR ALL USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor', 'admin')
) WITH CHECK (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor', 'admin')
);

---------------------------------------------------------
-- 3. CATERING INVENTORY
---------------------------------------------------------
DROP POLICY IF EXISTS "RBAC read catering_inventory" ON public.catering_inventory;
CREATE POLICY "RBAC read catering_inventory" ON public.catering_inventory
FOR SELECT USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor', 'admin')
);

DROP POLICY IF EXISTS "RBAC manage catering_inventory" ON public.catering_inventory;
CREATE POLICY "RBAC manage catering_inventory" ON public.catering_inventory
FOR ALL USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor', 'admin')
) WITH CHECK (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor', 'admin')
);

---------------------------------------------------------
-- 4. MONTHLY ALLOCATIONS
---------------------------------------------------------
DROP POLICY IF EXISTS "RBAC read allocations" ON public.monthly_allocations;
CREATE POLICY "RBAC read allocations" ON public.monthly_allocations
FOR SELECT USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor', 'admin')
);

DROP POLICY IF EXISTS "RBAC manage allocations" ON public.monthly_allocations;
CREATE POLICY "RBAC manage allocations" ON public.monthly_allocations
FOR ALL USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor', 'admin')
) WITH CHECK (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor', 'admin')
);

---------------------------------------------------------
-- 5. DECOR ALLOCATIONS
---------------------------------------------------------
DROP POLICY IF EXISTS "RBAC read decor_allocations" ON public.decor_allocations;
CREATE POLICY "RBAC read decor_allocations" ON public.decor_allocations
FOR SELECT USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor', 'admin')
);

DROP POLICY IF EXISTS "RBAC manage decor_allocations" ON public.decor_allocations;
CREATE POLICY "RBAC manage decor_allocations" ON public.decor_allocations
FOR ALL USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor', 'admin')
) WITH CHECK (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor', 'admin')
);

---------------------------------------------------------
-- 6. EVENT ITEMS
---------------------------------------------------------
DROP POLICY IF EXISTS "RBAC read event_items" ON public.event_items;
CREATE POLICY "RBAC read event_items" ON public.event_items
FOR SELECT USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor', 'admin')
);

DROP POLICY IF EXISTS "RBAC manage event_items" ON public.event_items;
CREATE POLICY "RBAC manage event_items" ON public.event_items
FOR ALL USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor', 'admin')
) WITH CHECK (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor', 'admin')
);

---------------------------------------------------------
-- 7. RESTAURANT MASTER ITEMS
---------------------------------------------------------
-- Master items are typically readable by everyone but manageable by admins
DROP POLICY IF EXISTS "RBAC read master items" ON public.restaurant_master_items;
CREATE POLICY "RBAC read master items" ON public.restaurant_master_items
FOR SELECT USING (true); -- Publicly readable for authenticated users

DROP POLICY IF EXISTS "RBAC manage master items" ON public.restaurant_master_items;
CREATE POLICY "RBAC manage master items" ON public.restaurant_master_items
FOR ALL USING (
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor', 'admin')
) WITH CHECK (
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor', 'admin')
);

---------------------------------------------------------
-- 8. PAYMENTS
---------------------------------------------------------
DROP POLICY IF EXISTS "RBAC read payments" ON public.payments;
CREATE POLICY "RBAC read payments" ON public.payments
FOR SELECT USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor', 'admin')
);

DROP POLICY IF EXISTS "RBAC manage payments" ON public.payments;
CREATE POLICY "RBAC manage payments" ON public.payments
FOR ALL USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor', 'admin')
) WITH CHECK (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor', 'admin')
);
