import { NextRequest, NextResponse } from 'next/server';
import { supabase, createAuthenticatedClient } from '@/lib/supabase';
import { z } from 'zod';
import { ApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';

const GymFinanceSchema = z.object({
  user_id: z.string().uuid(),
  transaction_date: z.string(),
  description: z.string().min(1),
  amount: z.number(),
  transaction_type: z.enum(['income', 'expense', 'membership']),
  payment_method: z.string().default('cash'),
});

// Helper function to get user role
async function getUserRole(userId: string, client: any): Promise<string> {
  const { data } = await client
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();
  return data?.role || 'staff';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const fields = searchParams.get('fields') || '*';
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');

    const client = token ? createAuthenticatedClient(token) : supabase;
    
    // Get current user from session
    const { data: { user } } = await client.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = await getUserRole(user.id, client);

    // RLS policies will handle the filtering based on user role
    // For staff: only see their own records
    // For operations_manager/director/investor: see all records
    let query = client
      .from('gym_finances')
      .select(fields)
      .order('transaction_date', { ascending: false })
      .range(offset, offset + limit - 1);

    // Only filter by userId if specified AND user is staff
    if (userId && userRole === 'staff') {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ data: [] });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    return NextResponse.json({ data: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const validatedData = GymFinanceSchema.parse(body);

    const client = token ? createAuthenticatedClient(token) : supabase;
    
    // Get current user from session
    const { data: { user } } = await client.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure user_id matches authenticated user for staff
    const userRole = await getUserRole(user.id, client);
    if (userRole === 'staff' && validatedData.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden: Staff can only create their own transactions' }, { status: 403 });
    }

    const { data, error } = await client
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

    // Block all updates as per RBAC requirements
    return NextResponse.json({ error: 'Forbidden: Transaction updates are not allowed' }, { status: 403 });
  } catch (error) {
    logger.error('Gym Finances PUT Error:', error);
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
      return NextResponse.json({ error: 'Forbidden: Only directors and investors can delete transactions' }, { status: 403 });
    }

    // RLS policy will handle the actual deletion permission
    const { error } = await client
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
