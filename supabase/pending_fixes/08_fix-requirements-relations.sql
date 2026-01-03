-- Fix Customer Requirements Relationships
-- Run this in your Supabase SQL Editor to resolve 400 Errors and Join issues

-- 1. Ensure the table has the correct structure and relations
DROP TABLE IF EXISTS public.customer_requirements CASCADE;

CREATE TABLE public.customer_requirements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    decor_item_id UUID REFERENCES public.decor_inventory(id) ON DELETE CASCADE,
    quantity_required INTEGER DEFAULT 1,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'delivered')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Explicitly name the foreign keys so PostgREST can detect them easily
-- Supabase sometimes needs these hints
ALTER TABLE public.customer_requirements 
  DROP CONSTRAINT IF EXISTS fk_customer,
  ADD CONSTRAINT fk_customer FOREIGN KEY (customer_id) REFERENCES public.customers(id),
  DROP CONSTRAINT IF EXISTS fk_decor_item,
  ADD CONSTRAINT fk_decor_item FOREIGN KEY (decor_item_id) REFERENCES public.decor_inventory(id);

-- 3. Security
ALTER TABLE public.customer_requirements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Robust manage own customer_requirements" ON public.customer_requirements;
CREATE POLICY "Robust manage own customer_requirements" 
ON public.customer_requirements 
FOR ALL TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- 4. Triggers
DROP TRIGGER IF EXISTS update_customer_requirements_updated_at ON public.customer_requirements;
CREATE TRIGGER update_customer_requirements_updated_at BEFORE UPDATE ON public.customer_requirements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Performance
CREATE INDEX IF NOT EXISTS idx_customer_requirements_user_id ON public.customer_requirements(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_requirements_customer ON public.customer_requirements(customer_id);
