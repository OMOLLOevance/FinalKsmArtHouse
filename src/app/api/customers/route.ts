import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { ApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { isManager } from '@/lib/auth-utils';

const CustomerSchema = z.object({
  user_id: z.string().uuid(),
  name: z.string().min(1),
  contact: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  event_type: z.string().optional().nullable(),
  event_date: z.string().optional().nullable(),
  total_amount: z.number().default(0),
  paid_amount: z.number().default(0),
  payment_status: z.string().default('pending'),
  payment_method: z.string().default('cash'),
  service_status: z.string().default('pending'),
  notes: z.string().optional().nullable(),
  requirements: z.any().optional().nullable(),
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

    let query = supabase
      .from('customers')
      .select(fields)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (!userIsManager) {
      query = query.eq('user_id', user.id);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Customers GET Error:', error);
      return NextResponse.json({ data: [], error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    logger.error('Customers GET Error:', error);
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
    
    const dataToValidate = {
      user_id: user.id,
      name: body.name || body.full_name,
      contact: body.contact || body.phone || body.email,
      location: body.location || body.address,
      event_type: body.event_type || body.eventType,
      event_date: body.event_date || body.eventDate,
      total_amount: body.total_amount || body.totalAmount || 0,
      paid_amount: body.paid_amount || body.paidAmount || 0,
      payment_status: body.payment_status || body.paymentStatus || 'pending',
      payment_method: body.payment_method || body.paymentMethod || 'cash',
      service_status: body.service_status || body.serviceStatus || 'pending',
      notes: body.notes,
      requirements: body.requirements,
    };

    const validatedData = CustomerSchema.parse(dataToValidate);

    const { data, error } = await supabase
      .from('customers')
      .insert([validatedData])
      .select()
      .single();

    if (error) throw ApiError.fromSupabase(error);

    return NextResponse.json({ data });
  } catch (error) {
    logger.error('Customers POST Error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 });
    }
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw ApiError.fromSupabase(error);

    return NextResponse.json({ data });
  } catch (error) {
    logger.error('Customers PUT Error:', error);
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status });
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
    
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
    const userRole = profile?.role || 'staff';

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    
    let query = supabase.from('customers').delete().eq('id', id);

    if (!['director', 'investor'].includes(userRole)) {
      query = query.eq('user_id', user.id);
    }

    const { error } = await query;

    if (error) throw ApiError.fromSupabase(error);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Customers DELETE Error:', error);
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status });
  }
}
