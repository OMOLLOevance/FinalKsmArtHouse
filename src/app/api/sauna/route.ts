import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import { ApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';

import { getClientWithRole, getUserRole } from '@/lib/auth-utils';

const BookingSchema = z.object({
  user_id: z.string().uuid(),
  booking_date: z.string(),
  booking_time: z.string(),
  client_name: z.string(),
  service: z.string().optional().nullable(),
  duration: z.number().default(0),
  amount: z.number().default(0),
  status: z.enum(['booked', 'completed']).default('booked'),
  notes: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fields = searchParams.get('fields') || '*';
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');
  const filterUserId = searchParams.get('filterUserId');
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');

  try {
    const { client, user } = await getClientWithRole(token);
    const finalClient = client || supabase;
    const userRole = user ? await getUserRole(user.id, finalClient) : 'staff';
    const isManager = ['director', 'investor', 'operations_manager'].includes(userRole);

    let query = finalClient.from('sauna_bookings').select(fields);

    // Apply User Filtering
    if (filterUserId && isManager) {
      query = query.eq('user_id', filterUserId);
    } else if (!isManager && user) {
      query = query.eq('user_id', user.id);
    }

    query = query.order('booking_date', { ascending: false })
      .range(offset, offset + limit - 1);

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
    const body = await request.json();
    const userId = body.userId || body.user_id;

    const dataToValidate = {
      user_id: userId,
      booking_date: body.booking_date || body.date,
      booking_time: body.booking_time || body.time,
      client_name: body.client_name || body.client,
      service: body.service,
      duration: Number(body.duration || 0),
      amount: Number(body.amount || 0),
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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    
    // Block all updates as per RBAC requirements
    return NextResponse.json({ error: 'Forbidden: Transaction updates are not allowed' }, { status: 403 });
  } catch (error) {
    logger.error('Sauna PUT Error:', error);
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
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