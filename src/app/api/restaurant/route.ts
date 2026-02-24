import { NextRequest, NextResponse } from 'next/server';
import { supabase, createAuthenticatedClient } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { ApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { getClientWithRole, getUserRole } from '@/lib/auth-utils';

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

const RestaurantSaleSchema = z.object({
  user_id: z.string().uuid(),
  sale_date: z.string(),
  item_name: z.string().min(1),
  quantity: z.number().int().min(1),
  unit_price: z.number().min(0),
  total_amount: z.number().min(0),
  expenses: z.number().min(0).default(0),
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
    const discovery = searchParams.get('discovery') === 'true';
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

    // Map frontend field names to database column names safely
    const selectFields = fields.split(',').map(f => f.trim() === 'date' ? 'sale_date' : f).join(',');

    let query = finalClient.from('restaurant_sales').select(selectFields);

    // Apply User Scoping
    if (filterUserId) {
      query = query.eq('user_id', filterUserId);
    } else if (discovery && isManager) {
      // Discovery mode for managers: no user_id filter (show all data)
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
          .gte('sale_date', startOfMonth.toISOString().split('T')[0])
          .lt('sale_date', nextMonthStart.toISOString().split('T')[0]);
      }
    }

    query = query.order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) throw ApiError.fromSupabase(error);

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    logger.error('Restaurant GET Error:', error);
    const status = error instanceof ApiError ? error.status : 200; // Return 200 with empty data on connection timeout
    return NextResponse.json({ data: [], error: error instanceof Error ? error.message : 'Internal Server Error' }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const { client, userId, userRole } = await getClientWithRole(token);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Map frontend names to exact DB schema provided
    const dataToValidate = {
      user_id: body.userId || body.user_id || userId,
      sale_date: body.date || body.sale_date,
      item_name: body.item || body.item_name,
      quantity: body.quantity,
      unit_price: body.unitPrice || body.unit_price,
      total_amount: body.totalAmount || body.total_amount,
      expenses: body.expenses || 0,
    };

    const validatedData = RestaurantSaleSchema.parse(dataToValidate);

    // Ensure user_id matches authenticated user for staff
    if (userRole === 'staff' && validatedData.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden: Staff can only create their own transactions' }, { status: 403 });
    }

    const { data, error } = await client
      .from('restaurant_sales')
      .insert([validatedData])
      .select()
      .single();

    if (error) throw ApiError.fromSupabase(error);

    return NextResponse.json({ data });
  } catch (error) {
    logger.error('Restaurant POST Error:', error);
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

    const { client, userId } = await getClientWithRole(token);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await client
      .from('restaurant_sales')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw ApiError.fromSupabase(error);
    return NextResponse.json({ data });
  } catch (error) {
    logger.error('Restaurant PUT Error:', error);
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

    const { client, userId, userRole } = await getClientWithRole(token);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only directors and investors can delete
    if (!['director', 'investor', 'admin'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden: Only directors and investors can delete transactions' }, { status: 403 });
    }

    const { error } = await client
      .from('restaurant_sales')
      .delete()
      .eq('id', id);

    if (error) throw ApiError.fromSupabase(error);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Restaurant DELETE Error:', error);
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status });
  }
}
