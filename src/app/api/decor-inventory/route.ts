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
    const filterUserId = searchParams.get('filterUserId');
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');

    // Default to RLS client
    let client = token ? createAuthenticatedClient(token) : supabase;

    // Attempt to escalate privileges for managers
    if (token && adminSupabase) {
      const authClient = createAuthenticatedClient(token);
      const { data: { user } } = await authClient.auth.getUser();
      
      if (user) {
        const { data: profile } = await authClient
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
          
        const isManager = profile && ['director', 'investor', 'operations_manager'].includes(profile.role);
        
        if (isManager) {
          client = adminSupabase;
        }
      }
    }

    let query = client.from('decor_inventory').select('*');
    
    // Filtering Logic:
    // 1. If filterUserId is explicitly provided (e.g. Director selecting Staff), use it.
    // 2. If no filterUserId but userId is provided (e.g. Staff viewing own), use userId.
    // 3. Managers using adminSupabase can see all if no filters provided.
    // 4. Regular staff using RLS client will only see their own regardless of filters (enforced by DB).
    
    if (filterUserId) {
      query = query.eq('user_id', filterUserId);
    } else if (userId) {
      query = query.eq('user_id', userId);
    }

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
    const { action, id, quantity = 1, ...itemData } = body;

    const client = token ? createAuthenticatedClient(token) : supabase;

    if (action && id) {
      // Handle special actions: hire, return, damage, repair
      const { data: current, error: fetchError } = await client
        .from('decor_inventory')
        .select('in_store, hired, damaged')
        .eq('id', id)
        .single();

      if (fetchError) throw ApiError.fromSupabase(fetchError);
      
      const qty = Math.max(1, parseInt(quantity));

      let updates: any = {};
      switch (action) {
        case 'hire':
          if (current.in_store < qty) return NextResponse.json({ error: `Not enough items available. Available: ${current.in_store}` }, { status: 400 });
          updates = { in_store: current.in_store - qty, hired: current.hired + qty };
          break;
        case 'return':
          if (current.hired < qty) return NextResponse.json({ error: `Cannot return more than hired. Hired: ${current.hired}` }, { status: 400 });
          updates = { hired: current.hired - qty, in_store: current.in_store + qty };
          break;
        case 'damage':
          if (current.in_store < qty) return NextResponse.json({ error: `Not enough items in store to mark damaged. In Store: ${current.in_store}` }, { status: 400 });
          updates = { in_store: current.in_store - qty, damaged: current.damaged + qty };
          break;
        case 'repair':
          if (current.damaged < qty) return NextResponse.json({ error: `Cannot repair more than damaged. Damaged: ${current.damaged}` }, { status: 400 });
          updates = { damaged: current.damaged - qty, in_store: current.in_store + qty };
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
