-- Sample Data for Customer Management System
-- Run this in Supabase SQL Terminal

-- 1. First run the enhanced schema if not already done
-- (Run enhanced-customer-schema.sql first)

-- 2. Insert sample customers with events spread across different months
INSERT INTO customers (name, contact, email, phone, event_date, event_type, venue, guest_count, status, total_cost, notes) VALUES
-- January 2024 Events
('Sarah Johnson', '+254701234567', 'sarah.johnson@email.com', '+254701234567', '2024-01-15', 'Wedding', 'Nairobi Serena Hotel', 200, 'confirmed', 350000, 'Garden wedding with traditional decor'),
('Michael Chen', '+254701234568', 'michael.chen@email.com', '+254701234568', '2024-01-22', 'Corporate', 'KICC', 150, 'confirmed', 180000, 'Annual company meeting'),

-- February 2024 Events  
('Grace Wanjiku', '+254701234569', 'grace.wanjiku@email.com', '+254701234569', '2024-02-10', 'Wedding', 'Karen Country Club', 180, 'confirmed', 320000, 'Outdoor ceremony with white theme'),
('David Ochieng', '+254701234570', 'david.ochieng@email.com', '+254701234570', '2024-02-18', 'Birthday', 'Private Villa', 80, 'confirmed', 150000, '50th birthday celebration'),
('Mary Kamau', '+254701234571', 'mary.kamau@email.com', '+254701234571', '2024-02-25', 'Anniversary', 'Muthaiga Country Club', 120, 'pending', 200000, '25th wedding anniversary'),

-- March 2024 Events
('James Mwangi', '+254701234572', 'james.mwangi@email.com', '+254701234572', '2024-03-08', 'Corporate', 'Villa Rosa Kempinski', 250, 'confirmed', 400000, 'Product launch event'),
('Elizabeth Nyong', '+254701234573', 'elizabeth.nyong@email.com', '+254701234573', '2024-03-15', 'Wedding', 'Brackenhurst Hotel', 220, 'confirmed', 380000, 'Church wedding with reception'),
('Peter Kiprotich', '+254701234574', 'peter.kiprotich@email.com', '+254701234574', '2024-03-22', 'Graduation', 'University of Nairobi', 300, 'pending', 250000, 'Medical school graduation'),

-- April 2024 Events
('Rose Akinyi', '+254701234575', 'rose.akinyi@email.com', '+254701234575', '2024-04-05', 'Wedding', 'Safari Park Hotel', 160, 'confirmed', 290000, 'Traditional Luo wedding'),
('Samuel Mutua', '+254701234576', 'samuel.mutua@email.com', '+254701234576', '2024-04-12', 'Corporate', 'Panari Hotel', 100, 'confirmed', 120000, 'Board meeting and dinner'),
('Catherine Wambui', '+254701234577', 'catherine.wambui@email.com', '+254701234577', '2024-04-20', 'Birthday', 'Private Garden', 60, 'pending', 100000, 'Sweet 16 party'),

-- May 2024 Events
('John Otieno', '+254701234578', 'john.otieno@email.com', '+254701234578', '2024-05-10', 'Wedding', 'Hemingways Nairobi', 190, 'confirmed', 340000, 'Modern wedding with live band'),
('Faith Njeri', '+254701234579', 'faith.njeri@email.com', '+254701234579', '2024-05-18', 'Baby Shower', 'Private Home', 40, 'confirmed', 80000, 'Gender reveal party'),
('Robert Kimani', '+254701234580', 'robert.kimani@email.com', '+254701234580', '2024-05-25', 'Retirement', 'Nairobi Club', 150, 'pending', 180000, 'Retirement celebration');

-- 3. Insert corresponding decor items for each customer
-- Get customer IDs first, then insert decor items

DO $$
DECLARE
    customer_record RECORD;
