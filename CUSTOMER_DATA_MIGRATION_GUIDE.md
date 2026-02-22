# Customer Data Component Migration Guide

## Overview
This migration adds comprehensive customer data fields to support the new Customer Data component.

**Migration File:** `20260212_customer_data_component.sql`  
**Rollback File:** `20260212_customer_data_component_rollback.sql`

---

## What This Migration Does

### 1. **Ensures Customers Table Exists**
Creates the `customers` table if it doesn't exist with all required fields.

### 2. **Adds Missing Columns**
- `user_id` - Links customer to the user who created it
- `total_amount` - Total cost of services
- `paid_amount` - Amount already paid
- `payment_status` - pending | deposit | full
- `payment_method` - cash | bank | mpesa
- `service_status` - pending | served
- `requirements` - JSONB field for custom requirements
- `source` - Tracks where customer came from (core, gym, sauna, etc.)

### 3. **Creates Performance Indexes**
- Index on `user_id` for filtering by staff
- Index on `event_date` for date-based queries
- Index on `payment_status` for payment tracking
- Index on `service_status` for service tracking
- Index on `source` for source filtering
- Index on `created_at` for month filtering

### 4. **Sets Up Auto-Update Trigger**
Automatically updates `updated_at` timestamp on record changes.

### 5. **Implements Row Level Security (RLS)**
- Users can view all customers
- Users can insert/update their own customers
- Only directors/investors can delete customers

### 6. **Creates Summary View**
`customer_summary` view with computed fields:
- `balance_due` - Remaining amount to be paid
- `payment_summary` - Paid | Partial | Unpaid
- `created_month` - Month customer was created
- `created_year` - Year customer was created

---

## How to Apply the Migration

### Option 1: Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Paste Migration**
   - Open `20260212_customer_data_component.sql`
   - Copy all contents
   - Paste into SQL Editor

4. **Run Migration**
   - Click "Run" button
   - Wait for success message

5. **Verify Migration**
   - Run verification queries at the bottom of the migration file
   - Check that all columns exist
   - Verify indexes are created
   - Confirm RLS policies are active

### Option 2: Supabase CLI

```bash
# Navigate to project directory
cd /home/that/Desktop/client\ jobs/FinalKsmArtHouse

# Apply migration using Supabase CLI
supabase db push

# Or apply specific migration
supabase migration up --file supabase/migrations/20260212_customer_data_component.sql
```

### Option 3: Direct SQL Connection

```bash
# Using psql
psql "postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]" \
  -f supabase/migrations/20260212_customer_data_component.sql
```

---

## Verification Steps

After applying the migration, run these queries to verify:

### 1. Check Table Structure
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'customers'
ORDER BY ordinal_position;
```

**Expected Columns:**
- id (uuid)
- user_id (uuid)
- name (text)
- contact (text)
- location (text)
- event_type (text)
- event_date (date)
- total_amount (numeric)
- paid_amount (numeric)
- payment_status (text)
- payment_method (text)
- service_status (text)
- notes (text)
- requirements (jsonb)
- source (text)
- created_at (timestamptz)
- updated_at (timestamptz)

### 2. Check Indexes
```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'customers';
```

**Expected Indexes:**
- idx_customers_user_id
- idx_customers_event_date
- idx_customers_payment_status
- idx_customers_service_status
- idx_customers_source
- idx_customers_created_at

### 3. Check RLS Policies
```sql
SELECT policyname, permissive, cmd
FROM pg_policies
WHERE tablename = 'customers';
```

**Expected Policies:**
- Users can view all customers (SELECT)
- Users can insert their own customers (INSERT)
- Users can update their own customers (UPDATE)
- Directors can delete customers (DELETE)

### 4. Test Customer Summary View
```sql
SELECT * FROM customer_summary LIMIT 5;
```

---

## Testing the Migration

### 1. Insert Test Customer
```sql
INSERT INTO customers (
    user_id, name, contact, location, event_type, event_date,
    total_amount, paid_amount, payment_status, payment_method,
    service_status, source, notes
) VALUES (
    auth.uid(), -- Current user
    'Test Customer',
    '+254700000000',
    'Nairobi',
    'Wedding',
    '2026-03-15',
    150000,
    50000,
    'deposit',
    'mpesa',
    'pending',
    'core',
    'Test customer for migration verification'
);
```

### 2. Query Test Customer
```sql
SELECT * FROM customers WHERE name = 'Test Customer';
```

### 3. Check Summary View
```sql
SELECT * FROM customer_summary WHERE name = 'Test Customer';
```

**Expected Results:**
- balance_due: 100000
- payment_summary: 'Partial'
- created_month: Current month
- created_year: 2026

### 4. Test Month Filtering
```sql
-- Get customers created in current month
SELECT * FROM customers 
WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM now())
  AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM now());
```

### 5. Clean Up Test Data
```sql
DELETE FROM customers WHERE name = 'Test Customer';
```

---

## Rollback Instructions

If you need to rollback the migration:

### 1. Apply Rollback Script
```sql
-- In Supabase SQL Editor
-- Copy contents of 20260212_customer_data_component_rollback.sql
-- Paste and run
```

### 2. Verify Rollback
```sql
-- Check that policies are removed
SELECT * FROM pg_policies WHERE tablename = 'customers';

-- Check that view is removed
SELECT * FROM information_schema.views WHERE table_name = 'customer_summary';
```

**⚠️ WARNING:** The rollback script does NOT remove columns by default to preserve data. If you need to remove columns, uncomment the ALTER TABLE statements in the rollback script.

---

## Integration with Frontend

After applying the migration, update your frontend code:

### 1. Update API Route
The `/api/customers` route already supports month filtering:
```typescript
GET /api/customers?month=3&year=2026
```

### 2. Update Customer Type
The TypeScript interface in `/src/types/customer.ts` already matches the database schema.

### 3. Test API Endpoints
```bash
# Test customer creation
curl -X POST http://localhost:3000/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Customer",
    "contact": "+254700000000",
    "total_amount": 150000,
    "payment_status": "pending"
  }'

# Test month filtering
curl http://localhost:3000/api/customers?month=2&year=2026
```

---

## Troubleshooting

### Issue: "relation customers already exists"
**Solution:** This is normal. The migration uses `CREATE TABLE IF NOT EXISTS`, so it won't fail if the table exists.

### Issue: "column already exists"
**Solution:** The migration checks for existing columns before adding them. This is expected behavior.

### Issue: "permission denied"
**Solution:** Ensure you're running the migration with proper database permissions (superuser or owner).

### Issue: RLS policies blocking queries
**Solution:** 
1. Check that you're authenticated
2. Verify user has proper role in `users` table
3. Temporarily disable RLS for testing: `ALTER TABLE customers DISABLE ROW LEVEL SECURITY;`

---

## Next Steps

1. ✅ Apply migration
2. ✅ Verify all checks pass
3. ✅ Test with sample data
4. ✅ Update frontend components
5. ✅ Deploy to production
6. ✅ Monitor for issues

---

**Migration Created:** February 12, 2026  
**Status:** Ready for deployment  
**Breaking Changes:** None (backward compatible)
