-- Create missing Decor and Requirements tables
-- Run this in your Supabase SQL Editor if you encounter issues in the Decor module

CREATE TABLE IF NOT EXISTS public.decor_inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  item_name TEXT NOT NULL,
  in_store INTEGER NOT NULL DEFAULT 0,
  hired INTEGER NOT NULL DEFAULT 0,
  damaged INTEGER NOT NULL DEFAULT 0,
  price DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.customer_requirements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    decor_item_id UUID REFERENCES public.decor_inventory(id) ON DELETE CASCADE,
    quantity_required INTEGER DEFAULT 1,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Apply security hardening
ALTER TABLE public.decor_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_requirements ENABLE ROW LEVEL SECURITY;

-- Drop existing if any to avoid errors
DROP POLICY IF EXISTS "Robust manage own decor_inventory" ON public.decor_inventory;
DROP POLICY IF EXISTS "Robust manage own customer_requirements" ON public.customer_requirements;

CREATE POLICY "Robust manage own decor_inventory" 
ON public.decor_inventory 
FOR ALL TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Robust manage own customer_requirements" 
ON public.customer_requirements 
FOR ALL TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Add updated_at trigger functionality if not exists
CREATE TRIGGER update_decor_inventory_updated_at BEFORE UPDATE ON public.decor_inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_requirements_updated_at BEFORE UPDATE ON public.customer_requirements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