BEGIN
    -- Sarah Johnson - Wedding (High decor needs)
    SELECT id INTO customer_record FROM customers WHERE name = 'Sarah Johnson' LIMIT 1;
    IF FOUND THEN
        INSERT INTO decor_items (customer_id, customer_name, walkway_stands, arc, aisle_stands, photobooth, lecturn, stage_boards, backdrop_boards, dance_floor, walkway_boards, white_sticker, centerpieces, glass_charger_plates, melamine_charger_plates, african_mats, gold_napkin_holders, silver_napkin_holders, roof_top_decor, parcan_lights, revolving_heads, fairy_lights, snake_lights, neon_lights, small_chandeliers, large_chandeliers, african_lampshades)
        VALUES (customer_record.id, 'Sarah Johnson', 8, 2, 6, 1, 1, 4, 3, 1, 10, 20, 15, 200, 0, 10, 50, 0, 5, 8, 2, 20, 0, 0, 6, 2, 8);
    END IF;

    -- Michael Chen - Corporate (Moderate decor needs)
    SELECT id INTO customer_record FROM customers WHERE name = 'Michael Chen' LIMIT 1;
    IF FOUND THEN
        INSERT INTO decor_items (customer_id, customer_name, walkway_stands, arc, aisle_stands, photobooth, lecturn, stage_boards, backdrop_boards, dance_floor, walkway_boards, white_sticker, centerpieces, glass_charger_plates, melamine_charger_plates, african_mats, gold_napkin_holders, silver_napkin_holders, roof_top_decor, parcan_lights, revolving_heads, fairy_lights, snake_lights, neon_lights, small_chandeliers, large_chandeliers, african_lampshades)
        VALUES (customer_record.id, 'Michael Chen', 4, 0, 2, 1, 2, 6, 4, 0, 6, 0, 8, 0, 150, 0, 0, 30, 2, 12, 4, 0, 10, 5, 4, 1, 0);
    END IF;

    -- Grace Wanjiku - Wedding (High decor needs)
    SELECT id INTO customer_record FROM customers WHERE name = 'Grace Wanjiku' LIMIT 1;
    IF FOUND THEN
        INSERT INTO decor_items (customer_id, customer_name, walkway_stands, arc, aisle_stands, photobooth, lecturn, stage_boards, backdrop_boards, dance_floor, walkway_boards, white_sticker, centerpieces, glass_charger_plates, melamine_charger_plates, african_mats, gold_napkin_holders, silver_napkin_holders, roof_top_decor, parcan_lights, revolving_heads, fairy_lights, snake_lights, neon_lights, small_chandeliers, large_chandeliers, african_lampshades)
        VALUES (customer_record.id, 'Grace Wanjiku', 6, 1, 4, 1, 1, 3, 2, 1, 8, 25, 12, 180, 0, 8, 45, 0, 4, 6, 1, 25, 0, 0, 5, 1, 6);
    END IF;

    -- David Ochieng - Birthday (Moderate decor needs)
    SELECT id INTO customer_record FROM customers WHERE name = 'David Ochieng' LIMIT 1;
    IF FOUND THEN
        INSERT INTO decor_items (customer_id, customer_name, walkway_stands, arc, aisle_stands, photobooth, lecturn, stage_boards, backdrop_boards, dance_floor, walkway_boards, white_sticker, centerpieces, glass_charger_plates, melamine_charger_plates, african_mats, gold_napkin_holders, silver_napkin_holders, roof_top_decor, parcan_lights, revolving_heads, fairy_lights, snake_lights, neon_lights, small_chandeliers, large_chandeliers, african_lampshades)
        VALUES (customer_record.id, 'David Ochieng', 2, 0, 0, 1, 0, 2, 1, 1, 4, 10, 6, 80, 0, 5, 20, 0, 2, 4, 1, 15, 5, 3, 3, 0, 4);
    END IF;

    -- Mary Kamau - Anniversary (Moderate decor needs)
    SELECT id INTO customer_record FROM customers WHERE name = 'Mary Kamau' LIMIT 1;
    IF FOUND THEN
        INSERT INTO decor_items (customer_id, customer_name, walkway_stands, arc, aisle_stands, photobooth, lecturn, stage_boards, backdrop_boards, dance_floor, walkway_boards, white_sticker, centerpieces, glass_charger_plates, melamine_charger_plates, african_mats, gold_napkin_holders, silver_napkin_holders, roof_top_decor, parcan_lights, revolving_heads, fairy_lights, snake_lights, neon_lights, small_chandeliers, large_chandeliers, african_lampshades)
        VALUES (customer_record.id, 'Mary Kamau', 4, 1, 2, 1, 0, 2, 2, 1, 6, 15, 8, 120, 0, 6, 30, 0, 3, 5, 1, 20, 0, 0, 4, 1, 5);
    END IF;

    -- James Mwangi - Corporate (High decor needs)
    SELECT id INTO customer_record FROM customers WHERE name = 'James Mwangi' LIMIT 1;
    IF FOUND THEN
        INSERT INTO decor_items (customer_id, customer_name, walkway_stands, arc, aisle_stands, photobooth, lecturn, stage_boards, backdrop_boards, dance_floor, walkway_boards, white_sticker, centerpieces, glass_charger_plates, melamine_charger_plates, african_mats, gold_napkin_holders, silver_napkin_holders, roof_top_decor, parcan_lights, revolving_heads, fairy_lights, snake_lights, neon_lights, small_chandeliers, large_chandeliers, african_lampshades)
        VALUES (customer_record.id, 'James Mwangi', 10, 0, 4, 2, 3, 8, 6, 1, 12, 0, 15, 0, 250, 0, 0, 50, 6, 15, 6, 0, 15, 8, 8, 2, 0);
    END IF;

    -- Elizabeth Nyong - Wedding (High decor needs)
    SELECT id INTO customer_record FROM customers WHERE name = 'Elizabeth Nyong' LIMIT 1;
    IF FOUND THEN
        INSERT INTO decor_items (customer_id, customer_name, walkway_stands, arc, aisle_stands, photobooth, lecturn, stage_boards, backdrop_boards, dance_floor, walkway_boards, white_sticker, centerpieces, glass_charger_plates, melamine_charger_plates, african_mats, gold_napkin_holders, silver_napkin_holders, roof_top_decor, parcan_lights, revolving_heads, fairy_lights, snake_lights, neon_lights, small_chandeliers, large_chandeliers, african_lampshades)
        VALUES (customer_record.id, 'Elizabeth Nyong', 8, 2, 6, 1, 1, 4, 3, 1, 10, 22, 16, 220, 0, 12, 55, 0, 5, 8, 2, 22, 0, 0, 6, 2, 9);
    END IF;

    -- Peter Kiprotich - Graduation (Moderate decor needs)
    SELECT id INTO customer_record FROM customers WHERE name = 'Peter Kiprotich' LIMIT 1;
    IF FOUND THEN
        INSERT INTO decor_items (customer_id, customer_name, walkway_stands, arc, aisle_stands, photobooth, lecturn, stage_boards, backdrop_boards, dance_floor, walkway_boards, white_sticker, centerpieces, glass_charger_plates, melamine_charger_plates, african_mats, gold_napkin_holders, silver_napkin_holders, roof_top_decor, parcan_lights, revolving_heads, fairy_lights, snake_lights, neon_lights, small_chandeliers, large_chandeliers, african_lampshades)
        VALUES (customer_record.id, 'Peter Kiprotich', 6, 0, 2, 2, 2, 6, 4, 1, 8, 5, 12, 0, 300, 0, 0, 60, 4, 10, 3, 0, 8, 4, 6, 1, 0);
    END IF;

    -- Rose Akinyi - Wedding (High decor needs)
    SELECT id INTO customer_record FROM customers WHERE name = 'Rose Akinyi' LIMIT 1;
    IF FOUND THEN
        INSERT INTO decor_items (customer_id, customer_name, walkway_stands, arc, aisle_stands, photobooth, lecturn, stage_boards, backdrop_boards, dance_floor, walkway_boards, white_sticker, centerpieces, glass_charger_plates, melamine_charger_plates, african_mats, gold_napkin_holders, silver_napkin_holders, roof_top_decor, parcan_lights, revolving_heads, fairy_lights, snake_lights, neon_lights, small_chandeliers, large_chandeliers, african_lampshades)
        VALUES (customer_record.id, 'Rose Akinyi', 7, 1, 5, 1, 1, 3, 2, 1, 9, 18, 14, 160, 0, 15, 40, 0, 4, 7, 1, 18, 0, 0, 5, 1, 12);
    END IF;

    -- Samuel Mutua - Corporate (Low decor needs)
    SELECT id INTO customer_record FROM customers WHERE name = 'Samuel Mutua' LIMIT 1;
    IF FOUND THEN
        INSERT INTO decor_items (customer_id, customer_name, walkway_stands, arc, aisle_stands, photobooth, lecturn, stage_boards, backdrop_boards, dance_floor, walkway_boards, white_sticker, centerpieces, glass_charger_plates, melamine_charger_plates, african_mats, gold_napkin_holders, silver_napkin_holders, roof_top_decor, parcan_lights, revolving_heads, fairy_lights, snake_lights, neon_lights, small_chandeliers, large_chandeliers, african_lampshades)
        VALUES (customer_record.id, 'Samuel Mutua', 2, 0, 0, 0, 1, 2, 1, 0, 3, 0, 4, 0, 100, 0, 0, 20, 1, 6, 2, 0, 5, 2, 2, 0, 0);
    END IF;

    -- Catherine Wambui - Birthday (Low decor needs)
    SELECT id INTO customer_record FROM customers WHERE name = 'Catherine Wambui' LIMIT 1;
    IF FOUND THEN
        INSERT INTO decor_items (customer_id, customer_name, walkway_stands, arc, aisle_stands, photobooth, lecturn, stage_boards, backdrop_boards, dance_floor, walkway_boards, white_sticker, centerpieces, glass_charger_plates, melamine_charger_plates, african_mats, gold_napkin_holders, silver_napkin_holders, roof_top_decor, parcan_lights, revolving_heads, fairy_lights, snake_lights, neon_lights, small_chandeliers, large_chandeliers, african_lampshades)
        VALUES (customer_record.id, 'Catherine Wambui', 3, 0, 1, 1, 0, 1, 1, 1, 4, 12, 5, 60, 0, 3, 15, 0, 2, 3, 0, 12, 3, 2, 2, 0, 3);
    END IF;

    -- John Otieno - Wedding (High decor needs)
    SELECT id INTO customer_record FROM customers WHERE name = 'John Otieno' LIMIT 1;
    IF FOUND THEN
        INSERT INTO decor_items (customer_id, customer_name, walkway_stands, arc, aisle_stands, photobooth, lecturn, stage_boards, backdrop_boards, dance_floor, walkway_boards, white_sticker, centerpieces, glass_charger_plates, melamine_charger_plates, african_mats, gold_napkin_holders, silver_napkin_holders, roof_top_decor, parcan_lights, revolving_heads, fairy_lights, snake_lights, neon_lights, small_chandeliers, large_chandeliers, african_lampshades)
        VALUES (customer_record.id, 'John Otieno', 8, 2, 5, 1, 1, 4, 3, 1, 10, 20, 15, 190, 0, 10, 48, 0, 5, 8, 2, 20, 0, 0, 6, 2, 8);
    END IF;

    -- Faith Njeri - Baby Shower (Low decor needs)
    SELECT id INTO customer_record FROM customers WHERE name = 'Faith Njeri' LIMIT 1;
    IF FOUND THEN
        INSERT INTO decor_items (customer_id, customer_name, walkway_stands, arc, aisle_stands, photobooth, lecturn, stage_boards, backdrop_boards, dance_floor, walkway_boards, white_sticker, centerpieces, glass_charger_plates, melamine_charger_plates, african_mats, gold_napkin_holders, silver_napkin_holders, roof_top_decor, parcan_lights, revolving_heads, fairy_lights, snake_lights, neon_lights, small_chandeliers, large_chandeliers, african_lampshades)
        VALUES (customer_record.id, 'Faith Njeri', 2, 0, 0, 1, 0, 1, 1, 0, 3, 8, 3, 40, 0, 2, 10, 0, 1, 2, 0, 8, 2, 1, 1, 0, 2);
    END IF;

    -- Robert Kimani - Retirement (Moderate decor needs)
    SELECT id INTO customer_record FROM customers WHERE name = 'Robert Kimani' LIMIT 1;
    IF FOUND THEN
        INSERT INTO decor_items (customer_id, customer_name, walkway_stands, arc, aisle_stands, photobooth, lecturn, stage_boards, backdrop_boards, dance_floor, walkway_boards, white_sticker, centerpieces, glass_charger_plates, melamine_charger_plates, african_mats, gold_napkin_holders, silver_napkin_holders, roof_top_decor, parcan_lights, revolving_heads, fairy_lights, snake_lights, neon_lights, small_chandeliers, large_chandeliers, african_lampshades)
        VALUES (customer_record.id, 'Robert Kimani', 4, 0, 2, 1, 1, 3, 2, 1, 6, 10, 8, 0, 150, 0, 0, 35, 3, 6, 2, 0, 6, 3, 4, 1, 0);
    END IF;

