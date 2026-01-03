-- Step 1: Check current roles
SELECT role, COUNT(*) FROM public.users GROUP BY role;

-- Step 2: Fix the specific user causing the issue
UPDATE public.users 
SET role = 'operations_manager' 
WHERE email = 'adminop@ksmarthouse.com';

-- Step 3: Fix any other problematic roles
UPDATE public.users 
SET role = CASE 
  WHEN role IN ('admin', 'manager') THEN 'operations_manager'
  WHEN role = 'director' THEN 'director'
  WHEN role = 'staff' THEN 'staff'
  ELSE 'staff'
END;

-- Step 4: Apply constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('staff', 'operations_manager', 'director', 'investor'));