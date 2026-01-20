-- =====================================================
-- KSM.ART HOUSE - Payments Table Migration (FINAL)
-- Add support for Gym and Sauna payment tracking
-- =====================================================

-- Step 1: Add new columns
ALTER TABLE public.payments 
ADD COLUMN service_type TEXT NOT NULL DEFAULT 'quotation',
ADD COLUMN gym_member_id UUID,
ADD COLUMN sauna_booking_id UUID;

-- Step 2: Make existing foreign keys nullable
ALTER TABLE public.payments 
ALTER COLUMN quotation_id DROP NOT NULL,
ALTER COLUMN customer_id DROP NOT NULL;

-- Step 3: Drop existing constraints
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS fk_quotation;
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS fk_customer;

-- Step 4: Add new foreign key constraints
ALTER TABLE public.payments 
ADD CONSTRAINT fk_quotation 
    FOREIGN KEY (quotation_id) REFERENCES public.quotations(id) ON DELETE SET NULL;

ALTER TABLE public.payments 
ADD CONSTRAINT fk_customer 
    FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;

ALTER TABLE public.payments 
ADD CONSTRAINT fk_gym_member 
    FOREIGN KEY (gym_member_id) REFERENCES public.gym_members(id) ON DELETE SET NULL;

ALTER TABLE public.payments 
ADD CONSTRAINT fk_sauna_booking 
    FOREIGN KEY (sauna_booking_id) REFERENCES public.sauna_bookings(id) ON DELETE SET NULL;

-- Step 5: Add data integrity constraint
ALTER TABLE public.payments
ADD CONSTRAINT check_service_links
CHECK (
  (service_type = 'quotation' AND quotation_id IS NOT NULL AND gym_member_id IS NULL AND sauna_booking_id IS NULL) OR
  (service_type = 'gym' AND gym_member_id IS NOT NULL AND quotation_id IS NULL AND sauna_booking_id IS NULL) OR
  (service_type = 'sauna' AND sauna_booking_id IS NOT NULL AND quotation_id IS NULL AND gym_member_id IS NULL)
);

-- Step 6: Create indexes for performance
CREATE INDEX idx_payments_service_type ON public.payments(service_type);
CREATE INDEX idx_payments_gym_member ON public.payments(gym_member_id);
CREATE INDEX idx_payments_sauna_booking ON public.payments(sauna_booking_id);

-- Step 7: Verify migration
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payments' 
    AND table_schema = 'public'
ORDER BY ordinal_position;