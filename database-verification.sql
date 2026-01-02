-- Database Verification and Setup Script
-- This script verifies and sets up all required tables and data for the decor management system

-- 1. Verify decor_inventory table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'decor_inventory') THEN
        RAISE NOTICE 'Creating decor_inventory table...';
        
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

        CREATE INDEX idx_decor_inventory_user_id ON decor_inventory(user_id);
        CREATE INDEX idx_decor_inventory_category ON decor_inventory(category);
        
        CREATE TRIGGER update_decor_inventory_updated_at 
            BEFORE UPDATE ON decor_inventory 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- 2. Verify customer_requirements table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'customer_requirements') THEN
        RAISE NOTICE 'Creating customer_requirements table...';
        
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

        CREATE INDEX idx_customer_requirements_customer_id ON customer_requirements(customer_id);
        CREATE INDEX idx_customer_requirements_decor_item_id ON customer_requirements(decor_item_id);
        CREATE INDEX idx_customer_requirements_user_id ON customer_requirements(user_id);
        
        CREATE TRIGGER update_customer_requirements_updated_at 
            BEFORE UPDATE ON customer_requirements 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- 3. Check if predefined inventory items exist, if not, insert them
DO $$
DECLARE
    item_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO item_count FROM decor_inventory WHERE user_id IS NULL;
    
    IF item_count = 0 THEN
        RAISE NOTICE 'Seeding predefined inventory items...';
        
        INSERT INTO decor_inventory (category, item_name, in_store, price) VALUES
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
        ('centrepieces', 'Crystal Centrepiece', 15, 600);
        
        RAISE NOTICE 'Successfully seeded % inventory items', ROW_COUNT;
    ELSE
        RAISE NOTICE 'Inventory items already exist (% items found)', item_count;
    END IF;
END $$;

-- 4. Verification queries
SELECT 'decor_inventory' as table_name, COUNT(*) as row_count FROM decor_inventory
UNION ALL
SELECT 'customer_requirements' as table_name, COUNT(*) as row_count FROM customer_requirements;

-- 5. Show sample inventory by category
SELECT 
    category,
    COUNT(*) as item_count,
    SUM(in_store) as total_in_store,
    SUM(hired) as total_hired,
    SUM(damaged) as total_damaged
FROM decor_inventory 
GROUP BY category 
ORDER BY category;