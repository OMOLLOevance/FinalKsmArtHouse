-- Rollback Migration: Customer Data Component Enhancement
-- Date: 2026-02-12
-- Purpose: Rollback customer data component changes if needed

-- ============================================================================
-- WARNING: This will remove columns and data. Use with caution!
-- ============================================================================

-- 1. Drop the customer summary view
DROP VIEW IF EXISTS customer_summary;

-- 2. Drop RLS policies
DROP POLICY IF EXISTS "Users can view all customers" ON customers;
DROP POLICY IF EXISTS "Users can insert their own customers" ON customers;
DROP POLICY IF EXISTS "Users can update their own customers" ON customers;
DROP POLICY IF EXISTS "Directors can delete customers" ON customers;

-- 3. Drop indexes (optional - only if you want to remove performance optimizations)
-- DROP INDEX IF EXISTS idx_customers_user_id;
-- DROP INDEX IF EXISTS idx_customers_event_date;
-- DROP INDEX IF EXISTS idx_customers_payment_status;
-- DROP INDEX IF EXISTS idx_customers_service_status;
-- DROP INDEX IF EXISTS idx_customers_source;
-- DROP INDEX IF EXISTS idx_customers_created_at;

-- 4. Drop trigger
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;

-- 5. Remove added columns (CAUTION: This will delete data!)
-- Uncomment only if you really want to remove these columns
/*
ALTER TABLE customers DROP COLUMN IF EXISTS user_id;
ALTER TABLE customers DROP COLUMN IF EXISTS total_amount;
ALTER TABLE customers DROP COLUMN IF EXISTS paid_amount;
ALTER TABLE customers DROP COLUMN IF EXISTS payment_status;
ALTER TABLE customers DROP COLUMN IF EXISTS payment_method;
ALTER TABLE customers DROP COLUMN IF EXISTS service_status;
ALTER TABLE customers DROP COLUMN IF EXISTS requirements;
ALTER TABLE customers DROP COLUMN IF EXISTS source;
*/

-- 6. Disable RLS (optional)
-- ALTER TABLE customers DISABLE ROW LEVEL SECURITY;

-- Note: The table itself is NOT dropped to preserve existing data
-- If you want to completely remove the table, uncomment:
-- DROP TABLE IF EXISTS customers CASCADE;
