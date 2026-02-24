import { NextRequest, NextResponse } from 'next/server';
import { supabase, createAuthenticatedClient } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { ApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { getClientWithRole } from '@/lib/auth-utils';

const CateringInventorySchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  category: z.string().min(1),
  particular: z.string().min(1),
  good_condition: z.number().int().min(0).default(0),
  repair_needed: z.number().int().min(0).default(0),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('userId');
    const filterUserId = searchParams.get('filterUserId');
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');

    const { client, userId: sessionUserId, isManager } = await getClientWithRole(token);

    const userId = userIdParam || sessionUserId;
    if (!userId && !isManager) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });

    let query = client
      .from('catering_inventory')
      .select('*')
      .order('category', { ascending: true })
      .order('particular', { ascending: true });

    // RBAC Filtering Logic
    if (filterUserId) {
      query = query.eq('user_id', filterUserId);
    } else if (!isManager && userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
        logger.error('Catering Inventory GET Database Error:', error);
        throw ApiError.fromSupabase(error);
    }

    return NextResponse.json({ data: data || [] });
  } catch (error: any) {
    logger.error('Catering Inventory GET Error:', error);
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json({ 
        error: error.message || 'Internal Server Error',
        details: error.details || null
    }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const validatedData = CateringInventorySchema.parse(body);

    const { client, userRole, userId } = await getClientWithRole(token);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure user_id matches authenticated user for staff
    if (userRole === 'staff' && validatedData.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden: Staff can only create their own records' }, { status: 403 });
    }

    const { data, error } = await client
      .from('catering_inventory')
      .upsert(validatedData)
      .select()
      .single();

    if (error) {
        logger.error('Catering Inventory POST Database Error:', error);
        throw ApiError.fromSupabase(error);
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    logger.error('Catering Inventory POST Error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 });
    }
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json({ 
        error: error.message || 'Internal Server Error',
        details: error.details || null
    }, { status });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const { client, userRole, userId } = await getClientWithRole(token);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only directors and investors can delete
    if (!['director', 'investor'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden: Only directors and investors can delete records' }, { status: 403 });
    }

    const { error } = await client
      .from('catering_inventory')
      .delete()
      .eq('id', id);

    if (error) {
        logger.error('Catering Inventory DELETE Database Error:', error);
        throw ApiError.fromSupabase(error);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Catering Inventory DELETE Error:', error);
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json({ 
        error: error.message || 'Internal Server Error',
        details: error.details || null
    }, { status });
  }
}
