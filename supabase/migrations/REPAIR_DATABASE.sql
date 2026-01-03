-- KSM.ART HOUSE Complete Professional Database Setup & Repair
-- Run this in your Supabase SQL Editor.

-- 1. Users
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'staff', 'director')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Customers
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact TEXT,
  location TEXT,
  event_type TEXT,
  event_date DATE,
  total_amount DECIMAL(10,2) DEFAULT 0,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  payment_status TEXT DEFAULT 'pending',
  payment_method TEXT DEFAULT 'cash',
  service_status TEXT DEFAULT 'pending',
  notes TEXT,
  requirements JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Gym Members
CREATE TABLE IF NOT EXISTS public.gym_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  member_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  membership_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  status TEXT DEFAULT 'active',
  payment_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_status TEXT DEFAULT 'paid',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Gym Finances
CREATE TABLE IF NOT EXISTS public.gym_finances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL DEFAULT NOW(),
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  transaction_type TEXT NOT NULL,
  payment_method TEXT DEFAULT 'cash',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Restaurant Sales
CREATE TABLE IF NOT EXISTS public.restaurant_sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sale_date DATE NOT NULL DEFAULT NOW(),
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  expenses DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Sauna Bookings
CREATE TABLE IF NOT EXISTS public.sauna_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL DEFAULT NOW(),
  booking_time TIME NOT NULL DEFAULT NOW(),
  client_name TEXT NOT NULL,
  client_phone TEXT,
  duration INTEGER NOT NULL DEFAULT 60,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'booked',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Event Items (Inventory for Decor, Sanitation, Entertainment)
CREATE TABLE IF NOT EXISTS public.event_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity_available INTEGER DEFAULT 0,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'pieces',
  description TEXT,
  status TEXT DEFAULT 'available',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Catering Inventory (Physical Assets)
CREATE TABLE IF NOT EXISTS public.catering_inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  particular TEXT NOT NULL,
  good_condition INTEGER DEFAULT 0,
  repair_needed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Catering Items (Service/Billing Items)
CREATE TABLE IF NOT EXISTS public.catering_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT DEFAULT 'pieces',
  price_per_plate DECIMAL(10,2) NOT NULL DEFAULT 0,
  min_order INTEGER DEFAULT 0,
  description TEXT,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_finances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sauna_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catering_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catering_items ENABLE ROW LEVEL SECURITY;

-- 10. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_gym_members_user_id ON public.gym_members(user_id);
CREATE INDEX IF NOT EXISTS idx_gym_finances_user_id ON public.gym_finances(user_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_sales_user_id ON public.restaurant_sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sauna_bookings_user_id ON public.sauna_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_event_items_user_id ON public.event_items(user_id);
CREATE INDEX IF NOT EXISTS idx_catering_inventory_user_id ON public.catering_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_catering_items_user_id ON public.catering_items(user_id);

CREATE INDEX IF NOT EXISTS idx_restaurant_sale_date ON public.restaurant_sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_gym_transaction_date ON public.gym_finances(transaction_date);
CREATE INDEX IF NOT EXISTS idx_sauna_booking_date ON public.sauna_bookings(booking_date);

-- 11. Create trigger function for new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'staff')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 13. Create unified security policies
DO $$
BEGIN
    -- Users table policies
    DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
    CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
    
    DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
    CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
    
    -- Other table policies
    DROP POLICY IF EXISTS "Manage own customers" ON public.customers;
    CREATE POLICY "Manage own customers" ON public.customers FOR ALL USING (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "Manage own gym members" ON public.gym_members;
    CREATE POLICY "Manage own gym members" ON public.gym_members FOR ALL USING (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "Manage own gym finances" ON public.gym_finances;
    CREATE POLICY "Manage own gym finances" ON public.gym_finances FOR ALL USING (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "Manage own restaurant sales" ON public.restaurant_sales;
    CREATE POLICY "Manage own restaurant sales" ON public.restaurant_sales FOR ALL USING (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "Manage own sauna bookings" ON public.sauna_bookings;
    CREATE POLICY "Manage own sauna bookings" ON public.sauna_bookings FOR ALL USING (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "Manage own event items" ON public.event_items;
    CREATE POLICY "Manage own event items" ON public.event_items FOR ALL USING (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "Manage own catering inventory" ON public.catering_inventory;
    CREATE POLICY "Manage own catering inventory" ON public.catering_inventory FOR ALL USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Manage own catering items" ON public.catering_items;
    CREATE POLICY "Manage own catering items" ON public.catering_items FOR ALL USING (auth.uid() = user_id);
END
$$;
