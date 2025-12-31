import { supabase } from '@/lib/supabase';

export const setupDatabase = async () => {
  try {
    console.log('🚀 Starting database setup...');

    // Create users table first
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.users (
          id UUID REFERENCES auth.users(id) PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          first_name TEXT,
          last_name TEXT,
          role TEXT DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'staff')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    // Create other essential tables
    const tables = [
      `CREATE TABLE IF NOT EXISTS public.customers (
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
      );`,
      
      `CREATE TABLE IF NOT EXISTS public.gym_members (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        member_name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        membership_type TEXT NOT NULL,
        start_date DATE NOT NULL,
        expiry_date DATE NOT NULL,
        status TEXT DEFAULT 'active',
        payment_amount DECIMAL(10,2) NOT NULL,
        payment_status TEXT DEFAULT 'paid',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`,
      
      `CREATE TABLE IF NOT EXISTS public.gym_finances (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        transaction_date DATE NOT NULL,
        description TEXT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        transaction_type TEXT NOT NULL,
        payment_method TEXT DEFAULT 'cash',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`,
      
      `CREATE TABLE IF NOT EXISTS public.restaurant_sales (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        sale_date DATE NOT NULL,
        item_name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        expenses DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`,
      
      `CREATE TABLE IF NOT EXISTS public.sauna_bookings (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        booking_date DATE NOT NULL,
        booking_time TIME NOT NULL,
        client_name TEXT NOT NULL,
        client_phone TEXT,
        duration INTEGER NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        status TEXT DEFAULT 'booked',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`
    ];

    for (const sql of tables) {
      await supabase.rpc('exec_sql', { sql });
    }

    console.log('✅ Database setup completed successfully!');
    return { success: true, message: 'Database setup completed' };
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Setup failed' 
    };
  }
};