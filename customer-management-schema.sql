-- SQL Commands to create Customer Management tables in Supabase
-- Run these commands in the Supabase SQL Editor

-- 1. Check if customers table exists and add missing columns
DO $$
BEGIN
    -- Create table if it doesn't exist
    CREATE TABLE IF NOT EXISTS customers (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        contact TEXT,
        location TEXT,
        eventDate TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='email') THEN
        ALTER TABLE customers ADD COLUMN email TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='phone') THEN
        ALTER TABLE customers ADD COLUMN phone TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='event_date') THEN
        ALTER TABLE customers ADD COLUMN event_date DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='event_type') THEN
        ALTER TABLE customers ADD COLUMN event_type TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='venue') THEN
        ALTER TABLE customers ADD COLUMN venue TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='guest_count') THEN
        ALTER TABLE customers ADD COLUMN guest_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='status') THEN
        ALTER TABLE customers ADD COLUMN status TEXT DEFAULT 'pending';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='total_cost') THEN
        ALTER TABLE customers ADD COLUMN total_cost DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='notes') THEN
        ALTER TABLE customers ADD COLUMN notes TEXT;
    END IF;
END $$;

-- 2. Create monthly_allocations table
CREATE TABLE IF NOT EXISTS monthly_allocations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  location TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  tent_size TEXT NOT NULL,
  table_count INTEGER NOT NULL DEFAULT 0,
  seat_type TEXT NOT NULL,
  total_ksh DECIMAL(10,2) NOT NULL DEFAULT 0,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create decor_items table
CREATE TABLE IF NOT EXISTS decor_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  walkway_stands INTEGER NOT NULL DEFAULT 0,
  arc INTEGER NOT NULL DEFAULT 0,
  aisle_stands INTEGER NOT NULL DEFAULT 0,
  photobooth INTEGER NOT NULL DEFAULT 0,
  lecturn INTEGER NOT NULL DEFAULT 0,
  stage_boards INTEGER NOT NULL DEFAULT 0,
  backdrop_boards INTEGER NOT NULL DEFAULT 0,
  dance_floor INTEGER NOT NULL DEFAULT 0,
  walkway_boards INTEGER NOT NULL DEFAULT 0,
  centerpieces INTEGER NOT NULL DEFAULT 0,
  charger_plates INTEGER NOT NULL DEFAULT 0,
  african_mats INTEGER NOT NULL DEFAULT 0,
  napkin_holders INTEGER NOT NULL DEFAULT 0,
  roof_top_decor INTEGER NOT NULL DEFAULT 0,
  lighting_items INTEGER NOT NULL DEFAULT 0,
  chandeliers INTEGER NOT NULL DEFAULT 0,
  african_lampshades INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Add constraint for status column and create indexes
DO $$
BEGIN
    -- Add check constraint for status if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name='customers_status_check') THEN
        ALTER TABLE customers ADD CONSTRAINT customers_status_check CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled'));
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_event_date ON customers(event_date);
CREATE INDEX IF NOT EXISTS idx_monthly_allocations_month_year ON monthly_allocations(month, year);
CREATE INDEX IF NOT EXISTS idx_monthly_allocations_date ON monthly_allocations(date);
CREATE INDEX IF NOT EXISTS idx_decor_items_customer_id ON decor_items(customer_id);

-- 5. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Create triggers to automatically update updated_at (with IF NOT EXISTS check)
DO $$
BEGIN
    -- Create trigger for customers table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_customers_updated_at') THEN
        CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Create trigger for monthly_allocations table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_monthly_allocations_updated_at') THEN
        CREATE TRIGGER update_monthly_allocations_updated_at BEFORE UPDATE ON monthly_allocations
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Create trigger for decor_items table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_decor_items_updated_at') THEN
        CREATE TRIGGER update_decor_items_updated_at BEFORE UPDATE ON decor_items
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- 7. Enable Row Level Security (RLS)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE decor_items ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies (with IF NOT EXISTS check)
DO $$
BEGIN
    -- Create policy for customers table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Allow all operations for authenticated users') THEN
        CREATE POLICY "Allow all operations for authenticated users" ON customers
            FOR ALL USING (auth.role() = 'authenticated');
    END IF;
    
    -- Create policy for monthly_allocations table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'monthly_allocations' AND policyname = 'Allow all operations for authenticated users') THEN
        CREATE POLICY "Allow all operations for authenticated users" ON monthly_allocations
            FOR ALL USING (auth.role() = 'authenticated');
    END IF;
    
    -- Create policy for decor_items table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'decor_items' AND policyname = 'Allow all operations for authenticated users') THEN
        CREATE POLICY "Allow all operations for authenticated users" ON decor_items
            FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- 9. Insert sample data for testing
INSERT INTO customers (name, contact, email, phone, event_date, event_type, venue, guest_count, status, total_cost, notes) VALUES
('John Doe', '+254700000001', 'john@example.com', '+254700000001', '2024-02-15', 'Wedding', 'Nairobi Hotel', 150, 'confirmed', 250000, 'Garden wedding with traditional decor'),
('Jane Smith', '+254700000002', 'jane@example.com', '+254700000002', '2024-02-20', 'Corporate', 'KICC', 300, 'pending', 180000, 'Annual company meeting'),
('Michael Johnson', '+254700000003', 'michael@example.com', '+254700000003', '2024-02-25', 'Birthday', 'Private Residence', 80, 'confirmed', 120000, '50th birthday celebration');

-- Verification queries (optional - run to check if tables were created successfully)
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('customers', 'monthly_allocations', 'decor_items');
-- SELECT * FROM customers LIMIT 5;