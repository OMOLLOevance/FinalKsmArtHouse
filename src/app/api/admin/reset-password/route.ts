import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';

const checkAdminRole = async (token: string) => {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    
    const { data: { user }, error } = await client.auth.getUser();
    if (error || !user) return false;
    
    const role = user.user_metadata?.role;
    return ['admin', 'director', 'investor', 'operations_manager'].includes(role);
  } catch (error) {
    return false;
  }
};

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    const hasPermission = await checkAdminRole(token);
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const { userId } = await req.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
    }
    
    // 1. Update password in auth.users
    const defaultPassword = 'KsmHouse2026!';
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { 
        password: defaultPassword,
        user_metadata: { must_change_password: true }
      }
    );
    
    if (authError) throw authError;
    
    // 2. Update must_change_password in public.users
    // (Trigger should handle this but let's be explicit if metadata update doesn't trigger it)
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .update({ must_change_password: true })
      .eq('id', userId);
    
    if (profileError) throw profileError;
    
    return NextResponse.json({ 
      success: true, 
      message: `Password reset to ${defaultPassword}` 
    });
    
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
