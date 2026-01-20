-- Create missing catering_inventory_data table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS catering_inventory_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  inventory_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE catering_inventory_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can manage own catering inventory" ON catering_inventory_data
FOR ALL USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_catering_inventory_user_id ON catering_inventory_data(user_id);

-- Create update trigger
DROP TRIGGER IF EXISTS update_catering_inventory_updated_at ON catering_inventory_data;
CREATE TRIGGER update_catering_inventory_updated_at
  BEFORE UPDATE ON catering_inventory_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

SELECT 'Catering inventory table created successfully!' as result;