-- Migration: RBAC Staff Filtering for Monthly Allocations
-- Purpose: Extend RBAC to monthly_allocations and enable staff filtering.

BEGIN;

-- 1. Update public.monthly_allocations FK to point to public.users
ALTER TABLE public.monthly_allocations DROP CONSTRAINT IF EXISTS monthly_allocations_user_id_fkey;
ALTER TABLE public.monthly_allocations ADD CONSTRAINT monthly_allocations_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 2. Update RLS policies for monthly_allocations
DROP POLICY IF EXISTS "Users can view their own allocations" ON public.monthly_allocations;
DROP POLICY IF EXISTS "Users can manage own monthly allocations" ON public.monthly_allocations;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.monthly_allocations;
DROP POLICY IF EXISTS "Manage own monthly allocations" ON public.monthly_allocations;

-- SELECT: Staff can see own, Managers/Directors can see all
CREATE POLICY "RBAC Select monthly_allocations" ON public.monthly_allocations
  FOR SELECT USING (
    auth.uid() = user_id OR 
    get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')
  );

-- INSERT: Anyone authenticated can insert (usually staff or managers)
CREATE POLICY "RBAC Insert monthly_allocations" ON public.monthly_allocations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE: Staff can update own, Managers/Directors can update all
CREATE POLICY "RBAC Update monthly_allocations" ON public.monthly_allocations
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor')
  );

-- DELETE: Only Directors and Investors can delete
CREATE POLICY "RBAC Delete monthly_allocations" ON public.monthly_allocations
  FOR DELETE USING (
    get_user_role(auth.uid()) IN ('director', 'investor')
  );

COMMIT;
