import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';

// Helper to check if requester is admin or high-level staff
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

export async function GET(req: NextRequest) {
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
    
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;

    // Calculate admin-specific stats
    const adminStats = {
      totalUsers: users.length,
      pendingReset: users.filter(u => u.must_change_password).length,
      adminCount: users.filter(u => ['admin', 'director', 'operations_manager'].includes(u.role)).length
    };
    
    return NextResponse.json({ success: true, users, adminStats });
    
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
