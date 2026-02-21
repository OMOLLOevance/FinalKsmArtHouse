import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import { ApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';

const BookingSchema = z.object({
  user_id: z.string().uuid(),
  date: z.string(),
  time: z.string(),
  client: z.string(),
  service: z.string().optional().nullable(),
  duration: z.number().default(0),
  amount: z.number().default(0),
  status: z.enum(['booked', 'completed']).default('booked'),
  notes: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawFields = searchParams.get('fields') || '*';
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');

  // Map requested fields to actual DB columns if they use legacy names
  let fields = rawFields
    .replace('booking_date', 'date')
    .replace('booking_time', 'time')
    .replace('client_name', 'client');

  try {
    let query = supabase
      .from('sauna_bookings')
      .select(fields)
      .order('date', { ascending: false })
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
      date: body.date || body.booking_date,
      time: body.time || body.booking_time,
      client: body.client || body.client_name,
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