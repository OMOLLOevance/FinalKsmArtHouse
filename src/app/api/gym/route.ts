import { NextRequest, NextResponse } from 'next/server';
import { supabase, createAuthenticatedClient } from '@/lib/supabase';
import { z } from 'zod';
import { ApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { getClientWithRole, getUserRole } from '@/lib/auth-utils';

const GymMemberSchema = z.object({
  user_id: z.string().uuid(),
  member_name: z.string().min(1),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  membership_type: z.enum(['weekly', 'monthly', 'three-months']),
  start_date: z.string(),
  expiry_date: z.string(),
  status: z.enum(['active', 'expired']).default('active'),
  payment_amount: z.number().min(0),
  payment_status: z.string().default('paid'),
  notes: z.string().nullable().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fields = searchParams.get('fields') || '*';
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
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

    let query = finalClient.from('gym_members').select(fields);

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
          .gte('start_date', startOfMonth.toISOString().split('T')[0])
          .lt('start_date', nextMonthStart.toISOString().split('T')[0]);
      }
    }

    if (search) {
      query = query.or(`member_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    query = query.order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      logger.error('Gym GET Error:', error);
      return NextResponse.json({ data: [], error: error.message }, { status: 200 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    logger.error('Gym GET Error:', error);
    return NextResponse.json({ data: [], error: 'Internal Server Error' }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const validatedData = GymMemberSchema.parse(body);

    const client = token ? createAuthenticatedClient(token) : supabase;
    
    // Get current user from session
    const { data: { user } } = await client.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure user_id matches authenticated user for staff
    const userRole = await getUserRole(user.id, client);
    if (userRole === 'staff' && validatedData.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden: Staff can only create their own records' }, { status: 403 });
    }

    const { data, error } = await client
      .from('gym_members')
      .insert([validatedData])
      .select()
      .single();

    if (error) throw ApiError.fromSupabase(error);

    return NextResponse.json({ data });
  } catch (error) {
    logger.error('Gym POST Error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 });
    }
    const status = error instanceof ApiError ? error.status : 500;
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status });
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
      .from('gym_members')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw ApiError.fromSupabase(error);

    return NextResponse.json({ data });
  } catch (error) {
    logger.error('Gym PUT Error:', error);
    const status = error instanceof ApiError ? error.status : 500;
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status });
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
      .from('gym_members')
      .delete()
      .eq('id', id);

    if (error) throw ApiError.fromSupabase(error);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Gym DELETE Error:', error);
    const status = error instanceof ApiError ? error.status : 500;
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status });
  }
}
