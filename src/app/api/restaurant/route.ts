import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { ApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { isManager } from '@/lib/auth-utils';

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
    const filterUserId = searchParams.get('filterUserId');

    const selectFields = fields.split(',').map(f => f.trim() === 'date' ? 'sale_date' : f).join(',');

    let query = supabase
      .from('restaurant_sales')
      .select(selectFields)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filterUserId && userIsManager) {
      query = query.eq('user_id', filterUserId);
    } else if (!userIsManager) {
      query = query.eq('user_id', user.id);
    }

    const { data, error } = await query;

    if (error) throw ApiError.fromSupabase(error);

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    logger.error('Restaurant GET Error:', error);
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json({ data: [], error: error instanceof Error ? error.message : 'Internal Server Error' }, { status });
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
      user_id: user.id, // Use authenticated user's ID
      sale_date: body.date || body.sale_date,
      item_name: body.item || body.item_name,
      quantity: body.quantity,
      unit_price: body.unitPrice || body.unit_price,
      total_amount: body.totalAmount || body.total_amount,
      expenses: body.expenses || 0,
    };

    const validatedData = RestaurantSaleSchema.parse(dataToValidate);
    
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
    const userRole = profile?.role || 'staff';

    if (userRole === 'staff' && validatedData.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden: Staff can only create their own transactions' }, { status: 403 });
    }

    const { data, error } = await supabase
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

export async function PUT(_request: NextRequest) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Block all updates as per original business logic
    return NextResponse.json({ error: 'Forbidden: Transaction updates are not allowed' }, { status: 403 });
}

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
    const userRole = profile?.role || 'staff';
    
    if (!['director', 'investor'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden: Only directors and investors can delete transactions' }, { status: 403 });
    }

    const { error } = await supabase
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
