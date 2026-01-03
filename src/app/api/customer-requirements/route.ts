import { NextRequest, NextResponse } from 'next/server';
import { supabase, createAuthenticatedClient } from '@/lib/supabase';
import { z } from 'zod';
import { ApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';

const RequirementSchema = z.object({
  user_id: z.string().uuid(),
  customer_id: z.string().uuid(),
  decor_item_id: z.string().uuid(),
  quantity_required: z.number().int().min(1),
  status: z.enum(['pending', 'confirmed', 'delivered']).default('pending'),
  notes: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const customerId = searchParams.get('customerId');
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!userId) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });

    const client = token ? createAuthenticatedClient(token) : supabase;

    // 1. Fetch requirements
    let query = client
      .from('customer_requirements')
      .select('*')
      .eq('user_id', userId);

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    const { data: requirements, error: reqError } = await query.order('created_at', { ascending: false });

    if (reqError) throw ApiError.fromSupabase(reqError);
    if (!requirements || requirements.length === 0) return NextResponse.json({ data: [] });

    // 2. Identify all IDs we need to look up
    const targetIds = [...new Set(requirements.map(r => r.customer_id))];
    const itemIds = [...new Set(requirements.map(r => r.decor_item_id))];

    // 3. Fetch from BOTH possible customer tables and the inventory
    const [customersRes, allocationsRes, itemsRes] = await Promise.all([
        client.from('customers').select('id, name').in('id', targetIds),
        client.from('monthly_allocations').select('id, customer_name').in('id', targetIds),
        client.from('decor_inventory').select('id, item_name, category, price').in('id', itemIds)
    ]);

    // 4. Create a unified customer map (checking both sources)
    const customersMap = new Map();
    customersRes.data?.forEach(c => customersMap.set(c.id, { name: c.name }));
    allocationsRes.data?.forEach(a => customersMap.set(a.id, { name: a.customer_name }));
    
    const itemsMap = new Map(itemsRes.data?.map(i => [i.id, i]) || []);

    // 5. Build enriched data
    const enrichedData = requirements.map(req => ({
        ...req,
        customers: customersMap.get(req.customer_id) || { name: 'Unknown Client' },
        decor_inventory: itemsMap.get(req.decor_item_id) || { item_name: 'Unknown Item', category: 'N/A', price: 0 }
    }));

    return NextResponse.json({ data: enrichedData });
  } catch (error: any) {
    logger.error('Customer Requirements GET Exception:', error);
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const validatedData = RequirementSchema.parse(body);

    const client = token ? createAuthenticatedClient(token) : supabase;

    // Check for existing
    const { data: existing } = await client
      .from('customer_requirements')
      .select('id, quantity_required')
      .eq('customer_id', validatedData.customer_id)
      .eq('decor_item_id', validatedData.decor_item_id)
      .maybeSingle();

    if (existing) {
      const { data, error } = await client
        .from('customer_requirements')
        .update({ 
          quantity_required: existing.quantity_required + validatedData.quantity_required,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw ApiError.fromSupabase(error);
      return NextResponse.json({ data });
    }

    const { data, error } = await client
      .from('customer_requirements')
      .insert([validatedData])
      .select()
      .single();

    if (error) throw ApiError.fromSupabase(error);

    return NextResponse.json({ data });
  } catch (error: any) {
    logger.error('Customer Requirements POST Error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 });
    }
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status });
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
      .from('customer_requirements')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw ApiError.fromSupabase(error);

    return NextResponse.json({ data });
  } catch (error: any) {
    logger.error('Customer Requirements PUT Error:', error);
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status });
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
      .from('customer_requirements')
      .delete()
      .eq('id', id);

    if (error) throw ApiError.fromSupabase(error);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Customer Requirements DELETE Error:', error);
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status });
  }
}
