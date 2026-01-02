-- Monthly Allocations Table Setup - Run in Supabase SQL Editor
-- This creates the table needed for the professional MonthlyAllocationTable component

CREATE TABLE IF NOT EXISTS monthly_allocations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Customer Information
  customer_name VARCHAR(255) NOT NULL,
  event_date DATE NOT NULL,
  location VARCHAR(255),
  phone_number VARCHAR(50),
  event_type VARCHAR(100) DEFAULT 'Wedding',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  
  -- Tent Equipment
  double_tent INTEGER DEFAULT 0,
  single_tent INTEGER DEFAULT 0,
  gazebo_tent INTEGER DEFAULT 0,
  miluxe_tent INTEGER DEFAULT 0,
  a_frame_tent INTEGER DEFAULT 0,
  b_line_tent INTEGER DEFAULT 0,
  pergola_tent INTEGER DEFAULT 0,
  
  -- Table Equipment
  round_table INTEGER DEFAULT 0,
  long_table INTEGER DEFAULT 0,
  bridal_table INTEGER DEFAULT 0,
  
  -- Seating Equipment
  chavari_seats INTEGER DEFAULT 0,
  luxe_seats INTEGER DEFAULT 0,
  chameleon_seats INTEGER DEFAULT 0,
  dior_seats INTEGER DEFAULT 0,
  high_back_seat INTEGER DEFAULT 0,
  plastic_seats INTEGER DEFAULT 0,
  banquet_seats INTEGER DEFAULT 0,
  cross_bar_seats INTEGER DEFAULT 0,
  
  -- Financial Information
  total_ksh DECIMAL(10,2) DEFAULT 0,
  deposit_paid DECIMAL(10,2) DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_monthly_allocations_event_date ON monthly_allocations(event_date);
CREATE INDEX IF NOT EXISTS idx_monthly_allocations_user_id ON monthly_allocations(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_allocations_status ON monthly_allocations(status);

-- Enable Row Level Security
ALTER TABLE monthly_allocations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own allocations" ON monthly_allocations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own allocations" ON monthly_allocations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own allocations" ON monthly_allocations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own allocations" ON monthly_allocations
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_monthly_allocations_updated_at 
  BEFORE UPDATE ON monthly_allocations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();