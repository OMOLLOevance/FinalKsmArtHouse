-- CRITICAL FIX: Execute missing table creation in Supabase
-- This script creates the decor_inventory and customer_requirements tables that were missing

-- 1. Create update function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. Create decor_inventory table
CREATE TABLE IF NOT EXISTS decor_inventory (
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
CREATE INDEX IF NOT EXISTS idx_decor_inventory_user_id ON decor_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_decor_inventory_category ON decor_inventory(category);

-- 4. Create trigger for decor_inventory
DROP TRIGGER IF EXISTS update_decor_inventory_updated_at ON decor_inventory;
CREATE TRIGGER update_decor_inventory_updated_at 
    BEFORE UPDATE ON decor_inventory 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Create customer_requirements table
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
  UNIQUE(customer_id, decor_item_id)
);

-- 6. Create indexes for customer_requirements
CREATE INDEX IF NOT EXISTS idx_customer_requirements_customer_id ON customer_requirements(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_requirements_decor_item_id ON customer_requirements(decor_item_id);
CREATE INDEX IF NOT EXISTS idx_customer_requirements_user_id ON customer_requirements(user_id);

-- 7. Create trigger for customer_requirements
DROP TRIGGER IF EXISTS update_customer_requirements_updated_at ON customer_requirements;
CREATE TRIGGER update_customer_requirements_updated_at 
    BEFORE UPDATE ON customer_requirements 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Insert predefined inventory items (only if table is empty)
INSERT INTO decor_inventory (category, item_name, in_store, price)
SELECT * FROM (VALUES
  -- Table Clothes
  ('table_clothes', 'White Table Cloth', 50, 200),
  ('table_clothes', 'Black Table Cloth', 30, 200),
  ('table_clothes', 'Red Table Cloth', 25, 200),
  ('table_clothes', 'Blue Table Cloth', 20, 200),

  -- Satin Table Clothes
  ('satin_table_clothes', 'White Satin Table Cloth', 15, 350),
  ('satin_table_clothes', 'Gold Satin Table Cloth', 12, 350),
  ('satin_table_clothes', 'Silver Satin Table Cloth', 10, 350),

  -- Runners
  ('runners', 'Gold Table Runner', 40, 150),
  ('runners', 'Silver Table Runner', 35, 150),
  ('runners', 'Red Table Runner', 30, 150),
  ('runners', 'Blue Table Runner', 25, 150),

  -- Elastic Tiebacks
  ('elastic_tiebacks', 'White Elastic Tieback', 100, 50),
  ('elastic_tiebacks', 'Gold Elastic Tieback', 80, 50),
  ('elastic_tiebacks', 'Silver Elastic Tieback', 75, 50),

  -- Sheer Curtains
  ('sheer_curtains', 'White Sheer Curtain', 20, 300),
  ('sheer_curtains', 'Ivory Sheer Curtain', 15, 300),
  ('sheer_curtains', 'Gold Sheer Curtain', 12, 300),

  -- Spandex
  ('spandex', 'White Spandex Cover', 60, 250),
  ('spandex', 'Black Spandex Cover', 45, 250),
  ('spandex', 'Royal Blue Spandex Cover', 30, 250),

  -- Drops
  ('drops', 'White Backdrop Drop', 8, 500),
  ('drops', 'Black Backdrop Drop', 6, 500),
  ('drops', 'Gold Backdrop Drop', 4, 500),

  -- Traditional Items
  ('traditional_items', 'Kikoy Traditional Cloth', 25, 180),
  ('traditional_items', 'Kanga Traditional Cloth', 20, 180),
  ('traditional_items', 'Maasai Traditional Blanket', 15, 300),

  -- Charger Plates
  ('charger_plates', 'Gold Charger Plate', 100, 100),
  ('charger_plates', 'Silver Charger Plate', 80, 100),
  ('charger_plates', 'Glass Charger Plate', 60, 120),

  -- Table Mirrors
  ('table_mirrors', 'Round Table Mirror', 30, 200),
  ('table_mirrors', 'Square Table Mirror', 25, 200),
  ('table_mirrors', 'Oval Table Mirror', 20, 220),

  -- Holders
  ('holders', 'Candle Holder Gold', 50, 80),
  ('holders', 'Candle Holder Silver', 45, 80),
  ('holders', 'Flower Holder Glass', 40, 100),

  -- Artificial Flowers
  ('artificial_flowers', 'White Rose Arrangement', 30, 300),
  ('artificial_flowers', 'Red Rose Arrangement', 25, 300),
  ('artificial_flowers', 'Mixed Flower Arrangement', 35, 350),

  -- Hanging Flowers
  ('hanging_flowers', 'White Hanging Bouquet', 20, 400),
  ('hanging_flowers', 'Pink Hanging Bouquet', 15, 400),
  ('hanging_flowers', 'Mixed Hanging Bouquet', 18, 450),

  -- Centrepieces
  ('centrepieces', 'Gold Centrepiece', 25, 500),
  ('centrepieces', 'Silver Centrepiece', 20, 500),
  ('centrepieces', 'Crystal Centrepiece', 15, 600)
) AS v(category, item_name, in_store, price)
WHERE NOT EXISTS (SELECT 1 FROM decor_inventory WHERE user_id IS NULL);

-- 9. Verification queries
SELECT 'Tables created successfully' as status;
SELECT 'decor_inventory' as table_name, COUNT(*) as row_count FROM decor_inventory
UNION ALL
SELECT 'customer_requirements' as table_name, COUNT(*) as row_count FROM customer_requirements;