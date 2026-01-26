import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { ApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { isManager } from '@/lib/auth-utils';

const CateringInventorySchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  category: z.string().min(1),
  particular: z.string().min(1),
  good_condition: z.number().int().min(0).default(0),
  repair_needed: z.number().int().min(0).default(0),
});

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
    const userIsManager = isManager(profile?.role || 'staff');
    
    const { searchParams } = new URL(request.url);
    const filterUserId = searchParams.get('filterUserId');

    let query = supabase
      .from('catering_inventory')
      .select('*')
      .order('category', { ascending: true })
      .order('particular', { ascending: true });

    // RBAC Filtering Logic
    if (filterUserId) {
      query = query.eq('user_id', filterUserId);
    } else if (!userIsManager) {
      query = query.eq('user_id', user.id);
    }

    const { data, error } = await query;

    if (error) {
        logger.error('Catering Inventory GET Database Error:', error);
        throw ApiError.fromSupabase(error);
    }

    return NextResponse.json({ data: data || [] });
  } catch (error: any) {
    logger.error('Catering Inventory GET Error:', error);
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json({ 
        error: error.message || 'Internal Server Error',
        details: error.details || null
    }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = CateringInventorySchema.parse(body);

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
    const userRole = profile?.role || 'staff';

    if (userRole === 'staff' && validatedData.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden: Staff can only create their own records' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('catering_inventory')
      .upsert(validatedData)
      .select()
      .single();

    if (error) {
        logger.error('Catering Inventory POST Database Error:', error);
        throw ApiError.fromSupabase(error);
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    logger.error('Catering Inventory POST Error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 });
    }
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json({ 
        error: error.message || 'Internal Server Error',
        details: error.details || null
    }, { status });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
    const userRole = profile?.role || 'staff';
    
    if (!['director', 'investor'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden: Only directors and investors can delete records' }, { status: 403 });
    }

    const { error } = await supabase
      .from('catering_inventory')
      .delete()
      .eq('id', id);

    if (error) {
        logger.error('Catering Inventory DELETE Database Error:', error);
        throw ApiError.fromSupabase(error);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Catering Inventory DELETE Error:', error);
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json({ 
        error: error.message || 'Internal Server Error',
        details: error.details || null
    }, { status });
  }
}
