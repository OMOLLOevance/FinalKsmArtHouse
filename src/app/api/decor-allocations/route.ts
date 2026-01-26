import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { ApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { isManager } from '@/lib/auth-utils';

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
    const monthStr = searchParams.get('month');
    const yearStr = searchParams.get('year');

    let query = supabase.from('decor_allocations').select('*');

    if (filterUserId && userIsManager) {
      query = query.eq('user_id', filterUserId);
    } else if (!userIsManager) {
      query = query.eq('user_id', user.id);
    }
    
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
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = DecorAllocationSchema.parse({
      ...body,
      user_id: user.id
    });

    const { data, error } = await supabase
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