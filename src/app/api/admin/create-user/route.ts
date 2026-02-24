import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';

// Helper to check if requester is admin or high-level staff
const checkAdminRole = async (token: string) => {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    // Create an authenticated client for the requester
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    
    const { data: { user }, error } = await client.auth.getUser();
    if (error || !user) return false;
    
    // Check role in metadata
    const role = user.user_metadata?.role;
    return ['admin', 'director', 'investor', 'operations_manager'].includes(role);
  } catch (error) {
    console.error('Check admin role error:', error);
    return false;
  }
};

export async function POST(req: NextRequest) {
  try {
    // 1. Check Authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    const hasPermission = await checkAdminRole(token);
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    
    // 2. Parse body
    const body = await req.json();
    const { email, firstName, lastName, role } = body;
    
    if (!email || !firstName || !lastName || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // 3. Create user with default password
    const defaultPassword = 'KsmHouse2026!';
    
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: defaultPassword,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        role: role,
        must_change_password: true // Set flag to force password change
      }
    });
    
    if (createError) {
      console.error('Error creating user:', createError);
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }
    
    // 4. Return success
    return NextResponse.json({ 
      success: true, 
      user: newUser.user,
      message: `User created with temporary password: ${defaultPassword}` 
    });
    
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
