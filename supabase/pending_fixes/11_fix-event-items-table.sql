-- Fix Event Items Table Schema
-- Run this in your Supabase SQL Editor to resolve 500 Errors in Sanitation/Entertainment

-- 1. Align table columns with the Application Code
-- Check if table exists and rename columns if they use the old names
DO $$ 
BEGIN
  -- Rename item_name to name if it exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_items' AND column_name = 'item_name') THEN
    ALTER TABLE public.event_items RENAME COLUMN item_name TO name;
  END IF;

  -- Rename quantity to quantity_available if it exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_items' AND column_name = 'quantity') THEN
    ALTER TABLE public.event_items RENAME COLUMN quantity TO quantity_available;
  END IF;

  -- Add status column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_items' AND column_name = 'status') THEN
    ALTER TABLE public.event_items ADD COLUMN status TEXT DEFAULT 'available';
  END IF;

  -- Add unit column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_items' AND column_name = 'unit') THEN
    ALTER TABLE public.event_items ADD COLUMN unit TEXT DEFAULT 'pieces';
  END IF;
  
  -- Ensure category is NOT NULL
  ALTER TABLE public.event_items ALTER COLUMN category SET NOT NULL;
END $$;

-- 2. Ensure RLS is hardened
ALTER TABLE public.event_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Robust manage own event_items" ON public.event_items;
CREATE POLICY "Robust manage own event_items" 
ON public.event_items 
FOR ALL TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- 3. Success Notification
SELECT 'Event Items table successfully synchronized' as status;
