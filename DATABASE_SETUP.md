# Database Setup Instructions for Supabase

## 🚀 **Step-by-Step Database Migration**

### **1. Access Supabase SQL Editor**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `mqnfdmdqfysqxxamgvwc`
3. Navigate to **SQL Editor** in the left sidebar

### **2. Run Migration Script**
1. Copy the contents of `database-migration.sql`
2. Paste into Supabase SQL Editor
3. Click **Run** to execute the migration
4. Wait for completion message

### **3. Verify Database Structure**
1. Copy the contents of `database-verification.sql`
2. Paste into Supabase SQL Editor
3. Click **Run** to verify all tables exist
4. Check the results to ensure all tables are created

### **4. Insert Sample Data (Optional)**
1. Copy the contents of `sample-data.sql`
2. Paste into Supabase SQL Editor
3. Click **Run** to insert test data
4. This will help test the backend API endpoints

### **5. Enable Authentication**
1. Go to **Authentication** > **Settings**
2. Ensure **Enable email confirmations** is configured
3. Set up **Email templates** if needed

### **6. Configure Row Level Security**
The migration script automatically:
- ✅ Enables RLS on all tables
- ✅ Creates policies for user data isolation
- ✅ Sets up proper foreign key constraints

### **7. Test API Endpoints**
After migration, test these endpoints:
- `GET /api/customers?userId=YOUR_USER_ID`
- `GET /api/gym/members?userId=YOUR_USER_ID`
- `GET /api/sauna?userId=YOUR_USER_ID&type=bookings`
- `GET /api/restaurant?userId=YOUR_USER_ID`
- `GET /api/catering?userId=YOUR_USER_ID`
- `GET /api/event-items?userId=YOUR_USER_ID`

## 📊 **Expected Tables After Migration**

| Table Name | Purpose | Records |
|------------|---------|---------|
| `users` | User management | Auth users |
| `customers` | Event customers | Customer data |
| `gym_members` | Gym memberships | Member records |
| `gym_finances` | Gym transactions | Financial data |
| `sauna_bookings` | Sauna reservations | Booking data |
| `spa_bookings` | Spa appointments | Spa records |
| `sauna_spa_finances` | Sauna/Spa finances | Financial data |
| `restaurant_sales` | Restaurant transactions | Sales data |
| `event_items` | Event equipment | Inventory items |
| `catering_inventory` | Catering items | Food inventory |
| `quotations` | Customer quotes | Quote data |

## 🔒 **Security Features**

- **Row Level Security (RLS)** enabled on all tables
- **User data isolation** - users only see their own data
- **Foreign key constraints** for data integrity
- **Indexes** for optimal performance
- **Triggers** for automatic timestamp updates

## 🧪 **Testing Commands**

Run these in Supabase SQL Editor to test:

```sql
-- Check if all tables exist
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Check RLS policies
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';

-- Count records in each table
SELECT 'customers' as table_name, COUNT(*) FROM customers
UNION ALL
SELECT 'gym_members', COUNT(*) FROM gym_members
UNION ALL
SELECT 'event_items', COUNT(*) FROM event_items;
```

## ⚠️ **Important Notes**

1. **User ID**: Replace `auth.uid()` with actual user UUID when testing
2. **Environment**: Ensure `.env.local` has correct Supabase credentials
3. **Authentication**: Users must be authenticated to access data
4. **Permissions**: RLS policies ensure data security

## 🔧 **Troubleshooting**

If you encounter issues:

1. **Permission Denied**: Check RLS policies
2. **Table Not Found**: Re-run migration script
3. **Foreign Key Error**: Ensure user exists in auth.users
4. **Connection Error**: Verify Supabase URL and keys

## ✅ **Success Verification**

After running all scripts, you should see:
- ✅ 11 tables created successfully
- ✅ RLS policies applied
- ✅ Indexes created for performance
- ✅ Sample data inserted (if run)
- ✅ API endpoints working correctly

The database is now ready for the KSM Art House backend API integration!