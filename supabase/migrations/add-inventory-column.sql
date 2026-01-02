-- Step 1: Add inventory_limit column to decor_inventory table
ALTER TABLE decor_inventory ADD COLUMN inventory_limit INTEGER DEFAULT 0;