import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { ApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { isManager } from '@/lib/auth-utils';

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
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
    const userIsManager = isManager(profile?.role || 'staff');

    const { searchParams } = new URL(request.url);
    const filterUserId = searchParams.get('filterUserId');

    let query = supabase.from('decor_inventory').select('*');
    
    if (filterUserId && userIsManager) {
      query = query.eq('user_id', filterUserId);
    } else if (!userIsManager) {
      query = query.eq('user_id', user.id);
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
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, id, quantity = 1, ...itemData } = body;


    if (action && id) {
      // Handle special actions: hire, return, damage, repair
      const { data: current, error: fetchError } = await supabase
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

      const { data, error } = await supabase
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
    const { data, error } = await supabase
      .from('decor_inventory')
      .insert([{...validatedData, user_id: user.id}])
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
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    const { data, error } = await supabase
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
