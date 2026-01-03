import { NextRequest, NextResponse } from 'next/server';
import { supabase, createAuthenticatedClient } from '@/lib/supabase';
import { z } from 'zod';
import { ApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';

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
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const fields = searchParams.get('fields') || '*';
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');

    const client = token ? createAuthenticatedClient(token) : supabase;

    let query = client.from('customers').select(fields).order('created_at', { ascending: false });
    
    if (userId) {
      query = query.eq('user_id', userId);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) throw ApiError.fromSupabase(error);

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    logger.error('Customers GET Error:', error);
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error', data: [] }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    const dataToValidate = {
      user_id: body.userId || body.user_id,
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

    const client = token ? createAuthenticatedClient(token) : supabase;

    const { data, error } = await client
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
    const body = await request.json();
    const { id, ...updates } = body;
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const client = token ? createAuthenticatedClient(token) : supabase;

    const { data, error } = await client
      .from('customers')
      .update(updates)
      .eq('id', id)
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const client = token ? createAuthenticatedClient(token) : supabase;

    const { error } = await client
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) throw ApiError.fromSupabase(error);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Customers DELETE Error:', error);
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status });
  }
}
