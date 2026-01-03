-- Disable constraint temporarily
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- Update all roles at once
UPDATE public.users SET role = 'staff' WHERE role IS NULL OR role NOT IN ('staff', 'operations_manager', 'director', 'investor');
UPDATE public.users SET role = 'operations_manager' WHERE role IN ('admin', 'manager');

-- Re-enable constraint
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('staff', 'operations_manager', 'director', 'investor'));

-- Verify
SELECT role, COUNT(*) FROM public.users GROUP BY role;