-- GLOBAL USERS RBAC MIGRATION - FINAL
-- Date: 2026-02-24
-- Purpose: Ensure admins and managers can view all user profiles while users can only update their own.

-- 1. Ensure RLS is enabled on public.users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Clean up any conflicting policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Managers can view all profiles" ON public.users;
DROP POLICY IF EXISTS "RBAC read users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- 3. Create SELECT policy:
-- Allows users to see their own profile
-- Allows admins, operations_managers, directors, and investors to see ALL profiles
CREATE POLICY "RBAC read users" ON public.users
FOR SELECT USING (
  auth.uid() = id OR 
  get_user_role(auth.uid()) IN ('admin', 'operations_manager', 'director', 'investor')
);

-- 4. Create UPDATE policy:
-- Users can only update their own profile information
CREATE POLICY "Users can update own profile" ON public.users
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 5. Final validation of role constraint
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
