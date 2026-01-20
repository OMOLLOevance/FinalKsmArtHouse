-- Create missing decor_inventory_data table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS decor_inventory_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  inventory_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE decor_inventory_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can manage own decor inventory" ON decor_inventory_data
FOR ALL USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_decor_inventory_user_id ON decor_inventory_data(user_id);

-- Create update trigger
DROP TRIGGER IF EXISTS update_decor_inventory_updated_at ON decor_inventory_data;
CREATE TRIGGER update_decor_inventory_updated_at
  BEFORE UPDATE ON decor_inventory_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

SELECT 'Decor inventory table created successfully!' as result;