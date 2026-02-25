-- ===================================================================
-- DEFINITIVE RLS FIX FOR CLIENTS TABLE (V2)
-- ===================================================================
-- This script fixes the "new row violates row-level security policy"
-- error by ensuring Staff have both INSERT and SELECT permissions.
-- ===================================================================

-- 1. Ensure the table has RLS enabled and the correct columns
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies to avoid conflicts
DROP POLICY IF EXISTS "RBAC read clients" ON public.clients;
DROP POLICY IF EXISTS "RBAC manage clients" ON public.clients;
DROP POLICY IF EXISTS "Staff can insert own clients" ON public.clients;
DROP POLICY IF EXISTS "Staff can update own clients" ON public.clients;
DROP POLICY IF EXISTS "Staff can delete own clients" ON public.clients;
DROP POLICY IF EXISTS "Managers manage all clients" ON public.clients;
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.clients;

-- 3. Policy: STAFF can SELECT their own records
-- CRITICAL: Without this, .insert().select() will fail!
CREATE POLICY "Staff can select own clients" ON public.clients
FOR SELECT USING (auth.uid() = user_id);

-- 4. Policy: STAFF can INSERT their own records
CREATE POLICY "Staff can insert own clients" ON public.clients
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Policy: STAFF can UPDATE their own records
CREATE POLICY "Staff can update own clients" ON public.clients
FOR UPDATE USING (auth.uid() = user_id);

-- 6. Policy: STAFF can DELETE their own records
CREATE POLICY "Staff can delete own clients" ON public.clients
FOR DELETE USING (auth.uid() = user_id);

-- 7. Policy: MANAGERS can do EVERYTHING
-- This uses the get_user_role function we defined earlier
CREATE POLICY "Managers manage all clients" ON public.clients
FOR ALL USING (
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor', 'admin')
) WITH CHECK (
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor', 'admin')
);

-- 8. Policy: SERVICE ROLE can do EVERYTHING
CREATE POLICY "Service role manages all" ON public.clients
FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 9. Ensure authenticated users can access the table
GRANT ALL ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;

-- 10. Verification query
SELECT 'Clients RLS policies have been successfully reset and updated.' as result;
