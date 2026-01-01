import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import { ApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';

const CateringInventorySchema = z.object({
  user_id: z.string().uuid(),
  name: z.string().min(1),
  category: z.string().min(1),
  unit: z.string().min(1),
  quantity: z.number().int().min(0).default(0),
  price_per_plate: z.number().min(0),
  min_order: z.number().int().min(1).default(1),
  description: z.string().optional().nullable(),
  available: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const fields = searchParams.get('fields') || '*';
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase.from('catering_inventory').select(fields).order('created_at', { ascending: false });
    
    if (userId) {
      query = query.eq('user_id', userId);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) throw ApiError.fromSupabase(error);

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    logger.error('Catering GET Error:', error);
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error', data: [] }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const dataToValidate = {
      user_id: body.userId || body.user_id,
      name: body.name,
      category: body.category,
      unit: body.unit,
      quantity: body.quantity,
      price_per_plate: body.price_per_plate || body.pricePerPlate,
      min_order: body.min_order || body.minOrder,
      description: body.description,
      available: body.available !== undefined ? body.available : true,
    };

    const validatedData = CateringInventorySchema.parse(dataToValidate);

    const { data, error } = await supabase
      .from('catering_inventory')
      .insert([validatedData])
      .select()
      .single();

    if (error) throw ApiError.fromSupabase(error);

    return NextResponse.json({ data: data });
  } catch (error) {
    logger.error('Catering POST Error:', error);
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

    const { data, error } = await supabase
      .from('catering_inventory')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw ApiError.fromSupabase(error);

    return NextResponse.json({ data });
  } catch (error) {
    logger.error('Catering PUT Error:', error);
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
      .from('catering_inventory')
      .delete()
      .eq('id', id);

    if (error) throw ApiError.fromSupabase(error);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Catering DELETE Error:', error);
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status });
  }
}
