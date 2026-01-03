import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import { ApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';

const CateringInventorySchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  category: z.string().min(1),
  particular: z.string().min(1),
  good_condition: z.number().int().min(0).default(0),
  repair_needed: z.number().int().min(0).default(0),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });

    const { data, error } = await supabase
      .from('catering_inventory')
      .select('*')
      .eq('user_id', userId)
      .order('category', { ascending: true })
      .order('particular', { ascending: true });

    if (error) {
        logger.error('Supabase error in Catering Inventory GET:', error);
        return NextResponse.json({ error: error.message, details: error.details, code: error.code }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error: any) {
    logger.error('Catering Inventory GET Exception:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CateringInventorySchema.parse(body);

    const { data, error } = await supabase
      .from('catering_inventory')
      .upsert(validatedData)
      .select()
      .single();

    if (error) {
        logger.error('Supabase error in Catering Inventory POST:', error);
        return NextResponse.json({ error: error.message, details: error.details, code: error.code }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    logger.error('Catering Inventory POST Exception:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const { error } = await supabase
      .from('catering_inventory')
      .delete()
      .eq('id', id);

    if (error) throw ApiError.fromSupabase(error);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Catering Inventory DELETE Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
