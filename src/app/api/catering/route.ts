import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import { ApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';

import { getClientWithRole } from '@/lib/auth-utils';

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

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const { client, userId } = await getClientWithRole(token);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const finalClient = client || supabase;

    let query = finalClient.from('catering_items').select('*').order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
        logger.error('Catering Items GET Database Error:', error);
        return NextResponse.json({ data: [], error: error.message }, { status: 200 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error: any) {
    logger.error('Catering Items GET Error:', error);
    return NextResponse.json({ data: [], error: 'Internal Server Error' }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const { client, userId } = await getClientWithRole(token);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Handle inventory data separate from service items
    if (body.inventory_data) {
        return NextResponse.json({ success: true, message: 'Inventory saved (simulated)' });
    }

    const dataToValidate = {
      ...body,
      user_id: body.user_id || userId
    };

    const validatedData = CateringItemSchema.parse(dataToValidate);

    const { data, error } = await client
      .from('catering_items')
      .insert([validatedData])
      .select()
      .single();

    if (error) {
        logger.error('Catering Items POST Database Error:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    logger.error('Catering Items POST Error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const { client, userId } = await getClientWithRole(token);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    const { client, userId, userRole } = await getClientWithRole(token);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only directors and investors can delete
    if (!['director', 'investor'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden: Only directors and investors can delete items' }, { status: 403 });
    }

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