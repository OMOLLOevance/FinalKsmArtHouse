-- Add sample data for realistic dashboard numbers
-- Run this in Supabase SQL Editor

-- Add more customers
INSERT INTO customers (name, email, phone, address, created_at) VALUES
('John Doe', 'john@example.com', '+254700000001', 'Nairobi, Kenya', NOW()),
('Jane Smith', 'jane@example.com', '+254700000002', 'Mombasa, Kenya', NOW()),
('Mike Johnson', 'mike@example.com', '+254700000003', 'Kisumu, Kenya', NOW()),
('Sarah Wilson', 'sarah@example.com', '+254700000004', 'Nakuru, Kenya', NOW()),
('David Brown', 'david@example.com', '+254700000005', 'Eldoret, Kenya', NOW());

-- Add gym members
INSERT INTO gym_members (customer_id, membership_type, start_date, end_date, status, created_at) VALUES
(1, 'Premium', '2024-01-01', '2024-12-31', 'active', NOW()),
(2, 'Basic', '2024-02-01', '2024-08-01', 'active', NOW()),
(3, 'Premium', '2024-01-15', '2025-01-15', 'active', NOW()),
(4, 'Basic', '2024-03-01', '2024-09-01', 'active', NOW());

-- Add gym finances
INSERT INTO gym_finances (member_id, amount, payment_date, payment_method, description, created_at) VALUES
(1, 15000, '2024-01-01', 'mpesa', 'Annual Premium Membership', NOW()),
(2, 5000, '2024-02-01', 'cash', 'Monthly Basic Membership', NOW()),
(3, 15000, '2024-01-15', 'bank_transfer', 'Annual Premium Membership', NOW()),
(4, 5000, '2024-03-01', 'mpesa', 'Monthly Basic Membership', NOW());

-- Add sauna bookings
INSERT INTO sauna_bookings (customer_id, booking_date, session_time, duration_minutes, service_type, status, created_at) VALUES
(1, '2024-01-10', '14:00', 60, 'sauna', 'booked', NOW()),
(2, '2024-01-12', '16:00', 90, 'spa', 'booked', NOW()),
(3, '2024-01-15', '10:00', 60, 'sauna', 'booked', NOW()),
(4, '2024-01-18', '15:00', 120, 'spa', 'booked', NOW()),
(5, '2024-01-20', '11:00', 60, 'sauna', 'booked', NOW());

-- Add spa bookings
INSERT INTO spa_bookings (customer_id, booking_date, service_type, duration_minutes, therapist, status, created_at) VALUES
(1, '2024-01-11', 'massage', 60, 'Mary', 'booked', NOW()),
(2, '2024-01-13', 'facial', 90, 'Grace', 'booked', NOW()),
(3, '2024-01-16', 'massage', 60, 'Mary', 'booked', NOW());

-- Add sauna/spa finances
INSERT INTO sauna_spa_finances (booking_id, booking_type, amount, payment_date, payment_method, created_at) VALUES
(1, 'sauna', 2500, '2024-01-10', 'mpesa', NOW()),
(2, 'sauna', 4000, '2024-01-12', 'cash', NOW()),
(3, 'sauna', 2500, '2024-01-15', 'mpesa', NOW()),
(4, 'sauna', 5000, '2024-01-18', 'bank_transfer', NOW()),
(5, 'sauna', 2500, '2024-01-20', 'mpesa', NOW());

-- Add restaurant sales
INSERT INTO restaurant_sales (date, item_name, quantity, unit_price, total_amount, payment_method, created_at) VALUES
('2024-01-10', 'Grilled Chicken', 2, 1200, 2400, 'mpesa', NOW()),
('2024-01-10', 'Beef Stew', 1, 1500, 1500, 'cash', NOW()),
('2024-01-11', 'Fish Fillet', 3, 1800, 5400, 'mpesa', NOW()),
('2024-01-12', 'Vegetable Curry', 2, 800, 1600, 'cash', NOW()),
('2024-01-13', 'Grilled Tilapia', 1, 2000, 2000, 'bank_transfer', NOW()),
('2024-01-14', 'Chicken Wings', 4, 600, 2400, 'mpesa', NOW()),
('2024-01-15', 'Beef Burger', 2, 1000, 2000, 'cash', NOW());

-- Add event items
INSERT INTO event_items (name, category, price, quantity_available, description, created_at) VALUES
('Wedding Decoration Package', 'decoration', 25000, 5, 'Complete wedding decoration setup', NOW()),
('Sound System Rental', 'audio', 8000, 3, 'Professional sound system for events', NOW()),
('Catering Service - 100 pax', 'catering', 45000, 2, 'Full catering service for 100 people', NOW()),
('Photography Package', 'photography', 15000, 4, 'Professional event photography', NOW()),
('DJ Services', 'entertainment', 12000, 6, 'Professional DJ for events', NOW()),
('Tent Rental - Large', 'equipment', 18000, 3, 'Large tent for outdoor events', NOW());

-- Add catering inventory
INSERT INTO catering_inventory (item_name, category, quantity, unit, unit_cost, supplier, last_updated) VALUES
('Rice - Basmati', 'grains', 50, 'kg', 150, 'Nakumatt Supplies', NOW()),
('Chicken - Whole', 'meat', 20, 'pieces', 800, 'Fresh Poultry Ltd', NOW()),
('Beef - Stewing', 'meat', 15, 'kg', 1200, 'Butchery Plus', NOW()),
('Vegetables - Mixed', 'vegetables', 30, 'kg', 200, 'Farm Fresh', NOW()),
('Cooking Oil', 'condiments', 10, 'liters', 300, 'Bidco Supplies', NOW());

-- Add quotations
INSERT INTO quotations (customer_id, event_type, event_date, total_amount, status, items, created_at) VALUES
(1, 'Wedding', '2024-06-15', 150000, 'pending', 'Decoration, Catering, Photography, DJ', NOW()),
(2, 'Corporate Event', '2024-04-20', 80000, 'approved', 'Sound System, Catering, Photography', NOW()),
(3, 'Birthday Party', '2024-03-10', 45000, 'pending', 'Decoration, DJ, Catering', NOW()),
(4, 'Conference', '2024-05-05', 120000, 'approved', 'Sound System, Catering, Photography, Tent', NOW());