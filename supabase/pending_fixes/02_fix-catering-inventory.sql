-- Fix Catering Tables Migration
-- Run this in your Supabase SQL Editor to fix the 500 error when adding inventory

-- 1. Fix catering_inventory (Stock Inventory - Physical Assets)
DROP TABLE IF EXISTS public.catering_inventory;

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

-- 2. Create catering_items (Service Items - Billing/Pricing)
CREATE TABLE IF NOT EXISTS public.catering_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT DEFAULT 'pieces',
  price_per_plate DECIMAL(10,2) NOT NULL DEFAULT 0,
  min_order INTEGER DEFAULT 0,
  description TEXT,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS (Security)
ALTER TABLE public.catering_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catering_items ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies (Access Control)
DROP POLICY IF EXISTS "Manage own catering inventory" ON public.catering_inventory;
CREATE POLICY "Manage own catering inventory" ON public.catering_inventory FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Manage own catering items" ON public.catering_items;
CREATE POLICY "Manage own catering items" ON public.catering_items FOR ALL USING (auth.uid() = user_id);

-- 5. Create Performance Indexes
CREATE INDEX IF NOT EXISTS idx_catering_inventory_user_id ON public.catering_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_catering_items_user_id ON public.catering_items(user_id);

-- 6. Add Updated_At Triggers
DROP TRIGGER IF EXISTS update_catering_inventory_updated_at ON public.catering_inventory;
CREATE TRIGGER update_catering_inventory_updated_at BEFORE UPDATE ON public.catering_inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_catering_items_updated_at ON public.catering_items;
CREATE TRIGGER update_catering_items_updated_at BEFORE UPDATE ON public.catering_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();