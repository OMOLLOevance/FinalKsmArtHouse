-- GLOBAL USERS RBAC MIGRATION
-- Date: 2026-02-24
-- Purpose: Enable RLS on users table and allow managers to view all profiles

-- 1. Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Managers can view all profiles" ON public.users;
DROP POLICY IF EXISTS "RBAC read users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- 3. Create SELECT policy
-- Users can view their own profile OR Managers/Admins can view all profiles
CREATE POLICY "RBAC read users" ON public.users
FOR SELECT USING (
  auth.uid() = id OR 
  get_user_role(auth.uid()) IN ('admin', 'operations_manager', 'director', 'investor')
);

-- 4. Create UPDATE policy
-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON public.users
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 5. Ensure get_user_role function handles 'admin' role correctly if it doesn't already
-- (The existing function in global_rbac_fix.sql already returns role from public.users)

-- 6. Add 'admin' to the role check constraint if it exists
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
