-- Add missing user_id column to monthly_allocations table
ALTER TABLE monthly_allocations 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for user_id
CREATE INDEX IF NOT EXISTS idx_monthly_allocations_user_id ON monthly_allocations(user_id);

-- Enable RLS if not already enabled
ALTER TABLE monthly_allocations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies if they don't exist
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view their own allocations" ON monthly_allocations;
    DROP POLICY IF EXISTS "Users can insert their own allocations" ON monthly_allocations;
    DROP POLICY IF EXISTS "Users can update their own allocations" ON monthly_allocations;
    DROP POLICY IF EXISTS "Users can delete their own allocations" ON monthly_allocations;
    
    -- Create new policies
    CREATE POLICY "Users can view their own allocations" ON monthly_allocations
      FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY "Users can insert their own allocations" ON monthly_allocations
      FOR INSERT WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update their own allocations" ON monthly_allocations
      FOR UPDATE USING (auth.uid() = user_id);

    CREATE POLICY "Users can delete their own allocations" ON monthly_allocations
      FOR DELETE USING (auth.uid() = user_id);
END $$;