-- Monthly Allocations Table Setup & Security
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.monthly_allocations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  event_date DATE NOT NULL,
  location TEXT,
  phone_number TEXT,
  event_type TEXT DEFAULT 'Wedding',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  
  -- Equipment Columns
  double_tent INTEGER DEFAULT 0,
  single_tent INTEGER DEFAULT 0,
  gazebo_tent INTEGER DEFAULT 0,
  miluxe_tent INTEGER DEFAULT 0,
  a_frame_tent INTEGER DEFAULT 0,
  b_line_tent INTEGER DEFAULT 0,
  pergola_tent INTEGER DEFAULT 0,
  round_table INTEGER DEFAULT 0,
  long_table INTEGER DEFAULT 0,
  bridal_table INTEGER DEFAULT 0,
  chavari_seats INTEGER DEFAULT 0,
  luxe_seats INTEGER DEFAULT 0,
  chameleon_seats INTEGER DEFAULT 0,
  dior_seats INTEGER DEFAULT 0,
  high_back_seat INTEGER DEFAULT 0,
  plastic_seats INTEGER DEFAULT 0,
  banquet_seats INTEGER DEFAULT 0,
  cross_bar_seats INTEGER DEFAULT 0,
  
  -- Financial
  total_ksh DECIMAL(10,2) DEFAULT 0,
  deposit_paid DECIMAL(10,2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security
ALTER TABLE public.monthly_allocations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Robust manage own monthly_allocations" ON public.monthly_allocations;
CREATE POLICY "Robust manage own monthly_allocations" 
ON public.monthly_allocations 
FOR ALL TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Performance
CREATE INDEX IF NOT EXISTS idx_monthly_allocations_user_id ON public.monthly_allocations(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_allocations_event_date ON public.monthly_allocations(event_date);

-- Trigger
DROP TRIGGER IF EXISTS update_monthly_allocations_updated_at ON public.monthly_allocations;
CREATE TRIGGER update_monthly_allocations_updated_at BEFORE UPDATE ON public.monthly_allocations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
