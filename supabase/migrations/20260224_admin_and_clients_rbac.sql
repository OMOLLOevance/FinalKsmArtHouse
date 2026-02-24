-- GLOBAL RBAC ENFORCEMENT MIGRATION (PART 2 - ADMIN ROLE & CLIENTS)
-- This script adds the 'admin' role to all relevant policies and handles the 'clients' table.

---------------------------------------------------------
-- 1. Ensure 'admin' is in the users_role_check constraint
---------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE table_name = 'users' AND column_name = 'role' AND constraint_name = 'users_role_check'
    ) THEN
        ALTER TABLE public.users DROP CONSTRAINT users_role_check;
    END IF;
    
    ALTER TABLE public.users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('staff', 'operations_manager', 'director', 'investor', 'admin'));
END $$;

---------------------------------------------------------
-- 2. CLIENTS Table RBAC & RLS
---------------------------------------------------------
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "RBAC read clients" ON public.clients;
CREATE POLICY "RBAC read clients" ON public.clients
FOR SELECT USING (
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor', 'admin')
);

DROP POLICY IF EXISTS "RBAC manage clients" ON public.clients;
CREATE POLICY "RBAC manage clients" ON public.clients
FOR ALL USING (
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor', 'admin')
) WITH CHECK (
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor', 'admin')
);

---------------------------------------------------------
-- 3. Update Existing Policies to include 'admin'
---------------------------------------------------------

-- CUSTOMERS
DROP POLICY IF EXISTS "RBAC read customers" ON public.customers;
CREATE POLICY "RBAC read customers" ON public.customers
FOR SELECT USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor', 'admin')
);

DROP POLICY IF EXISTS "RBAC manage customers" ON public.customers;
CREATE POLICY "RBAC manage customers" ON public.customers
FOR ALL USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor', 'admin')
) WITH CHECK (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor', 'admin')
);

-- DECOR INVENTORY
DROP POLICY IF EXISTS "RBAC read decor inventory" ON public.decor_inventory;
CREATE POLICY "RBAC read decor inventory" ON public.decor_inventory
FOR SELECT USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor', 'admin')
);

DROP POLICY IF EXISTS "RBAC manage decor inventory" ON public.decor_inventory;
CREATE POLICY "RBAC manage decor inventory" ON public.decor_inventory
FOR ALL USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor', 'admin')
) WITH CHECK (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor', 'admin')
);

-- USERS
DROP POLICY IF EXISTS "RBAC read users" ON public.users;
CREATE POLICY "RBAC read users" ON public.users
FOR SELECT USING (
  auth.uid() = id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor', 'admin')
);

-- SAUNA BOOKINGS
DROP POLICY IF EXISTS "RBAC read sauna bookings" ON public.sauna_bookings;
CREATE POLICY "RBAC read sauna bookings" ON public.sauna_bookings
FOR SELECT USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor', 'admin')
);

DROP POLICY IF EXISTS "RBAC manage sauna bookings" ON public.sauna_bookings;
CREATE POLICY "RBAC manage sauna bookings" ON public.sauna_bookings
FOR ALL USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor', 'admin')
) WITH CHECK (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor', 'admin')
);

-- RESTAURANT SALES
DROP POLICY IF EXISTS "RBAC read restaurant sales" ON public.restaurant_sales;
CREATE POLICY "RBAC read restaurant sales" ON public.restaurant_sales
FOR SELECT USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor', 'admin')
);

DROP POLICY IF EXISTS "RBAC manage restaurant sales" ON public.restaurant_sales;
CREATE POLICY "RBAC manage restaurant sales" ON public.restaurant_sales
FOR ALL USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor', 'admin')
) WITH CHECK (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor', 'admin')
);

-- GYM MEMBERS
DROP POLICY IF EXISTS "RBAC read gym members" ON public.gym_members;
CREATE POLICY "RBAC read gym members" ON public.gym_members
FOR SELECT USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor', 'admin')
);

DROP POLICY IF EXISTS "RBAC manage gym members" ON public.gym_members;
CREATE POLICY "RBAC manage gym members" ON public.gym_members
FOR ALL USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor', 'admin')
) WITH CHECK (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor', 'admin')
);

-- GYM FINANCES
DROP POLICY IF EXISTS "RBAC read gym finances" ON public.gym_finances;
CREATE POLICY "RBAC read gym finances" ON public.gym_finances
FOR SELECT USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor', 'admin')
);

DROP POLICY IF EXISTS "RBAC manage gym finances" ON public.gym_finances;
CREATE POLICY "RBAC manage gym finances" ON public.gym_finances
FOR ALL USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor', 'admin')
) WITH CHECK (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor', 'admin')
);
