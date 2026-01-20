-- =====================================================
-- KSM.ART HOUSE - Payments Table Rollback
-- Revert multi-service support changes
-- =====================================================

-- Step 1: Drop new constraints
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS check_service_links;
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS fk_gym_member;
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS fk_sauna_booking;

-- Step 2: Drop new indexes
DROP INDEX IF EXISTS idx_payments_service_type;
DROP INDEX IF EXISTS idx_payments_gym_member;
DROP INDEX IF EXISTS idx_payments_sauna_booking;

-- Step 3: Remove new columns
ALTER TABLE public.payments 
DROP COLUMN IF EXISTS service_type,
DROP COLUMN IF EXISTS gym_member_id,
DROP COLUMN IF EXISTS sauna_booking_id;

-- Step 4: Restore original constraints (make quotation_id and customer_id NOT NULL)
ALTER TABLE public.payments 
ALTER COLUMN quotation_id SET NOT NULL,
ALTER COLUMN customer_id SET NOT NULL;

-- Step 5: Re-add original foreign key constraints
ALTER TABLE public.payments 
ADD CONSTRAINT fk_quotation 
    FOREIGN KEY (quotation_id) REFERENCES public.quotations(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_customer 
    FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;

-- Verify rollback
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payments' 
    AND table_schema = 'public'
ORDER BY ordinal_position;