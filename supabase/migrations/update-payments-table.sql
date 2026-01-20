ALTER TABLE public.payments
ADD COLUMN service_type TEXT NOT NULL DEFAULT 'quotation';

-- Drop the existing foreign key constraints if they exist
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS fk_quotation;
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS fk_customer;

-- Add nullable foreign key columns for gym and sauna
ALTER TABLE public.payments ADD COLUMN gym_member_id UUID;
ALTER TABLE public.payments ADD COLUMN sauna_booking_id UUID;

-- Re-add foreign key constraints
ALTER TABLE public.payments ADD CONSTRAINT fk_quotation FOREIGN KEY (quotation_id) REFERENCES public.quotations(id) ON DELETE SET NULL;
ALTER TABLE public.payments ADD CONSTRAINT fk_customer FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;
ALTER TABLE public.payments ADD CONSTRAINT fk_gym_member FOREIGN KEY (gym_member_id) REFERENCES public.gym_members(id) ON DELETE SET NULL;
ALTER TABLE public.payments ADD CONSTRAINT fk_sauna_booking FOREIGN KEY (sauna_booking_id) REFERENCES public.sauna_bookings(id) ON DELETE SET NULL;

-- Add a check constraint to ensure data integrity
ALTER TABLE public.payments
ADD CONSTRAINT check_service_links
CHECK (
  (service_type = 'quotation' AND quotation_id IS NOT NULL AND gym_member_id IS NULL AND sauna_booking_id IS NULL) OR
  (service_type = 'gym' AND gym_member_id IS NOT NULL AND quotation_id IS NULL AND sauna_booking_id IS NULL) OR
  (service_type = 'sauna' AND sauna_booking_id IS NOT NULL AND quotation_id IS NULL AND gym_member_id IS NULL) OR
  (service_type NOT IN ('quotation', 'gym', 'sauna'))
);
