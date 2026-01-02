-- Sample Data Insertion Script
-- Run this AFTER the migration script to populate tables with test data
-- Replace 'your-user-id-here' with actual user UUID from auth.users

-- Insert sample user (if using Supabase Auth, this might already exist)
-- INSERT INTO users (id, email, first_name, last_name, role) 
-- VALUES ('your-user-id-here', 'test@example.com', 'Test', 'User', 'admin')
-- ON CONFLICT (email) DO NOTHING;

-- Sample customers data
INSERT INTO customers (user_id, name, contact, location, event_type, event_date, total_amount, paid_amount, payment_status, payment_method, service_status, notes) VALUES
(auth.uid(), 'John Doe', '+254712345678', 'Nairobi', 'wedding', '2024-02-15', 150000.00, 50000.00, 'deposit', 'mpesa', 'pending', 'Wedding reception for 200 guests'),
(auth.uid(), 'Jane Smith', '+254723456789', 'Mombasa', 'birthday', '2024-02-20', 75000.00, 75000.00, 'full', 'cash', 'served', 'Birthday party for 50 guests'),
(auth.uid(), 'Corporate Ltd', '+254734567890', 'Kisumu', 'corporate', '2024-02-25', 200000.00, 100000.00, 'deposit', 'bank', 'pending', 'Annual company retreat')
ON CONFLICT DO NOTHING;

-- Sample gym members data
INSERT INTO gym_members (user_id, member_name, email, phone, membership_type, start_date, expiry_date, status, payment_amount) VALUES
(auth.uid(), 'Mike Johnson', 'mike@email.com', '+254745678901', 'monthly', '2024-01-01', '2024-02-01', 'active', 3000.00),
(auth.uid(), 'Sarah Wilson', 'sarah@email.com', '+254756789012', 'three-months', '2024-01-15', '2024-04-15', 'active', 8000.00),
(auth.uid(), 'David Brown', 'david@email.com', '+254767890123', 'weekly', '2024-01-20', '2024-01-27', 'expired', 800.00)
ON CONFLICT DO NOTHING;

-- Sample gym finances data
INSERT INTO gym_finances (user_id, transaction_date, description, amount, transaction_type, payment_method) VALUES
(auth.uid(), '2024-01-01', 'Monthly membership - Mike Johnson', 3000.00, 'membership', 'mpesa'),
(auth.uid(), '2024-01-15', 'Three months membership - Sarah Wilson', 8000.00, 'membership', 'cash'),
(auth.uid(), '2024-01-20', 'Equipment maintenance', -5000.00, 'expense', 'cash'),
(auth.uid(), '2024-01-25', 'Electricity bill', -2500.00, 'expense', 'bank')
ON CONFLICT DO NOTHING;

-- Sample sauna bookings data
INSERT INTO sauna_bookings (user_id, date, time, client, duration, amount, status) VALUES
(auth.uid(), '2024-02-01', '10:00:00', 'Alice Cooper', 60, 2000.00, 'completed'),
(auth.uid(), '2024-02-02', '14:00:00', 'Bob Martin', 90, 3000.00, 'booked'),
(auth.uid(), '2024-02-03', '16:00:00', 'Carol White', 60, 2000.00, 'booked')
ON CONFLICT DO NOTHING;

-- Sample spa bookings data
INSERT INTO spa_bookings (user_id, date, time, client, service, duration, amount, status) VALUES
(auth.uid(), '2024-02-01', '11:00:00', 'Diana Prince', 'Full Body Massage', 90, 4500.00, 'completed'),
(auth.uid(), '2024-02-02', '15:00:00', 'Eva Green', 'Facial Treatment', 60, 3000.00, 'booked'),
(auth.uid(), '2024-02-03', '17:00:00', 'Fiona Black', 'Manicure & Pedicure', 120, 2500.00, 'booked')
ON CONFLICT DO NOTHING;

-- Sample sauna spa finances data
INSERT INTO sauna_spa_finances (user_id, date, type, description, amount, category) VALUES
(auth.uid(), '2024-02-01', 'sauna-profit', 'Sauna booking - Alice Cooper', 2000.00, 'sauna'),
(auth.uid(), '2024-02-01', 'spa-profit', 'Spa service - Diana Prince', 4500.00, 'spa'),
(auth.uid(), '2024-02-02', 'expense', 'Towel cleaning service', -800.00, 'general')
ON CONFLICT DO NOTHING;

-- Sample restaurant sales data
INSERT INTO restaurant_sales (user_id, date, item, quantity, unit_price, total_amount, expenses) VALUES
(auth.uid(), '2024-02-01', 'Grilled Chicken', 15, 1200.00, 18000.00, 9000.00),
(auth.uid(), '2024-02-01', 'Fish Fillet', 8, 1500.00, 12000.00, 6400.00),
(auth.uid(), '2024-02-02', 'Beef Stew', 20, 1000.00, 20000.00, 12000.00),
(auth.uid(), '2024-02-02', 'Vegetable Rice', 25, 400.00, 10000.00, 5000.00)
ON CONFLICT DO NOTHING;

-- Sample event items data
INSERT INTO event_items (user_id, name, category, quantity_available, price, unit, description, status) VALUES
(auth.uid(), 'Round Tables', 'decor', 20, 200.00, 'pieces', '6-seater round tables', 'available'),
(auth.uid(), 'Plastic Chairs', 'decor', 100, 50.00, 'pieces', 'White plastic chairs', 'available'),
(auth.uid(), 'Sound System', 'sound', 3, 2000.00, 'pieces', 'Professional sound system with microphones', 'available'),
(auth.uid(), 'LED Lights', 'lighting', 10, 300.00, 'pieces', 'Colorful LED lighting', 'available'),
(auth.uid(), 'Tents', 'decor', 5, 3000.00, 'pieces', 'Large event tents', 'available')
ON CONFLICT DO NOTHING;

-- Sample catering inventory data
INSERT INTO catering_inventory (user_id, name, category, unit, quantity, price_per_plate, min_order, description, available) VALUES
(auth.uid(), 'Chicken Wings', 'Main Course', 'plate', 0, 800.00, 10, 'Grilled chicken wings with sauce', true),
(auth.uid(), 'Beef Samosas', 'Appetizer', 'piece', 0, 50.00, 20, 'Deep fried beef samosas', true),
(auth.uid(), 'Rice Pilau', 'Side Dish', 'plate', 0, 300.00, 10, 'Spiced rice pilau', true),
(auth.uid(), 'Fruit Salad', 'Dessert', 'bowl', 0, 250.00, 5, 'Fresh mixed fruit salad', true),
(auth.uid(), 'Soft Drinks', 'Beverage', 'bottle', 0, 100.00, 24, 'Assorted soft drinks', true)
ON CONFLICT DO NOTHING;

-- Verify data insertion
SELECT 'Data insertion completed successfully' as status;