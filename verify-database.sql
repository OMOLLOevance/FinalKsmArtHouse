-- Verification Script - Check all database implementation
-- Run this in Supabase SQL Editor to verify everything is set up correctly

-- 1. Check monthly_allocations table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'monthly_allocations' 
ORDER BY ordinal_position;

-- 2. Check decor_inventory table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'decor_inventory' 
ORDER BY ordinal_position;

-- 3. Check if inventory limits are set
SELECT item_name, inventory_limit 
FROM decor_inventory 
WHERE inventory_limit > 0 
ORDER BY item_name;

-- 4. Check sample customers exist
SELECT COUNT(*) as customer_count 
FROM monthly_allocations;

-- 5. Test overbooking detection query
SELECT 
    'walkway_stands' as item,
    COALESCE(SUM(walkway_stands), 0) as total_booked,
    (SELECT inventory_limit FROM decor_inventory WHERE item_name = 'Walkway Stands') as inventory_limit,
    CASE 
        WHEN COALESCE(SUM(walkway_stands), 0) > (SELECT inventory_limit FROM decor_inventory WHERE item_name = 'Walkway Stands') 
        THEN 'OVERBOOKED' 
        ELSE 'OK' 
    END as status
FROM monthly_allocations 
WHERE event_date >= '2024-01-01' AND event_date < '2024-02-01';

-- 6. Check all required tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('monthly_allocations', 'decor_inventory', 'customer_requirements')
ORDER BY table_name;