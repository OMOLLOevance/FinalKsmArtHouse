-- Fix RBAC for Decor Inventory and ensure get_user_role exists

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

-- 2. Drop restrictive policies on decor_inventory
DROP POLICY IF EXISTS "Manage own decor inventory" ON public.decor_inventory;
DROP POLICY IF EXISTS "Robust manage own decor_inventory" ON public.decor_inventory;
DROP POLICY IF EXISTS "RBAC read decor inventory" ON public.decor_inventory;
DROP POLICY IF EXISTS "RBAC insert decor inventory" ON public.decor_inventory;
DROP POLICY IF EXISTS "RBAC update decor inventory" ON public.decor_inventory;
DROP POLICY IF EXISTS "RBAC delete decor inventory" ON public.decor_inventory;

-- 3. Enable RLS (just in case)
ALTER TABLE public.decor_inventory ENABLE ROW LEVEL SECURITY;

-- 4. Create comprehensive RBAC policies

-- READ: Own items OR if you are management
CREATE POLICY "RBAC read decor inventory" ON public.decor_inventory
FOR SELECT USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')
);

-- INSERT: Create items as yourself
CREATE POLICY "RBAC insert decor inventory" ON public.decor_inventory
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE: Own items OR if you are management
CREATE POLICY "RBAC update decor inventory" ON public.decor_inventory
FOR UPDATE USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')
);

-- DELETE: Own items OR if you are director/investor
CREATE POLICY "RBAC delete decor inventory" ON public.decor_inventory
FOR DELETE USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) IN ('director', 'investor')
);
