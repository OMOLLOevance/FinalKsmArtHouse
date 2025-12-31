# Database Setup Instructions

## 1. Run the Database Schema

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `database-setup.sql`
4. Click "Run" to execute the schema

## 2. Verify Tables Created

The following tables should be created:
- `users` - User profiles
- `customers` - Event customers
- `gym_members` - Gym memberships
- `gym_finances` - Gym financial records
- `sauna_bookings` - Sauna reservations
- `spa_bookings` - Spa reservations
- `sauna_spa_finances` - Sauna/Spa finances
- `restaurant_sales` - Restaurant sales records
- `event_items` - Event equipment and services
- `catering_inventory` - Catering inventory tracking
- `quotations` - Customer quotations

## 3. Row Level Security (RLS)

All tables have RLS enabled with policies that ensure:
- Users can only access their own data
- Admins can access all data
- Secure multi-tenant architecture

## 4. Default Data

The system will automatically seed default data when a user first logs in:
- Catering inventory structure
- Default event items
- User profile creation

## 5. Features Enabled

✅ **Real-time Updates** - All data syncs in real-time
✅ **Multi-user Support** - Each user has isolated data
✅ **Audit Trail** - Created/updated timestamps on all records
✅ **Data Validation** - Database constraints ensure data integrity
✅ **Performance** - Proper indexing for fast queries

## 6. Connection Status

The application will show connection status and guide users through any setup issues.

## Troubleshooting

If you see "Tables not found" errors:
1. Ensure you've run the `database-setup.sql` script
2. Check that RLS policies are enabled
3. Verify your Supabase credentials in `.env.local`