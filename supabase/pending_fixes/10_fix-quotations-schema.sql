-- Fix Quotations Table Schema
-- Run this in your Supabase SQL Editor to match the latest application logic

DROP TABLE IF EXISTS public.quotations CASCADE;

CREATE TABLE public.quotations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT,
    number_of_guests INTEGER DEFAULT 0,
    theme TEXT,
    event_date DATE,
    event_type TEXT,
    custom_event_type TEXT,
    quotation_type TEXT NOT NULL, -- 'Event/Decor' or 'Food/Catering'
    sections JSONB NOT NULL DEFAULT '[]',
    additional_charges JSONB DEFAULT '{}',
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'approved', 'rejected')),
    total_amount DECIMAL(12,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Robust manage own quotations" ON public.quotations;
CREATE POLICY "Robust manage own quotations" 
ON public.quotations 
FOR ALL TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Performance
CREATE INDEX IF NOT EXISTS idx_quotations_user_id ON public.quotations(user_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON public.quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_created_at ON public.quotations(created_at);

-- Trigger
DROP TRIGGER IF EXISTS update_quotations_updated_at ON public.quotations;
CREATE TRIGGER update_quotations_updated_at BEFORE UPDATE ON public.quotations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
