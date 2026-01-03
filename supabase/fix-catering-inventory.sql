-- FIX CATERING INVENTORY TABLE SCHEMA
-- This script aligns the database with the professional stock tracking API.

-- 1. DROP the misdefined table
-- We already have 'catering_items' for service/billing items.
DROP TABLE IF EXISTS public.catering_inventory;

-- 2. CREATE the correct table for Stock Tracking
CREATE TABLE public.catering_inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    particular TEXT NOT NULL,
    good_condition INTEGER DEFAULT 0,
    repair_needed INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.catering_inventory ENABLE ROW LEVEL SECURITY;

-- 4. APPLY STANDARDIZED OWNER ACCESS POLICY
CREATE POLICY "Owner Access" ON public.catering_inventory 
    FOR ALL 
    TO authenticated 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

-- 5. CREATE PERFORMANCE INDEX
CREATE INDEX idx_catering_inventory_user_id ON public.catering_inventory(user_id);
CREATE INDEX idx_catering_inventory_category ON public.catering_inventory(category);

-- Success Confirmation
SELECT 'Catering Inventory table has been successfully refactored' as status;