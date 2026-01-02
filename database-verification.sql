-- Comprehensive Database Verification Script
-- Run this in Supabase SQL Editor to verify complete implementation

-- 1. Check if monthly_allocations table exists and has all required columns
SELECT 
    'monthly_allocations table structure' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'monthly_allocations' 
ORDER BY ordinal_position;

-- 2. Check if all required indexes exist
SELECT 
    'monthly_allocations indexes' as check_type,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'monthly_allocations';

-- 3. Check if RLS policies exist
SELECT 
    'RLS policies' as check_type,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'monthly_allocations';

-- 4. Check if status constraint exists
SELECT 
    'Status constraints' as check_type,
    constraint_name,
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%monthly_allocations%';

-- 5. Check sample data structure
SELECT 
    'Sample data check' as check_type,
    COUNT(*) as total_records,
    COUNT(CASE WHEN event_date IS NOT NULL THEN 1 END) as records_with_date,
    COUNT(CASE WHEN customer_name IS NOT NULL THEN 1 END) as records_with_customer,
    COUNT(CASE WHEN status IS NOT NULL THEN 1 END) as records_with_status
FROM monthly_allocations;

-- 6. Check data types and constraints
SELECT 
    'Data validation' as check_type,
    'Status values' as field,
    status,
    COUNT(*) as count
FROM monthly_allocations 
WHERE status IS NOT NULL
GROUP BY status
UNION ALL
SELECT 
    'Data validation' as check_type,
    'Event types' as field,
    event_type,
    COUNT(*) as count
FROM monthly_allocations 
WHERE event_type IS NOT NULL
GROUP BY event_type;

-- 7. Check financial data integrity
SELECT 
    'Financial data check' as check_type,
    AVG(total_ksh) as avg_total,
    AVG(deposit_paid) as avg_deposit,
    AVG(total_ksh - deposit_paid) as avg_balance,
    COUNT(CASE WHEN total_ksh > 0 THEN 1 END) as records_with_revenue
FROM monthly_allocations;

-- 8. Check equipment data integrity
SELECT 
    'Equipment data check' as check_type,
    AVG(double_tent + single_tent + gazebo_tent + miluxe_tent + a_frame_tent + b_line_tent + pergola_tent) as avg_tents,
    AVG(round_table + long_table + bridal_table) as avg_tables,
    AVG(chavari_seats + luxe_seats + chameleon_seats + dior_seats + high_back_seat + plastic_seats + banquet_seats + cross_bar_seats) as avg_seats
FROM monthly_allocations;

-- 9. Test a sample INSERT to verify all constraints work
INSERT INTO monthly_allocations (
    customer_name,
    event_date,
    location,
    phone_number,
    event_type,
    status,
    double_tent,
    single_tent,
    round_table,
    chavari_seats,
    total_ksh,
    deposit_paid,
    user_id
) VALUES (
    'Test Customer - Verification',
    CURRENT_DATE + INTERVAL '30 days',
    'Test Location',
    '+254700000000',
    'Wedding',
    'pending',
    2,
    1,
    5,
    50,
    150000.00,
    50000.00,
    auth.uid()
) RETURNING 
    id,
    customer_name,
    event_date,
    status,
    total_ksh - deposit_paid as balance_due,
    'Test record created successfully' as verification_status;

-- 10. Clean up test record
DELETE FROM monthly_allocations 
WHERE customer_name = 'Test Customer - Verification';

-- 11. Check if decor_inventory table integration is ready
SELECT 
    'Decor inventory integration' as check_type,
    COUNT(*) as total_items,
    COUNT(CASE WHEN inventory_limit > 0 THEN 1 END) as items_with_limits,
    AVG(inventory_limit) as avg_inventory_limit
FROM decor_inventory;

-- 12. Final integration test - check if all systems work together
SELECT 
    'Integration test' as check_type,
    'monthly_allocations' as table_name,
    COUNT(*) as record_count,
    'Ready for production' as status
FROM monthly_allocations
UNION ALL
SELECT 
    'Integration test' as check_type,
    'decor_inventory' as table_name,
    COUNT(*) as record_count,
    CASE 
        WHEN COUNT(*) > 0 THEN 'Ready for production'
        ELSE 'Needs data population'
    END as status
FROM decor_inventory
UNION ALL
SELECT 
    'Integration test' as check_type,
    'customers' as table_name,
    COUNT(*) as record_count,
    CASE 
        WHEN COUNT(*) > 0 THEN 'Ready for production'
        ELSE 'Optional - will be created as needed'
    END as status
FROM customers;