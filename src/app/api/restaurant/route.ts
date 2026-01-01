import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import { ApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';

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
    const userId = searchParams.get('userId');
    const fields = searchParams.get('fields') || '*';
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('restaurant_sales')
      .select(fields)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (userId) {
      query = query.eq('user_id', userId);
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
    const body = await request.json();
    
    // Map frontend names to exact DB schema provided
    const dataToValidate = {
      user_id: body.userId || body.user_id,
      sale_date: body.date || body.sale_date,
      item_name: body.item || body.item_name,
      quantity: body.quantity,
      unit_price: body.unitPrice || body.unit_price,
      total_amount: body.totalAmount || body.total_amount,
      expenses: body.expenses || 0,
    };

    const validatedData = RestaurantSaleSchema.parse(dataToValidate);

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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Map any incoming update fields to DB names if they exist
    const dbUpdates: any = { ...updates };
    if (updates.date) dbUpdates.sale_date = updates.date;
    if (updates.item) dbUpdates.item_name = updates.item;
    if (updates.unitPrice) dbUpdates.unit_price = updates.unitPrice;
    if (updates.totalAmount) dbUpdates.total_amount = updates.totalAmount;

    const { data, error } = await supabase
      .from('restaurant_sales')
      .update(dbUpdates)
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

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
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