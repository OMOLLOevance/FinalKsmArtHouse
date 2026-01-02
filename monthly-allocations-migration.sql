-- Migration script for existing monthly_allocations table
-- Run this in Supabase SQL Editor to add missing columns

-- Add missing columns to monthly_allocations table
ALTER TABLE monthly_allocations 
ADD COLUMN IF NOT EXISTS event_date DATE,
ADD COLUMN IF NOT EXISTS location VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS event_type VARCHAR(100) DEFAULT 'Wedding',
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS double_tent INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS single_tent INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS gazebo_tent INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS miluxe_tent INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS a_frame_tent INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS b_line_tent INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pergola_tent INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS round_table INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS long_table INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bridal_table INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS chavari_seats INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS luxe_seats INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS chameleon_seats INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS dior_seats INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS high_back_seat INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS plastic_seats INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS banquet_seats INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cross_bar_seats INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_ksh DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS deposit_paid DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add constraint for status column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'monthly_allocations_status_check'
    ) THEN
        ALTER TABLE monthly_allocations 
        ADD CONSTRAINT monthly_allocations_status_check 
        CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled'));
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_monthly_allocations_event_date ON monthly_allocations(event_date);
CREATE INDEX IF NOT EXISTS idx_monthly_allocations_status ON monthly_allocations(status);

-- Update existing rows to have default event_date if null
UPDATE monthly_allocations 
SET event_date = CURRENT_DATE 
WHERE event_date IS NULL;