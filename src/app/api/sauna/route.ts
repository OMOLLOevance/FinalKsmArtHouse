import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { ApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { isManager } from '@/lib/auth-utils';

const BookingSchema = z.object({
  user_id: z.string().uuid(),
  booking_date: z.string(),
  booking_time: z.string(),
  client_name: z.string(),
  client_phone: z.string().optional().nullable(),
  duration: z.number(),
  amount: z.number(),
  status: z.enum(['booked', 'completed']).default('booked'),
  notes: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
    const userIsManager = isManager(profile?.role || 'staff');

    const { searchParams } = new URL(request.url);
    const fields = searchParams.get('fields') || '*';
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const filterUserId = searchParams.get('filterUserId');
    
    let query = supabase
      .from('sauna_bookings')
      .select(fields)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filterUserId && userIsManager) {
      query = query.eq('user_id', filterUserId);
    } else if (!userIsManager) {
      query = query.eq('user_id', user.id);
    }

    const { data, error } = await query;
    if (error) throw ApiError.fromSupabase(error);

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    logger.error(`Sauna GET Error:`, error);
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status });
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
    
    const dataToValidate = {
      user_id: user.id,
      booking_date: body.date || body.booking_date,
      booking_time: body.time || body.booking_time,
      client_name: body.client || body.client_name,
      client_phone: body.client_phone,
      duration: body.duration,
      amount: body.amount,
      status: body.status || 'booked',
      notes: body.notes
    };

    const validatedData = BookingSchema.parse(dataToValidate);

    const { data: inserted, error } = await supabase
      .from('sauna_bookings')
      .insert([validatedData])
      .select()
      .single();

    if (error) throw ApiError.fromSupabase(error);

    return NextResponse.json({ data: inserted });
  } catch (error) {
    logger.error('Sauna POST Error:', error);
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
      .from('sauna_bookings')
      .delete()
      .eq('id', id);

    if (error) throw ApiError.fromSupabase(error);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Sauna DELETE Error:', error);
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status });
  }
}
