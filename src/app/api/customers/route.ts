import { NextRequest, NextResponse } from 'next/server';
import { supabase, createAuthenticatedClient } from '@/lib/supabase';
import { z } from 'zod';
import { ApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { getClientWithRole, getUserRole } from '@/lib/auth-utils';

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
    const fields = searchParams.get('fields') || '*';
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const filterUserId = searchParams.get('filterUserId');
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');

    const { client, userId, isManager } = await getClientWithRole(token);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const finalClient = client || supabase;

    // Enforce Access Control
    if (filterUserId && !isManager) {
      return NextResponse.json({ error: 'Forbidden: Managers only' }, { status: 403 });
    }

    let query = finalClient.from('customers').select(fields);

    // Apply User Scoping
    if (filterUserId) {
      query = query.eq('user_id', filterUserId);
    } else {
      query = query.eq('user_id', userId);
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
          .gte('event_date', startOfMonth.toISOString().split('T')[0])
          .lt('event_date', nextMonthStart.toISOString().split('T')[0]);
      }
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      logger.error('Customers GET Error:', error);
      return NextResponse.json({ data: [], error: error.message }, { status: 200 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    logger.error('Customers GET Error:', error);
    return NextResponse.json({ data: [], error: 'Internal Server Error' }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    const dataToValidate = {
      user_id: body.userId || body.user_id || '00000000-0000-0000-0000-000000000001', // Default test user
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

    const { client } = await getClientWithRole(token);
    const finalClient = client || supabase; // Fallback to direct supabase

    const { data, error } = await finalClient
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
    
    // Get current user from session
    const { data: { user } } = await client.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    
    // Get current user from session
    const { data: { user } } = await client.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = await getUserRole(user.id, client);
    
    // Only directors and investors can delete
    if (!['director', 'investor'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden: Only directors and investors can delete records' }, { status: 403 });
    }

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
