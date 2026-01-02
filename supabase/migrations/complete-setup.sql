-- Complete Database Setup Script
-- Run this in Supabase SQL Editor to set up everything

-- 1. Add all missing columns to monthly_allocations
ALTER TABLE monthly_allocations ADD COLUMN IF NOT EXISTS double_tent INTEGER DEFAULT 0;
ALTER TABLE monthly_allocations ADD COLUMN IF NOT EXISTS single_tent INTEGER DEFAULT 0;
ALTER TABLE monthly_allocations ADD COLUMN IF NOT EXISTS gazebo_tent INTEGER DEFAULT 0;
ALTER TABLE monthly_allocations ADD COLUMN IF NOT EXISTS miluxe_tent INTEGER DEFAULT 0;
ALTER TABLE monthly_allocations ADD COLUMN IF NOT EXISTS a_frame_tent INTEGER DEFAULT 0;
ALTER TABLE monthly_allocations ADD COLUMN IF NOT EXISTS b_line_tent INTEGER DEFAULT 0;
ALTER TABLE monthly_allocations ADD COLUMN IF NOT EXISTS pergola_tent INTEGER DEFAULT 0;
ALTER TABLE monthly_allocations ADD COLUMN IF NOT EXISTS round_table INTEGER DEFAULT 0;
ALTER TABLE monthly_allocations ADD COLUMN IF NOT EXISTS long_table INTEGER DEFAULT 0;
ALTER TABLE monthly_allocations ADD COLUMN IF NOT EXISTS bridal_table INTEGER DEFAULT 0;
ALTER TABLE monthly_allocations ADD COLUMN IF NOT EXISTS chavari_seats INTEGER DEFAULT 0;
ALTER TABLE monthly_allocations ADD COLUMN IF NOT EXISTS luxe_seats INTEGER DEFAULT 0;
ALTER TABLE monthly_allocations ADD COLUMN IF NOT EXISTS chameleon_seats INTEGER DEFAULT 0;
ALTER TABLE monthly_allocations ADD COLUMN IF NOT EXISTS dior_seats INTEGER DEFAULT 0;
ALTER TABLE monthly_allocations ADD COLUMN IF NOT EXISTS high_back_seat INTEGER DEFAULT 0;
ALTER TABLE monthly_allocations ADD COLUMN IF NOT EXISTS plastic_seats INTEGER DEFAULT 0;
ALTER TABLE monthly_allocations ADD COLUMN IF NOT EXISTS banquet_seats INTEGER DEFAULT 0;
ALTER TABLE monthly_allocations ADD COLUMN IF NOT EXISTS cross_bar_seats INTEGER DEFAULT 0;
ALTER TABLE monthly_allocations ADD COLUMN IF NOT EXISTS walkway_stands INTEGER DEFAULT 0;

-- 2. Add inventory_limit column to decor_inventory if not exists
ALTER TABLE decor_inventory ADD COLUMN IF NOT EXISTS inventory_limit INTEGER DEFAULT 0;

-- 3. Update inventory limits
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