import { NextRequest, NextResponse } from 'next/server';
import { supabase, createAuthenticatedClient } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { ApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';

// Initialize Admin Client if Service Role Key is available
const adminSupabase = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )
  : null;

const CateringItemSchema = z.object({
  user_id: z.string().uuid(),
  name: z.string().min(1),
  category: z.string(),
  unit: z.string().default('pieces'),
  price_per_plate: z.number().min(0),
  min_order: z.number().int().min(0),
  description: z.string().optional(),
  available: z.boolean().default(true),
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
    const userIdParam = searchParams.get('userId');
    const filterUserId = searchParams.get('filterUserId');
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');

    // Default to authenticated client
    let client = token ? createAuthenticatedClient(token) : supabase;
    let isManager = false;
    let sessionUserId = null;

    // RBAC: Check current user role and escalate if management
    if (token && adminSupabase) {
      const authClient = createAuthenticatedClient(token);
      const { data: { user } } = await authClient.auth.getUser();
      if (user) {
        sessionUserId = user.id;
        const role = await getUserRole(user.id, authClient);
        isManager = !!['director', 'investor', 'operations_manager'].includes(role);
        if (isManager) {
          client = adminSupabase;
        }
      }
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      sessionUserId = user?.id;
    }

    const userId = userIdParam || sessionUserId;
    if (!userId && !isManager) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });

    let query = client.from('catering_items').select('*').order('created_at', { ascending: false });

    // RBAC Filtering Logic
    if (filterUserId) {
      query = query.eq('user_id', filterUserId);
    } else if (!isManager && userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
        logger.error('Catering Items GET Database Error:', error);
        throw ApiError.fromSupabase(error);
    }

    return NextResponse.json({ data: data || [] });
  } catch (error: any) {
    logger.error('Catering Items GET Error:', error);
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
    
    // Handle inventory data separate from service items
    if (body.inventory_data) {
        return NextResponse.json({ success: true, message: 'Inventory saved (simulated)' });
    }

    const validatedData = CateringItemSchema.parse(body);

    const client = token ? createAuthenticatedClient(token) : supabase;

    const { data, error } = await client
      .from('catering_items')
      .insert([validatedData])
      .select()
      .single();

    if (error) {
        logger.error('Catering Items POST Database Error:', error);
        throw ApiError.fromSupabase(error);
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    logger.error('Catering Items POST Error:', error);
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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const client = token ? createAuthenticatedClient(token) : supabase;

    const { data, error } = await client
      .from('catering_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
        logger.error('Catering Items PUT Database Error:', error);
        throw ApiError.fromSupabase(error);
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    logger.error('Catering Items PUT Error:', error);
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

    const client = token ? createAuthenticatedClient(token) : supabase;

    const { error } = await client
      .from('catering_items')
      .delete()
      .eq('id', id);

    if (error) {
        logger.error('Catering Items DELETE Database Error:', error);
        throw ApiError.fromSupabase(error);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Catering Items DELETE Error:', error);
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json({ 
        error: error.message || 'Internal Server Error',
        details: error.details || null
    }, { status });
  }
}