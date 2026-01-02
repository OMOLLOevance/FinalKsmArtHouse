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

-- 2. Update decor_items table with enhanced columns
DO $$
BEGIN
    -- Add missing decor columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='decor_items' AND column_name='white_sticker') THEN
        ALTER TABLE decor_items ADD COLUMN white_sticker INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='decor_items' AND column_name='glass_charger_plates') THEN
        ALTER TABLE decor_items ADD COLUMN glass_charger_plates INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='decor_items' AND column_name='melamine_charger_plates') THEN
        ALTER TABLE decor_items ADD COLUMN melamine_charger_plates INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='decor_items' AND column_name='gold_napkin_holders') THEN
        ALTER TABLE decor_items ADD COLUMN gold_napkin_holders INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='decor_items' AND column_name='silver_napkin_holders') THEN
        ALTER TABLE decor_items ADD COLUMN silver_napkin_holders INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='decor_items' AND column_name='parcan_lights') THEN
        ALTER TABLE decor_items ADD COLUMN parcan_lights INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='decor_items' AND column_name='revolving_heads') THEN
        ALTER TABLE decor_items ADD COLUMN revolving_heads INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='decor_items' AND column_name='fairy_lights') THEN
        ALTER TABLE decor_items ADD COLUMN fairy_lights INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='decor_items' AND column_name='snake_lights') THEN
        ALTER TABLE decor_items ADD COLUMN snake_lights INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='decor_items' AND column_name='neon_lights') THEN
        ALTER TABLE decor_items ADD COLUMN neon_lights INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='decor_items' AND column_name='small_chandeliers') THEN
        ALTER TABLE decor_items ADD COLUMN small_chandeliers INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='decor_items' AND column_name='large_chandeliers') THEN
        ALTER TABLE decor_items ADD COLUMN large_chandeliers INTEGER DEFAULT 0;
    END IF;
    
    -- Remove old generic columns
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='decor_items' AND column_name='charger_plates') THEN
        ALTER TABLE decor_items DROP COLUMN charger_plates;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='decor_items' AND column_name='napkin_holders') THEN
        ALTER TABLE decor_items DROP COLUMN napkin_holders;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='decor_items' AND column_name='lighting_items') THEN
        ALTER TABLE decor_items DROP COLUMN lighting_items;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='decor_items' AND column_name='chandeliers') THEN
        ALTER TABLE decor_items DROP COLUMN chandeliers;
    END IF;
END $$;