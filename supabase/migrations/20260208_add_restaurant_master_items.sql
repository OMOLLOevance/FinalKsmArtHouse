-- Create the master list table for restaurant inventory items
CREATE TABLE restaurant_master_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    default_unit_price NUMERIC,
    unit TEXT, -- e.g., 'kg', 'piece', 'litre'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add a foreign key column to restaurant_sales to link to the master items table
ALTER TABLE restaurant_sales
ADD COLUMN master_item_id UUID REFERENCES restaurant_master_items(id) ON DELETE SET NULL;

-- Populate the master items table with the default hardcoded items
INSERT INTO restaurant_master_items (name, unit) VALUES
    ('Onions', 'kg'),
    ('Ginger', 'kg'),
    ('Hoho', 'kg'),
    ('Beans', 'kg'),
    ('Njugu', 'kg'),
    ('Carrots', 'kg'),
    ('Mboga Kienyeji', 'bunch'),
    ('Kuku Kienyeji', 'piece'),
    ('Bananas', 'bunch'),
    ('Lemon', 'piece'),
    ('Matumbo', 'kg'),
    ('Beef', 'kg'),
    ('Eggs', 'tray'),
    ('Fruits', 'kg'),
    ('Cabbage', 'piece'),
    ('Dania', 'bunch'),
    ('Fish', 'kg'),
    ('Charcoal', 'bag'),
    ('Tomatoes (kg)', 'kg'),
    ('Potatoes (kg)', 'kg'),
    ('Melon (pieces)', 'piece'),
    ('Mangoes (kg)', 'kg'),
    ('Tomato Sauce (litres)', 'litre'),
    ('Garlic (kg)', 'kg'),
    ('Crisps (grams/kg)', 'kg'),
    ('Transport', 'trip');

-- Note: After running this migration, you may want to backfill the `master_item_id`
-- for existing records in `restaurant_sales` based on the `item_name`.
-- For example:
-- UPDATE restaurant_sales rs
-- SET master_item_id = rmi.id
-- FROM restaurant_master_items rmi
-- WHERE rs.item_name = rmi.name AND rs.master_item_id IS NULL;
