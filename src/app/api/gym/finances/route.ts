import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { ApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { isManager } from '@/lib/auth-utils';

const GymFinanceSchema = z.object({
  user_id: z.string().uuid(),
  transaction_date: z.string(),
  description: z.string().min(1),
  amount: z.number(),
  transaction_type: z.enum(['income', 'expense', 'membership']),
  payment_method: z.string().default('cash'),
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
    const fields = searchParams.get('fields') || '*';
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const filterUserId = searchParams.get('filterUserId');

    let query = supabase
      .from('gym_finances')
      .select(fields)
      .order('transaction_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filterUserId && userIsManager) {
      query = query.eq('user_id', filterUserId);
    } else if (!userIsManager) {
      query = query.eq('user_id', user.id);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Gym Finances GET Error:', error);
      return NextResponse.json({ data: [], error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    logger.error('Gym Finances GET Error:', error);
    return NextResponse.json({ data: [], error: 'Internal Server Error' }, { status: 500 });
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
    const validatedData = GymFinanceSchema.parse({
      ...body,
      user_id: user.id,
    });
    
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
    const userRole = profile?.role || 'staff';

    if (userRole === 'staff' && validatedData.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden: Staff can only create their own transactions' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('gym_finances')
      .insert([validatedData])
      .select()
      .single();

    if (error) throw ApiError.fromSupabase(error);

    return NextResponse.json({ data });
  } catch (error) {
    logger.error('Gym Finances POST Error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 });
    }
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status });
  }
}

export async function PUT(_request: NextRequest) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Block all updates as per original business logic
    return NextResponse.json({ error: 'Forbidden: Transaction updates are not allowed' }, { status: 403 });
}

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
    const userRole = profile?.role || 'staff';
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    
    if (!['director', 'investor'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden: Only directors and investors can delete transactions' }, { status: 403 });
    }

    const { error } = await supabase
      .from('gym_finances')
      .delete()
      .eq('id', id);

    if (error) throw ApiError.fromSupabase(error);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Gym Finances DELETE Error:', error);
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status });
  }
}
