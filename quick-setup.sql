-- Quick Setup for KSM Art House
-- Run this in Supabase SQL Editor

-- 1. Create custom users table
CREATE TABLE custom_users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT DEFAULT 'staff',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE custom_users ENABLE ROW LEVEL SECURITY;

-- 3. Allow users to read their own profile
CREATE POLICY "Users can view own profile" ON custom_users 
FOR SELECT USING (auth.uid() = id);

-- 4. Allow users to insert their own profile
CREATE POLICY "Users can insert own profile" ON custom_users 
FOR INSERT WITH CHECK (auth.uid() = id);

-- 5. Create trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO custom_users (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'Name'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'staff')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create trigger
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 7. Create cloud sync data table
CREATE TABLE cloud_sync_data (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}',
  device_id TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Enable RLS for cloud_sync_data
ALTER TABLE cloud_sync_data ENABLE ROW LEVEL SECURITY;

-- 9. Allow users to manage their own sync data
CREATE POLICY "Users can manage own sync data" ON cloud_sync_data
FOR ALL USING (auth.uid() = user_id);