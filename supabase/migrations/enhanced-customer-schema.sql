-- Enhanced Customer Management Schema - Run in Supabase SQL Editor
-- This adds all equipment columns to match the advanced interface

-- 1. Add equipment columns to monthly_allocations table
DO $$
BEGIN
    -- Equipment columns for tents
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='monthly_allocations' AND column_name='double_tent') THEN
        ALTER TABLE monthly_allocations ADD COLUMN double_tent INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='monthly_allocations' AND column_name='single_tent') THEN
        ALTER TABLE monthly_allocations ADD COLUMN single_tent INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='monthly_allocations' AND column_name='gazebo_tent') THEN
        ALTER TABLE monthly_allocations ADD COLUMN gazebo_tent INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='monthly_allocations' AND column_name='miluxe_tent') THEN
        ALTER TABLE monthly_allocations ADD COLUMN miluxe_tent INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='monthly_allocations' AND column_name='a_frame_tent') THEN
        ALTER TABLE monthly_allocations ADD COLUMN a_frame_tent INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='monthly_allocations' AND column_name='b_line_tent') THEN
        ALTER TABLE monthly_allocations ADD COLUMN b_line_tent INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='monthly_allocations' AND column_name='pergola_tent') THEN
        ALTER TABLE monthly_allocations ADD COLUMN pergola_tent INTEGER DEFAULT 0;
    END IF;
    
    -- Table columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='monthly_allocations' AND column_name='round_table') THEN
        ALTER TABLE monthly_allocations ADD COLUMN round_table INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='monthly_allocations' AND column_name='long_table') THEN
        ALTER TABLE monthly_allocations ADD COLUMN long_table INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='monthly_allocations' AND column_name='bridal_table') THEN
        ALTER TABLE monthly_allocations ADD COLUMN bridal_table INTEGER DEFAULT 0;
    END IF;
    
    -- Seat columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='monthly_allocations' AND column_name='chavari_seats') THEN
        ALTER TABLE monthly_allocations ADD COLUMN chavari_seats INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='monthly_allocations' AND column_name='luxe_seats') THEN
        ALTER TABLE monthly_allocations ADD COLUMN luxe_seats INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='monthly_allocations' AND column_name='chameleon_seats') THEN
        ALTER TABLE monthly_allocations ADD COLUMN chameleon_seats INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='monthly_allocations' AND column_name='dior_seats') THEN
        ALTER TABLE monthly_allocations ADD COLUMN dior_seats INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='monthly_allocations' AND column_name='high_back_seat') THEN
        ALTER TABLE monthly_allocations ADD COLUMN high_back_seat INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='monthly_allocations' AND column_name='plastic_seats') THEN
        ALTER TABLE monthly_allocations ADD COLUMN plastic_seats INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='monthly_allocations' AND column_name='banquet_seats') THEN
        ALTER TABLE monthly_allocations ADD COLUMN banquet_seats INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='monthly_allocations' AND column_name='cross_bar_seats') THEN
        ALTER TABLE monthly_allocations ADD COLUMN cross_bar_seats INTEGER DEFAULT 0;
    END IF;
    
    -- Remove old columns that are now replaced
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='monthly_allocations' AND column_name='tent_size') THEN
        ALTER TABLE monthly_allocations DROP COLUMN tent_size;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='monthly_allocations' AND column_name='table_count') THEN
        ALTER TABLE monthly_allocations DROP COLUMN table_count;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='monthly_allocations' AND column_name='seat_type') THEN
        ALTER TABLE monthly_allocations DROP COLUMN seat_type;
    END IF;
END $$;

-- 2. Add inventory_limit column to decor_inventory table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='decor_inventory' AND column_name='inventory_limit') THEN
        ALTER TABLE decor_inventory ADD COLUMN inventory_limit INTEGER DEFAULT 0;
    END IF;
END $$;

-- 3. Update existing decor_inventory items with inventory limits
UPDATE decor_inventory SET inventory_limit = 50 WHERE item_name = 'Walkway Stands';
UPDATE decor_inventory SET inventory_limit = 200 WHERE item_name = 'Glass Charger Plates';
UPDATE decor_inventory SET inventory_limit = 150 WHERE item_name = 'Melamine Charger Plates';
UPDATE decor_inventory SET inventory_limit = 100 WHERE item_name = 'Gold Napkin Holders';
UPDATE decor_inventory SET inventory_limit = 80 WHERE item_name = 'Silver Napkin Holders';
UPDATE decor_inventory SET inventory_limit = 30 WHERE item_name = 'Parcan Lights';
UPDATE decor_inventory SET inventory_limit = 20 WHERE item_name = 'Revolving Heads';
UPDATE decor_inventory SET inventory_limit = 100 WHERE item_name = 'Fairy Lights';
UPDATE decor_inventory SET inventory_limit = 60 WHERE item_name = 'Snake Lights';
UPDATE decor_inventory SET inventory_limit = 40 WHERE item_name = 'Neon Lights';
UPDATE decor_inventory SET inventory_limit = 25 WHERE item_name = 'Small Chandeliers';
UPDATE decor_inventory SET inventory_limit = 15 WHERE item_name = 'Large Chandeliers';