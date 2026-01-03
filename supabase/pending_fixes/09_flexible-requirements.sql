-- Fix Customer Requirements Flexibility
-- Run this in your Supabase SQL Editor to allow requirements to link to ANY customer type

-- 1. Remove the strict link to the 'customers' table
ALTER TABLE public.customer_requirements 
  DROP CONSTRAINT IF EXISTS fk_customer;

-- 2. Ensure RLS is still robust
DROP POLICY IF EXISTS "Robust manage own customer_requirements" ON public.customer_requirements;

CREATE POLICY "Robust manage own customer_requirements" 
ON public.customer_requirements 
FOR ALL TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- 3. Update the API helper to handle both types of customers in the "Manual Join"
-- (I will implement this in the route.ts file next)
