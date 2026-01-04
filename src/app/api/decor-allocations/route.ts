import { NextRequest, NextResponse } from 'next/server';
import { supabase, createAuthenticatedClient } from '@/lib/supabase';
import { z } from 'zod';
import { ApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';

const DecorAllocationSchema = z.object({
  id: z.string().uuid().optional(),
  customer_name: z.string().min(1),
  month: z.number().int().min(1).max(12),
  year: z.number().int(),
  row_number: z.number().int(),
  walkway_stands: z.number().default(0),
  arc: z.number().default(0),
  aisle_stands: z.number().default(0),
  photobooth: z.number().default(0),
  lecturn: z.number().default(0),
  stage_boards: z.number().default(0),
  backdrop_boards: z.number().default(0),
  dance_floor: z.number().default(0),
  walkway_boards: z.number().default(0),
  white_sticker: z.number().default(0),
  centerpieces: z.number().default(0),
  glass_charger_plates: z.number().default(0),
  melamine_charger_plates: z.number().default(0),
  african_mats: z.number().default(0),
  gold_napkin_holders: z.number().default(0),
  silver_napkin_holders: z.number().default(0),
  roof_top_decor: z.number().default(0),
  parcan_lights: z.number().default(0),
  revolving_heads: z.number().default(0),
  fairy_lights: z.number().default(0),
  snake_lights: z.number().default(0),
  neon_lights: z.number().default(0),
  small_chandeliers: z.number().default(0),
  large_chandeliers: z.number().default(0),
  african_lampshades: z.number().default(0),
  user_id: z.string().uuid(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const filterUserId = searchParams.get('filterUserId');
    const monthStr = searchParams.get('month');
    const yearStr = searchParams.get('year');
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!userId) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });

    const client = token ? createAuthenticatedClient(token) : supabase;
    
    // RBAC: Check current user role
    const { data: { user } } = await client.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: userProfile } = await client.from('users').select('role').eq('id', user.id).single();
    const role = userProfile?.role || 'staff';

    let query = client.from('decor_allocations').select('*');

    // RBAC Filtering Logic
    if (role === 'staff') {
      query = query.eq('user_id', user.id);
    } else if (filterUserId) {
      query = query.eq('user_id', filterUserId);
    }
    // If manager and no filter, RLS handles the broad view
    
    if (monthStr) {
      const month = parseInt(monthStr);
      if (!isNaN(month)) query = query.eq('month', month + 1);
    }
    
    if (yearStr) {
      const year = parseInt(yearStr);
      if (!isNaN(year)) query = query.eq('year', year);
    }

    const { data, error } = await query.order('row_number', { ascending: true });

    if (error) {
      logger.error('Supabase fetch error:', error);
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error: any) {
    logger.error('Decor Allocations GET Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const validatedData = DecorAllocationSchema.parse(body);

    const client = token ? createAuthenticatedClient(token) : supabase;

    const { data, error } = await client
      .from('decor_allocations')
      .upsert(validatedData, { 
        onConflict: 'month, year, row_number, user_id' 
      })
      .select()
      .single();

    if (error) throw ApiError.fromSupabase(error);

    return NextResponse.json({ data });
  } catch (error: any) {
    logger.error('Decor Allocations POST Error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}