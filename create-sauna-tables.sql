-- Create missing sauna and spa tables
-- Run this in Supabase SQL Editor

-- Create sauna_bookings table
CREATE TABLE IF NOT EXISTS sauna_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME NOT NULL,
  client TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  duration INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('booked', 'completed')) DEFAULT 'booked',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create spa_bookings table
CREATE TABLE IF NOT EXISTS spa_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME NOT NULL,
  client TEXT NOT NULL,
  service TEXT NOT NULL,
  duration INTEGER NOT NULL DEFAULT 60,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT CHECK (status IN ('booked', 'completed')) DEFAULT 'booked',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create sauna_spa_finances table
CREATE TABLE IF NOT EXISTS sauna_spa_finances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type TEXT CHECK (type IN ('sauna-profit', 'spa-profit', 'expense')) NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  category TEXT CHECK (category IN ('sauna', 'spa', 'general')) DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE sauna_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE spa_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sauna_spa_finances ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage own sauna bookings" ON sauna_bookings
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own spa bookings" ON spa_bookings
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own sauna spa finances" ON sauna_spa_finances
FOR ALL USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sauna_bookings_user_id ON sauna_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_sauna_bookings_date ON sauna_bookings(date DESC);
CREATE INDEX IF NOT EXISTS idx_spa_bookings_user_id ON spa_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_spa_bookings_date ON spa_bookings(date DESC);
CREATE INDEX IF NOT EXISTS idx_sauna_spa_finances_user_id ON sauna_spa_finances(user_id);
CREATE INDEX IF NOT EXISTS idx_sauna_spa_finances_date ON sauna_spa_finances(date DESC);