END $$;

-- 4. Verification queries
SELECT 'Customers created:' as info, COUNT(*) as count FROM customers;
SELECT 'Decor items created:' as info, COUNT(*) as count FROM decor_items;

-- 5. Show sample data by month
SELECT 
    EXTRACT(MONTH FROM event_date) as month,
    EXTRACT(YEAR FROM event_date) as year,
    COUNT(*) as events_count,
    STRING_AGG(name, ', ') as customers
FROM customers 
GROUP BY EXTRACT(MONTH FROM event_date), EXTRACT(YEAR FROM event_date)
ORDER BY year, month;

-- 6. Show total bookings per item (to test overbooking detection)
SELECT 
    'walkway_stands' as item,
    SUM(walkway_stands) as total_booked,
    50 as inventory_limit,
    CASE WHEN SUM(walkway_stands) > 50 THEN 'OVERBOOKED' ELSE 'OK' END as status
FROM decor_items
UNION ALL
SELECT 
    'centerpieces' as item,
    SUM(centerpieces) as total_booked,
    60 as inventory_limit,
    CASE WHEN SUM(centerpieces) > 60 THEN 'OVERBOOKED' ELSE 'OK' END as status
FROM decor_items
UNION ALL
SELECT 
    'glass_charger_plates' as item,
    SUM(glass_charger_plates) as total_booked,
    200 as inventory_limit,
    CASE WHEN SUM(glass_charger_plates) > 200 THEN 'OVERBOOKED' ELSE 'OK' END as status
FROM decor_items;