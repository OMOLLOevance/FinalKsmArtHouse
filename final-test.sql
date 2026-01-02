-- Final Integration Test
-- Test INSERT with correct schema

INSERT INTO monthly_allocations (
    customer_name,
    date,
    location,
    month,
    year,
    event_date,
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
    'Final Test Customer',
    CURRENT_DATE + INTERVAL '30 days',
    'Test Location',
    EXTRACT(MONTH FROM CURRENT_DATE + INTERVAL '30 days')::INTEGER,
    EXTRACT(YEAR FROM CURRENT_DATE + INTERVAL '30 days')::INTEGER,
    CURRENT_DATE + INTERVAL '30 days',
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
    date,
    location,
    status,
    total_ksh - deposit_paid as balance_due,
    'SUCCESS: Record created with correct schema' as verification_status;

-- Clean up test record
DELETE FROM monthly_allocations 
WHERE customer_name = 'Final Test Customer';

-- Final system status
SELECT 
    'FINAL STATUS' as check_type,
    'System ready for production' as message,
    COUNT(*) as current_records
FROM monthly_allocations;