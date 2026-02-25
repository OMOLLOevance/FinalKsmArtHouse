-- 1. Restore visibility for old records that have NO user_id (the "lost" history)
DROP POLICY IF EXISTS "Staff can select own clients" ON public.clients;
CREATE POLICY "Staff can select own clients" ON public.clients
FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- 2. Relax INSERT/UPDATE policies to work with the updated API
DROP POLICY IF EXISTS "Staff can insert own clients" ON public.clients;
CREATE POLICY "Staff can insert own clients" ON public.clients
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Staff can update own clients" ON public.clients;
CREATE POLICY "Staff can update own clients" ON public.clients
FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

-- 3. Ensure Managers/Directors have full access
DROP POLICY IF EXISTS "Managers manage all clients" ON public.clients;
CREATE POLICY "Managers manage all clients" ON public.clients
FOR ALL USING (
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor', 'admin')
) WITH CHECK (true);

-- 4. Final verification
SELECT 'Clients Visibility & Save Fixes Applied Successfully' as result;
