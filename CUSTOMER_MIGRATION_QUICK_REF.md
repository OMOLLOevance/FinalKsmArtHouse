# Customer Data Migration - Quick Reference

## 📁 Files Created

1. **Migration Script**
   - `supabase/migrations/20260212_customer_data_component.sql`
   - Main migration file - Run this to apply changes

2. **Rollback Script**
   - `supabase/migrations/20260212_customer_data_component_rollback.sql`
   - Use if you need to revert changes

3. **Migration Guide**
   - `CUSTOMER_DATA_MIGRATION_GUIDE.md`
   - Detailed instructions and verification steps

---

## ⚡ Quick Start

### Apply Migration (Supabase Dashboard)
```
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of: 20260212_customer_data_component.sql
3. Paste and click "Run"
4. Verify success message
```

### Apply Migration (CLI)
```bash
cd /home/that/Desktop/client\ jobs/FinalKsmArtHouse
supabase db push
```

---

## ✅ What Gets Added

### New Columns
- `user_id` - Track who created the customer
- `total_amount` - Total service cost
- `paid_amount` - Amount paid
- `payment_status` - pending/deposit/full
- `payment_method` - cash/bank/mpesa
- `service_status` - pending/served
- `requirements` - JSONB for custom data
- `source` - Where customer came from

### Performance Indexes
- 6 indexes for fast queries
- Optimized for month filtering
- Optimized for staff filtering

### Security (RLS)
- View: All authenticated users
- Insert/Update: Own customers only
- Delete: Directors/investors only

### Bonus Features
- `customer_summary` view with computed fields
- Auto-update `updated_at` trigger
- Balance calculation
- Payment summary

---

## 🔍 Quick Verification

After running migration:

```sql
-- Check columns exist
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'customers';

-- Test insert
INSERT INTO customers (name, total_amount, payment_status) 
VALUES ('Test', 10000, 'pending');

-- Check summary view
SELECT * FROM customer_summary LIMIT 1;

-- Clean up
DELETE FROM customers WHERE name = 'Test';
```

---

## 🎯 Database Schema

```
customers
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── name (TEXT, NOT NULL)
├── contact (TEXT)
├── location (TEXT)
├── event_type (TEXT)
├── event_date (DATE)
├── total_amount (NUMERIC)
├── paid_amount (NUMERIC)
├── payment_status (TEXT) ← pending|deposit|full
├── payment_method (TEXT) ← cash|bank|mpesa
├── service_status (TEXT) ← pending|served
├── notes (TEXT)
├── requirements (JSONB)
├── source (TEXT) ← core|gym|sauna|allocation|decor|quotation
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```

---

## 🚀 Frontend Integration

### API Already Supports
```typescript
// Month filtering
GET /api/customers?month=3&year=2026

// All customers
GET /api/customers

// Create customer
POST /api/customers
{
  "name": "John Doe",
  "total_amount": 150000,
  "payment_status": "pending"
}
```

### TypeScript Type
```typescript
// Already defined in src/types/customer.ts
interface Customer {
  id: string;
  name: string;
  contact: string;
  location: string;
  eventType: string;
  eventDate: string;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: 'deposit' | 'full' | 'pending';
  paymentMethod: 'cash' | 'bank' | 'mpesa';
  serviceStatus: 'pending' | 'served';
  notes: string;
  requirements?: Record<string, number>;
  source?: 'core' | 'gym' | 'sauna' | 'allocation' | 'decor' | 'quotation';
}
```

---

## ⚠️ Important Notes

1. **Backward Compatible** - Won't break existing data
2. **Idempotent** - Safe to run multiple times
3. **No Downtime** - Can apply while app is running
4. **Data Preserved** - Rollback doesn't delete columns by default

---

## 📞 Need Help?

- **Full Guide:** See `CUSTOMER_DATA_MIGRATION_GUIDE.md`
- **Migration File:** `supabase/migrations/20260212_customer_data_component.sql`
- **Rollback:** `supabase/migrations/20260212_customer_data_component_rollback.sql`

---

**Status:** ✅ Ready to Apply  
**Breaking Changes:** ❌ None  
**Estimated Time:** < 1 minute
