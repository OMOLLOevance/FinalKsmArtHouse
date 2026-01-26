import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { ApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { isManager } from '@/lib/auth-utils';

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
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
    const userIsManager = isManager(profile?.role || 'staff');
    
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    let query = supabase.from('customer_requirements').select(`
      *,
      customers (id, name),
      decor_inventory (id, item_name, category, price)
    `);

    if (customerId) {
      query = query.eq('customer_id', customerId);
    } else if (!userIsManager) {
      query = query.eq('user_id', user.id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw ApiError.fromSupabase(error);

    return NextResponse.json({ data: data || [] });
  } catch (error: any) {
    logger.error('Customer Requirements GET Exception:', error);
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status });
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
    const validatedData = RequirementSchema.parse({
      ...body,
      user_id: user.id,
    });

    const { data: existing } = await supabase
      .from('customer_requirements')
      .select('id, quantity_required')
      .eq('customer_id', validatedData.customer_id)
      .eq('decor_item_id', validatedData.decor_item_id)
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabase
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

    const { data, error } = await supabase
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
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const { data, error } = await supabase
      .from('customer_requirements')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
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
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const { error } = await supabase
      .from('customer_requirements')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw ApiError.fromSupabase(error);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Customer Requirements DELETE Error:', error);
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status });
  }
}
