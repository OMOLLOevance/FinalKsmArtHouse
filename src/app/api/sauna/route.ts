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
  const month = searchParams.get('month');
  const year = searchParams.get('year');
  const filterUserId = searchParams.get('filterUserId');
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');

  try {
    const { client, user } = await getClientWithRole(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const finalClient = client || supabase;
    const userRole = await getUserRole(user.id, finalClient);
    const isManager = ['director', 'investor', 'operations_manager'].includes(userRole);

    // Enforce Access Control
    if (filterUserId && !isManager) {
      return NextResponse.json({ error: 'Forbidden: Managers only' }, { status: 403 });
    }

    let query = finalClient.from('sauna_bookings').select(fields);

    // Apply User Scoping
    if (filterUserId) {
      query = query.eq('user_id', filterUserId);
    } else {
      query = query.eq('user_id', user.id);
    }

    // Apply month/year filter if provided
    if (month && month !== 'all' && year) {
      const monthNum = parseInt(month); // Expected 1-12
      const yearNum = parseInt(year);
      
      if (monthNum >= 1 && monthNum <= 12 && yearNum > 2000) {
        // Use UTC dates to avoid timezone boundary issues
        // [startOfMonth, nextMonthStart)
        const startOfMonth = new Date(Date.UTC(yearNum, monthNum - 1, 1));
        const nextMonthStart = new Date(Date.UTC(yearNum, monthNum, 1));
        
        query = query
          .gte('booking_date', startOfMonth.toISOString().split('T')[0])
          .lt('booking_date', nextMonthStart.toISOString().split('T')[0]);
      }
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