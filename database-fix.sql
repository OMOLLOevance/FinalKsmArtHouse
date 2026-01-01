-- KSM.ART HOUSE Database Fix Script
-- Run this in Supabase SQL Editor if you see "column does not exist" errors

-- Ensure restaurant_sales has the correct columns
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='restaurant_sales' AND column_name='total_amount') THEN
        ALTER TABLE public.restaurant_sales ADD COLUMN total_amount DECIMAL(10,2) NOT NULL DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='restaurant_sales' AND column_name='sale_date') THEN
        ALTER TABLE public.restaurant_sales ADD COLUMN sale_date DATE NOT NULL DEFAULT NOW();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='restaurant_sales' AND column_name='item_name') THEN
        ALTER TABLE public.restaurant_sales ADD COLUMN item_name TEXT NOT NULL DEFAULT 'Item';
    END IF;
END $$;

-- Ensure sauna_bookings has the correct columns
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sauna_bookings' AND column_name='booking_date') THEN
        ALTER TABLE public.sauna_bookings ADD COLUMN booking_date DATE NOT NULL DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sauna_bookings' AND column_name='booking_time') THEN
        ALTER TABLE public.sauna_bookings ADD COLUMN booking_time TIME NOT NULL DEFAULT NOW();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sauna_bookings' AND column_name='client_name') THEN
        ALTER TABLE public.sauna_bookings ADD COLUMN client_name TEXT NOT NULL DEFAULT 'Client';
    END IF;
END $$;
