-- SQL Commands to create Customer Management tables in Supabase
-- Run these commands in the Supabase SQL Editor

-- 1. Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_type TEXT NOT NULL,
  venue TEXT NOT NULL,
  guest_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  total_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- 4. Create indexes for better performance
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

-- 6. Create triggers to automatically update updated_at
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_allocations_updated_at BEFORE UPDATE ON monthly_allocations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_decor_items_updated_at BEFORE UPDATE ON decor_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Enable Row Level Security (RLS)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE decor_items ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies (allow all operations for authenticated users)
CREATE POLICY "Allow all operations for authenticated users" ON customers
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON monthly_allocations
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON decor_items
    FOR ALL USING (auth.role() = 'authenticated');

-- 9. Insert sample data for testing
INSERT INTO customers (name, email, phone, event_date, event_type, venue, guest_count, status, total_cost, notes) VALUES
('John Doe', 'john@example.com', '+254700000001', '2024-02-15', 'Wedding', 'Nairobi Hotel', 150, 'confirmed', 250000, 'Garden wedding with traditional decor'),
('Jane Smith', 'jane@example.com', '+254700000002', '2024-02-20', 'Corporate', 'KICC', 300, 'pending', 180000, 'Annual company meeting'),
('Michael Johnson', 'michael@example.com', '+254700000003', '2024-02-25', 'Birthday', 'Private Residence', 80, 'confirmed', 120000, '50th birthday celebration');

-- Verification queries (optional - run to check if tables were created successfully)
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('customers', 'monthly_allocations', 'decor_items');
-- SELECT * FROM customers LIMIT 5;