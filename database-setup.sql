-- Complete KSM.ART HOUSE Database Schema
-- Run this in your Supabase SQL Editor

-- Enable RLS (Row Level Security)
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'staff')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customers table (for events)
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact TEXT,
  location TEXT,
  event_type TEXT,
  event_date DATE,
  total_amount DECIMAL(10,2) DEFAULT 0,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('deposit', 'full', 'pending')),
  payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank', 'mpesa')),
  service_status TEXT DEFAULT 'pending' CHECK (service_status IN ('pending', 'served')),
  notes TEXT,
  requirements JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create gym_members table
CREATE TABLE IF NOT EXISTS public.gym_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  member_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  membership_type TEXT NOT NULL CHECK (membership_type IN ('weekly', 'monthly', 'three-months')),
  start_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired')),
  payment_amount DECIMAL(10,2) NOT NULL,
  payment_status TEXT DEFAULT 'paid' CHECK (payment_status IN ('paid', 'pending', 'partial')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create gym_finances table
CREATE TABLE IF NOT EXISTS public.gym_finances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense', 'membership')),
  payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank', 'mpesa')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sauna_bookings table
CREATE TABLE IF NOT EXISTS public.sauna_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  duration INTEGER NOT NULL, -- in minutes
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'booked' CHECK (status IN ('booked', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create spa_bookings table
CREATE TABLE IF NOT EXISTS public.spa_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  service_type TEXT NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'booked' CHECK (status IN ('booked', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sauna_spa_finances table
CREATE TABLE IF NOT EXISTS public.sauna_spa_finances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sauna-profit', 'spa-profit', 'expense')),
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('sauna', 'spa', 'general')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create restaurant_sales table
CREATE TABLE IF NOT EXISTS public.restaurant_sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  sale_date DATE NOT NULL,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  expenses DECIMAL(10,2) DEFAULT 0,
  profit DECIMAL(10,2) GENERATED ALWAYS AS (total_amount - expenses) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create event_items table (for catering, decor, entertainment, sanitation)
CREATE TABLE IF NOT EXISTS public.event_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('catering', 'decor', 'entertainment', 'sanitation', 'sound', 'lighting', 'dj', 'mc')),
  quantity_available INTEGER DEFAULT 0,
  price DECIMAL(10,2) NOT NULL,
  unit TEXT DEFAULT 'pieces',
  description TEXT,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'hired', 'maintenance')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create catering_inventory table
CREATE TABLE IF NOT EXISTS public.catering_inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  item_number INTEGER NOT NULL,
  particular TEXT DEFAULT '',
  good_condition INTEGER DEFAULT 0,
  repair_needed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, category, item_number)
);

-- Create quotations table
CREATE TABLE IF NOT EXISTS public.quotations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  quotation_number TEXT UNIQUE NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected')),
  valid_until DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_event_date ON public.customers(event_date);
CREATE INDEX IF NOT EXISTS idx_gym_members_user_id ON public.gym_members(user_id);
CREATE INDEX IF NOT EXISTS idx_gym_members_status ON public.gym_members(status);
CREATE INDEX IF NOT EXISTS idx_gym_finances_user_id ON public.gym_finances(user_id);
CREATE INDEX IF NOT EXISTS idx_sauna_bookings_user_id ON public.sauna_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_sales_user_id ON public.restaurant_sales(user_id);
CREATE INDEX IF NOT EXISTS idx_event_items_user_id ON public.event_items(user_id);
CREATE INDEX IF NOT EXISTS idx_event_items_category ON public.event_items(category);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_finances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sauna_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spa_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sauna_spa_finances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catering_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Customers policies
CREATE POLICY "Users can manage own customers" ON public.customers FOR ALL USING (auth.uid() = user_id);

-- Gym policies
CREATE POLICY "Users can manage own gym members" ON public.gym_members FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own gym finances" ON public.gym_finances FOR ALL USING (auth.uid() = user_id);

-- Sauna/Spa policies
CREATE POLICY "Users can manage own sauna bookings" ON public.sauna_bookings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own spa bookings" ON public.spa_bookings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own sauna spa finances" ON public.sauna_spa_finances FOR ALL USING (auth.uid() = user_id);

-- Restaurant policies
CREATE POLICY "Users can manage own restaurant sales" ON public.restaurant_sales FOR ALL USING (auth.uid() = user_id);

-- Event items policies
CREATE POLICY "Users can manage own event items" ON public.event_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own catering inventory" ON public.catering_inventory FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own quotations" ON public.quotations FOR ALL USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gym_members_updated_at BEFORE UPDATE ON public.gym_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gym_finances_updated_at BEFORE UPDATE ON public.gym_finances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sauna_bookings_updated_at BEFORE UPDATE ON public.sauna_bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_spa_bookings_updated_at BEFORE UPDATE ON public.spa_bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sauna_spa_finances_updated_at BEFORE UPDATE ON public.sauna_spa_finances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_restaurant_sales_updated_at BEFORE UPDATE ON public.restaurant_sales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_event_items_updated_at BEFORE UPDATE ON public.event_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_catering_inventory_updated_at BEFORE UPDATE ON public.catering_inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quotations_updated_at BEFORE UPDATE ON public.quotations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default catering inventory structure
INSERT INTO public.catering_inventory (user_id, category, item_number, particular, good_condition, repair_needed)
SELECT 
  auth.uid(),
  category,
  item_number,
  '',
  0,
  0
FROM (
  SELECT 'cups' as category, generate_series(1, 3) as item_number
  UNION ALL
  SELECT 'plates', generate_series(1, 9)
  UNION ALL
  SELECT 'cutleries', generate_series(1, 12)
  UNION ALL
  SELECT 'glasses', generate_series(1, 6)
  UNION ALL
  SELECT 'jugs', generate_series(1, 4)
  UNION ALL
  SELECT 'bowls', generate_series(1, 11)
  UNION ALL
  SELECT 'display_stands', generate_series(1, 5)
  UNION ALL
  SELECT 'juice', generate_series(1, 3)
  UNION ALL
  SELECT 'general_utensils', generate_series(1, 16)
  UNION ALL
  SELECT 'chaffing_dishes', generate_series(1, 11)
  UNION ALL
  SELECT 'wash_up', generate_series(1, 4)
  UNION ALL
  SELECT 'cooking_stuffs', generate_series(1, 15)
  UNION ALL
  SELECT 'uniforms', generate_series(1, 9)
) categories
ON CONFLICT (user_id, category, item_number) DO NOTHING;