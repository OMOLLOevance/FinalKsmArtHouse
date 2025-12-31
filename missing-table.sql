-- Add missing catering inventory data table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.catering_inventory_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  inventory_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.catering_inventory_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
DROP POLICY IF EXISTS "Users can manage own catering inventory data" ON public.catering_inventory_data;
CREATE POLICY "Users can manage own catering inventory data" ON public.catering_inventory_data FOR ALL USING (auth.uid() = user_id);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_catering_inventory_data_updated_at ON public.catering_inventory_data;
CREATE TRIGGER update_catering_inventory_data_updated_at BEFORE UPDATE ON public.catering_inventory_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();