import { NextRequest, NextResponse } from 'next/server';
import { supabase, createAuthenticatedClient } from '@/lib/supabase';
import { z } from 'zod';
import { ApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';

const DecorInventorySchema = z.object({
  category: z.string().min(1),
  item_name: z.string().min(1),
  in_store: z.number().int().min(0),
  hired: z.number().int().min(0).default(0),
  damaged: z.number().int().min(0).default(0),
  price: z.number().min(0),
  user_id: z.string().uuid().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');

    const client = token ? createAuthenticatedClient(token) : supabase;

    let query = client.from('decor_inventory').select('*');
    if (userId) query = query.eq('user_id', userId);

    const { data, error } = await query
      .order('category', { ascending: true })
      .order('item_name', { ascending: true });

    if (error) throw ApiError.fromSupabase(error);

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    logger.error('Decor Inventory GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const { action, id, ...itemData } = body;

    const client = token ? createAuthenticatedClient(token) : supabase;

    if (action && id) {
      // Handle special actions: hire, return, damage, repair
      const { data: current, error: fetchError } = await client
        .from('decor_inventory')
        .select('in_store, hired, damaged')
        .eq('id', id)
        .single();

      if (fetchError) throw ApiError.fromSupabase(fetchError);

      let updates: any = {};
      switch (action) {
        case 'hire':
          if (current.in_store <= 0) return NextResponse.json({ error: 'No items available' }, { status: 400 });
          updates = { in_store: current.in_store - 1, hired: current.hired + 1 };
          break;
        case 'return':
          if (current.hired <= 0) return NextResponse.json({ error: 'No items to return' }, { status: 400 });
          updates = { hired: current.hired - 1, in_store: current.in_store + 1 };
          break;
        case 'damage':
          if (current.in_store <= 0) return NextResponse.json({ error: 'No items to damage' }, { status: 400 });
          updates = { in_store: current.in_store - 1, damaged: current.damaged + 1 };
          break;
        case 'repair':
          if (current.damaged <= 0) return NextResponse.json({ error: 'No items to repair' }, { status: 400 });
          updates = { damaged: current.damaged - 1, in_store: current.in_store + 1 };
          break;
      }

      const { data, error } = await client
        .from('decor_inventory')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw ApiError.fromSupabase(error);
      return NextResponse.json({ data });
    }

    // Handle normal insertion
    const validatedData = DecorInventorySchema.parse(itemData);
    const { data, error } = await client
      .from('decor_inventory')
      .insert([validatedData])
      .select()
      .single();

    if (error) throw ApiError.fromSupabase(error);
    return NextResponse.json({ data });
  } catch (error) {
    logger.error('Decor Inventory POST Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');

    const client = token ? createAuthenticatedClient(token) : supabase;

    const { data, error } = await client
      .from('decor_inventory')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw ApiError.fromSupabase(error);
    return NextResponse.json({ data });
  } catch (error) {
    logger.error('Decor Inventory PUT Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}