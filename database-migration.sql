-- KSM Art House Database Migration Script
-- Run this in Supabase SQL Editor to ensure all tables exist

-- Enable RLS (Row Level Security) for all tables
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create users table if not exists
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'staff',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    contact VARCHAR(100),
    location VARCHAR(255),
    event_type VARCHAR(100),
    event_date DATE,
    total_amount DECIMAL(10,2) DEFAULT 0,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    payment_status VARCHAR(50) DEFAULT 'pending',
    payment_method VARCHAR(50) DEFAULT 'cash',
    service_status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    requirements JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create gym_members table
CREATE TABLE IF NOT EXISTS gym_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    member_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    membership_type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    payment_amount DECIMAL(10,2) DEFAULT 0,
    payment_status VARCHAR(50) DEFAULT 'paid',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create gym_finances table
CREATE TABLE IF NOT EXISTS gym_finances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    transaction_date DATE NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'cash',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sauna_bookings table
CREATE TABLE IF NOT EXISTS sauna_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time TIME NOT NULL,
    client VARCHAR(255) NOT NULL,
    duration INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'booked',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create spa_bookings table
CREATE TABLE IF NOT EXISTS spa_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time TIME NOT NULL,
    client VARCHAR(255) NOT NULL,
    service VARCHAR(255) NOT NULL,
    duration INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'booked',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sauna_spa_finances table
CREATE TABLE IF NOT EXISTS sauna_spa_finances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    type VARCHAR(50) NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create restaurant_sales table
CREATE TABLE IF NOT EXISTS restaurant_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    item VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    expenses DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create event_items table
CREATE TABLE IF NOT EXISTS event_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    quantity_available INTEGER DEFAULT 0,
    price DECIMAL(10,2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create catering_inventory table
CREATE TABLE IF NOT EXISTS catering_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    quantity INTEGER DEFAULT 0,
    price_per_plate DECIMAL(10,2) NOT NULL,
    min_order INTEGER DEFAULT 1,
    description TEXT,
    available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quotations table
CREATE TABLE IF NOT EXISTS quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    quotation_number VARCHAR(100) UNIQUE NOT NULL,
    items JSONB NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    valid_until DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_finances ENABLE ROW LEVEL SECURITY;
ALTER TABLE sauna_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE spa_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sauna_spa_finances ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE catering_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Users can only see their own data
CREATE POLICY "Users can view own data" ON customers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own gym members" ON gym_members FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own gym finances" ON gym_finances FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own sauna bookings" ON sauna_bookings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own spa bookings" ON spa_bookings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own sauna spa finances" ON sauna_spa_finances FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own restaurant sales" ON restaurant_sales FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own event items" ON event_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own catering inventory" ON catering_inventory FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own quotations" ON quotations FOR ALL USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_gym_members_user_id ON gym_members(user_id);
CREATE INDEX IF NOT EXISTS idx_gym_finances_user_id ON gym_finances(user_id);
CREATE INDEX IF NOT EXISTS idx_sauna_bookings_user_id ON sauna_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_spa_bookings_user_id ON spa_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_sauna_spa_finances_user_id ON sauna_spa_finances(user_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_sales_user_id ON restaurant_sales(user_id);
CREATE INDEX IF NOT EXISTS idx_event_items_user_id ON event_items(user_id);
CREATE INDEX IF NOT EXISTS idx_catering_inventory_user_id ON catering_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_quotations_user_id ON quotations(user_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gym_members_updated_at BEFORE UPDATE ON gym_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gym_finances_updated_at BEFORE UPDATE ON gym_finances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sauna_bookings_updated_at BEFORE UPDATE ON sauna_bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_spa_bookings_updated_at BEFORE UPDATE ON spa_bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sauna_spa_finances_updated_at BEFORE UPDATE ON sauna_spa_finances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_restaurant_sales_updated_at BEFORE UPDATE ON restaurant_sales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_event_items_updated_at BEFORE UPDATE ON event_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_catering_inventory_updated_at BEFORE UPDATE ON catering_inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quotations_updated_at BEFORE UPDATE ON quotations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();