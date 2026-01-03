-- Final RLS Hardening for Catering
-- This ensures Supabase knows exactly how to handle both saving and updating

-- 1. Drop existing policy
DROP POLICY IF EXISTS "Manage own catering inventory" ON public.catering_inventory;

-- 2. Create more robust policy with explicit CHECK
CREATE POLICY "Manage own catering inventory" 
ON public.catering_inventory 
FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. Do the same for catering items
DROP POLICY IF EXISTS "Manage own catering items" ON public.catering_items;

CREATE POLICY "Manage own catering items" 
ON public.catering_items 
FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
