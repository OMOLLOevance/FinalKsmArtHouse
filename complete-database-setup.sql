-- Complete database setup for KSM Art House Management System
-- Run this in Supabase SQL Editor

-- Create catering_items table
CREATE TABLE IF NOT EXISTS catering_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price_per_plate DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'plate',
  min_order INTEGER DEFAULT 1,
  description TEXT,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create restaurant_monthly_inventory table
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

-- Create restaurant_sales table
CREATE TABLE IF NOT EXISTS restaurant_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_sales DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_expenses DECIMAL(10,2) NOT NULL DEFAULT 0,
  profit DECIMAL(10,2) NOT NULL DEFAULT 0,
  items_sold JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create gym_members table
CREATE TABLE IF NOT EXISTS gym_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  member_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  membership_type TEXT CHECK (membership_type IN ('weekly', 'monthly', 'three-months')) NOT NULL,
  start_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  status TEXT CHECK (status IN ('active', 'expired')) DEFAULT 'active',
  payment_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_status TEXT DEFAULT 'paid',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create gym_finances table
CREATE TABLE IF NOT EXISTS gym_finances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  transaction_type TEXT CHECK (transaction_type IN ('income', 'expense', 'membership')) NOT NULL,
  payment_method TEXT DEFAULT 'cash',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact TEXT NOT NULL,
  location TEXT,
  event_type TEXT,
  event_date DATE,
  total_amount DECIMAL(10,2) DEFAULT 0,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  payment_status TEXT CHECK (payment_status IN ('deposit', 'full', 'pending')) DEFAULT 'pending',
  payment_method TEXT CHECK (payment_method IN ('cash', 'bank', 'mpesa')) DEFAULT 'cash',
  service_status TEXT CHECK (service_status IN ('pending', 'served')) DEFAULT 'pending',
  notes TEXT,
  requirements JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE catering_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_monthly_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_finances ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage own catering items" ON catering_items
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own restaurant inventory" ON restaurant_monthly_inventory
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own restaurant sales" ON restaurant_sales
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own gym members" ON gym_members
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own gym finances" ON gym_finances
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own customers" ON customers
FOR ALL USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_catering_items_user_id ON catering_items(user_id);
CREATE INDEX IF NOT EXISTS idx_catering_items_category ON catering_items(category);
CREATE INDEX IF NOT EXISTS idx_restaurant_inventory_user_id ON restaurant_monthly_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_inventory_month ON restaurant_monthly_inventory(month);
CREATE INDEX IF NOT EXISTS idx_restaurant_sales_user_id ON restaurant_sales(user_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_sales_date ON restaurant_sales(date DESC);
CREATE INDEX IF NOT EXISTS idx_gym_members_user_id ON gym_members(user_id);
CREATE INDEX IF NOT EXISTS idx_gym_members_status ON gym_members(status);
CREATE INDEX IF NOT EXISTS idx_gym_finances_user_id ON gym_finances(user_id);
CREATE INDEX IF NOT EXISTS idx_gym_finances_date ON gym_finances(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_event_date ON customers(event_date DESC);

-- Create update triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables
DROP TRIGGER IF EXISTS update_catering_items_updated_at ON catering_items;
CREATE TRIGGER update_catering_items_updated_at
  BEFORE UPDATE ON catering_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_restaurant_inventory_updated_at ON restaurant_monthly_inventory;
CREATE TRIGGER update_restaurant_inventory_updated_at
  BEFORE UPDATE ON restaurant_monthly_inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_restaurant_sales_updated_at ON restaurant_sales;
CREATE TRIGGER update_restaurant_sales_updated_at
  BEFORE UPDATE ON restaurant_sales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_gym_members_updated_at ON gym_members;
CREATE TRIGGER update_gym_members_updated_at
  BEFORE UPDATE ON gym_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_gym_finances_updated_at ON gym_finances;
CREATE TRIGGER update_gym_finances_updated_at
  BEFORE UPDATE ON gym_finances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';