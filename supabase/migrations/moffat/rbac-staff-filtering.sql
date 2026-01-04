-- Migration: RBAC Staff Filtering and Attribution
-- Purpose: Enable Managers/Directors to filter by staff, ensure attribution, and fix RLS.

BEGIN;

-- 1. Update public.users policies to allow Manager/Director visibility
DROP POLICY IF EXISTS "Managers and Directors can view all profiles" ON public.users;

CREATE POLICY "Managers and Directors can view all profiles" ON public.users
  FOR SELECT USING (
    get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')
  );

-- 2. Update Transaction Tables to reference public.users (enabling Joins)
-- We switch the FK from auth.users to public.users to allow joining profile data.
-- public.users already references auth.users with ON DELETE CASCADE, so cascading deletes are preserved.

-- Helper function to safely update FK
CREATE OR REPLACE FUNCTION update_fk_to_public_users(table_name text, constraint_name text)
RETURNS void AS $$
BEGIN
    -- Drop existing constraint if it exists
    EXECUTE 'ALTER TABLE public.' || table_name || ' DROP CONSTRAINT IF EXISTS ' || constraint_name;
    
    -- Add new constraint referencing public.users
    EXECUTE 'ALTER TABLE public.' || table_name || ' ADD CONSTRAINT ' || constraint_name || 
            ' FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE';
END;
$$ LANGUAGE plpgsql;

-- Apply to Restaurant
SELECT update_fk_to_public_users('restaurant_sales', 'restaurant_sales_user_id_fkey');

-- Apply to Gym
SELECT update_fk_to_public_users('gym_finances', 'gym_finances_user_id_fkey');
SELECT update_fk_to_public_users('gym_members', 'gym_members_user_id_fkey');

-- Apply to Sauna
SELECT update_fk_to_public_users('sauna_spa_finances', 'sauna_spa_finances_user_id_fkey');
SELECT update_fk_to_public_users('sauna_bookings', 'sauna_bookings_user_id_fkey');

-- Apply to Catering/Inventory
SELECT update_fk_to_public_users('catering_inventory', 'catering_inventory_user_id_fkey');
SELECT update_fk_to_public_users('catering_items', 'catering_items_user_id_fkey');

-- Apply to Events
SELECT update_fk_to_public_users('event_items', 'event_items_user_id_fkey');

-- Apply to Customers
SELECT update_fk_to_public_users('customers', 'customers_user_id_fkey');


-- 3. Ensure RLS Policies for SELECT allow Managers/Directors to see ALL records
-- (Re-enforcing rbac-enforcement.sql logic but double checking)

-- Gym Finances
DROP POLICY IF EXISTS "Staff can read own gym finances" ON public.gym_finances;
CREATE POLICY "Staff can read own gym finances" ON public.gym_finances
  FOR SELECT USING (
    auth.uid() = user_id OR 
    get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')
  );

-- Restaurant Sales
DROP POLICY IF EXISTS "Staff can read own restaurant sales" ON public.restaurant_sales;
CREATE POLICY "Staff can read own restaurant sales" ON public.restaurant_sales
  FOR SELECT USING (
    auth.uid() = user_id OR 
    get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')
  );

-- Sauna Finances
DROP POLICY IF EXISTS "Staff can read own sauna finances" ON public.sauna_spa_finances;
CREATE POLICY "Staff can read own sauna finances" ON public.sauna_spa_finances
  FOR SELECT USING (
    auth.uid() = user_id OR 
    get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')
  );

-- Event Items
DROP POLICY IF EXISTS "Staff can read own event items" ON public.event_items;
CREATE POLICY "Staff can read own event items" ON public.event_items
  FOR SELECT USING (
    auth.uid() = user_id OR 
    get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')
  );

-- Catering Inventory
DROP POLICY IF EXISTS "Staff can read own catering inventory" ON public.catering_inventory;
CREATE POLICY "Staff can read own catering inventory" ON public.catering_inventory
  FOR SELECT USING (
    auth.uid() = user_id OR 
    get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')
  );

-- Clean up helper
DROP FUNCTION update_fk_to_public_users;

COMMIT;
