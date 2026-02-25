-- FIX FOR USERS TABLE RLS
-- Run this in Supabase SQL Editor to allow users to see their own profile

-- 1. Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;

-- 3. Policy: Allow users to view their own profile
-- This is critical for the AuthContext to fetch roles and password status
CREATE POLICY "Users can view own profile" ON public.users
FOR SELECT USING (auth.uid() = id);

-- 4. Policy: Allow users to update their own profile (e.g. changing password status)
CREATE POLICY "Users can update own profile" ON public.users
FOR UPDATE USING (auth.uid() = id);

-- 5. Policy: Allow Admins to see everything
CREATE POLICY "Admins can view all profiles" ON public.users
FOR ALL USING (
  get_user_role(auth.uid()) IN ('operations_manager', 'director', 'investor', 'admin')
);

-- 6. Ensure grants are correct
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;

SELECT 'Users RLS policies updated successfully' as result;
