-- Quick fix for missing restaurant_monthly_inventory table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS restaurant_monthly_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- Format: YYYY-MM
  item TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'kg',
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  expenses DECIMAL(10,2) DEFAULT 0,
  net_amount DECIMAL(10,2) DEFAULT 0,
  purchase_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE restaurant_monthly_inventory ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can manage own restaurant inventory" ON restaurant_monthly_inventory
FOR ALL USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_restaurant_inventory_user_id ON restaurant_monthly_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_inventory_month ON restaurant_monthly_inventory(month);

-- Create update trigger
DROP TRIGGER IF EXISTS update_restaurant_inventory_updated_at ON restaurant_monthly_inventory;
CREATE TRIGGER update_restaurant_inventory_updated_at
  BEFORE UPDATE ON restaurant_monthly_inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

SELECT 'Restaurant inventory table created successfully!' as result;