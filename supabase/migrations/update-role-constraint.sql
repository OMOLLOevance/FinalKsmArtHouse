-- Update users role constraint to include 'director'
-- Run this in your Supabase SQL Editor

-- 1. Identify and drop the existing constraint if it exists
-- Since it was likely created as an inline constraint, it may have a generated name like 'users_role_check'
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check') THEN
        ALTER TABLE public.users DROP CONSTRAINT users_role_check;
    END IF;
END $$;

-- 2. Add the updated constraint including 'director'
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'manager', 'staff', 'director'));

-- 3. Also update any other instances where this constraint might have been copied
-- (e.g. if you have other setup scripts that you run frequently)
