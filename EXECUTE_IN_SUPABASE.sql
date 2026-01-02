-- EXECUTE THIS SQL IN SUPABASE SQL EDITOR
-- Go to: https://supabase.com/dashboard/project/[your-project]/sql

-- 1. Create update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. Create decor_inventory table
CREATE TABLE decor_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  category TEXT NOT NULL,
  item_name TEXT NOT NULL,
  in_store INTEGER NOT NULL DEFAULT 0,
  hired INTEGER NOT NULL DEFAULT 0,
  damaged INTEGER NOT NULL DEFAULT 0,
  price NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Create indexes for decor_inventory
CREATE INDEX idx_decor_inventory_user_id ON decor_inventory(user_id);
CREATE INDEX idx_decor_inventory_category ON decor_inventory(category);

-- 4. Create trigger for decor_inventory
CREATE TRIGGER update_decor_inventory_updated_at 
    BEFORE UPDATE ON decor_inventory 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Create customer_requirements table
CREATE TABLE customer_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  decor_item_id UUID REFERENCES decor_inventory(id) ON DELETE CASCADE,
  quantity_required INTEGER NOT NULL DEFAULT 1,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'delivered')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(customer_id, decor_item_id)
);

-- 6. Create indexes for customer_requirements
CREATE INDEX idx_customer_requirements_customer_id ON customer_requirements(customer_id);
CREATE INDEX idx_customer_requirements_decor_item_id ON customer_requirements(decor_item_id);
CREATE INDEX idx_customer_requirements_user_id ON customer_requirements(user_id);

-- 7. Create trigger for customer_requirements
CREATE TRIGGER update_customer_requirements_updated_at 
    BEFORE UPDATE ON customer_requirements 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();