-- Migration: Customer Data Component Enhancement
-- Date: 2026-02-12
-- Purpose: Add comprehensive customer data fields and ensure all required columns exist

-- ============================================================================
-- 1. ENSURE CUSTOMERS TABLE EXISTS WITH ALL REQUIRED FIELDS
-- ============================================================================

-- Create customers table if it doesn't exist
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contact TEXT,
    location TEXT,
    event_type TEXT,
    event_date DATE,
    total_amount NUMERIC(12,2) DEFAULT 0,
    paid_amount NUMERIC(12,2) DEFAULT 0,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'deposit', 'full')),
    payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank', 'mpesa')),
    service_status TEXT DEFAULT 'pending' CHECK (service_status IN ('pending', 'served')),
    notes TEXT,
    requirements JSONB,
    source TEXT DEFAULT 'core' CHECK (source IN ('core', 'gym', 'sauna', 'allocation', 'decor', 'quotation')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 2. ADD MISSING COLUMNS (IF THEY DON'T EXIST)
-- ============================================================================

DO $$ 
BEGIN
    -- Add user_id if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='customers' AND column_name='user_id'
    ) THEN
        ALTER TABLE customers ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- Add total_amount if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='customers' AND column_name='total_amount'
    ) THEN
        ALTER TABLE customers ADD COLUMN total_amount NUMERIC(12,2) DEFAULT 0;
    END IF;

    -- Add paid_amount if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='customers' AND column_name='paid_amount'
    ) THEN
        ALTER TABLE customers ADD COLUMN paid_amount NUMERIC(12,2) DEFAULT 0;
    END IF;

    -- Add payment_status if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='customers' AND column_name='payment_status'
    ) THEN
        ALTER TABLE customers ADD COLUMN payment_status TEXT DEFAULT 'pending';
    END IF;

    -- Add payment_method if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='customers' AND column_name='payment_method'
    ) THEN
        ALTER TABLE customers ADD COLUMN payment_method TEXT DEFAULT 'cash';
    END IF;

    -- Add service_status if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='customers' AND column_name='service_status'
    ) THEN
        ALTER TABLE customers ADD COLUMN service_status TEXT DEFAULT 'pending';
    END IF;

    -- Add requirements JSONB if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='customers' AND column_name='requirements'
    ) THEN
        ALTER TABLE customers ADD COLUMN requirements JSONB;
    END IF;

    -- Add source if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='customers' AND column_name='source'
    ) THEN
        ALTER TABLE customers ADD COLUMN source TEXT DEFAULT 'core';
    END IF;
END $$;

-- ============================================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_event_date ON customers(event_date);
CREATE INDEX IF NOT EXISTS idx_customers_payment_status ON customers(payment_status);
CREATE INDEX IF NOT EXISTS idx_customers_service_status ON customers(service_status);
CREATE INDEX IF NOT EXISTS idx_customers_source ON customers(source);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);

-- ============================================================================
-- 4. CREATE/UPDATE TRIGGER FOR UPDATED_AT
-- ============================================================================

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists and recreate
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. CREATE RLS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all customers" ON customers;
DROP POLICY IF EXISTS "Users can insert their own customers" ON customers;
DROP POLICY IF EXISTS "Users can update their own customers" ON customers;
DROP POLICY IF EXISTS "Directors can delete customers" ON customers;

-- Policy: Users can view all customers (authenticated users)
CREATE POLICY "Users can view all customers" ON customers
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Policy: Users can insert their own customers
CREATE POLICY "Users can insert their own customers" ON customers
    FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Policy: Users can update their own customers
CREATE POLICY "Users can update their own customers" ON customers
    FOR UPDATE
    USING (auth.uid() = user_id OR user_id IS NULL);

-- Policy: Only directors and investors can delete
CREATE POLICY "Directors can delete customers" ON customers
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('director', 'investor')
        )
    );

-- ============================================================================
-- 7. CREATE COMPUTED COLUMNS VIEW (OPTIONAL)
-- ============================================================================

CREATE OR REPLACE VIEW customer_summary AS
SELECT 
    c.*,
    (c.total_amount - c.paid_amount) AS balance_due,
    CASE 
        WHEN c.paid_amount >= c.total_amount THEN 'Paid'
        WHEN c.paid_amount > 0 THEN 'Partial'
        ELSE 'Unpaid'
    END AS payment_summary,
    EXTRACT(MONTH FROM c.created_at) AS created_month,
    EXTRACT(YEAR FROM c.created_at) AS created_year
FROM customers c;

-- ============================================================================
-- 8. GRANT PERMISSIONS
-- ============================================================================

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE ON customers TO authenticated;
GRANT SELECT ON customer_summary TO authenticated;

-- ============================================================================
-- VERIFICATION QUERIES (Run these to verify the migration)
-- ============================================================================

-- Check table structure
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'customers'
-- ORDER BY ordinal_position;

-- Check indexes
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'customers';

-- Check RLS policies
-- SELECT policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'customers';

-- Check triggers
-- SELECT trigger_name, event_manipulation, event_object_table
-- FROM information_schema.triggers
-- WHERE event_object_table = 'customers';
