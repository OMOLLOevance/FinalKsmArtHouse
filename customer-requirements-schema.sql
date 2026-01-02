-- Customer Requirements Table for Decor Integration
-- This table links customers to their selected decor items

CREATE TABLE IF NOT EXISTS customer_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  decor_item_id UUID REFERENCES decor_inventory(id) ON DELETE CASCADE,
  quantity_required INTEGER NOT NULL DEFAULT 1,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'delivered')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Prevent duplicate items per customer
  UNIQUE(customer_id, decor_item_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_requirements_customer_id ON customer_requirements(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_requirements_decor_item_id ON customer_requirements(decor_item_id);
CREATE INDEX IF NOT EXISTS idx_customer_requirements_user_id ON customer_requirements(user_id);

-- Update trigger for updated_at
CREATE TRIGGER update_customer_requirements_updated_at 
    BEFORE UPDATE ON customer_requirements 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();