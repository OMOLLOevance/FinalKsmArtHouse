import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { ApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';

const QuotationItemSchema = z.object({
  id: z.string(),
  description: z.string(),
  unit: z.string(),
  unitPrice: z.number(),
  quantity: z.number(),
  total: z.number(),
  remarks: z.string().optional().nullable(),
});

const QuotationSectionSchema = z.object({
  name: z.string(),
  items: z.array(QuotationItemSchema),
});

const QuotationSchema = z.object({
  user_id: z.string().uuid(),
  customer_name: z.string().min(1),
  customer_email: z.string().optional().nullable(),
  customer_phone: z.string().optional().nullable(),
  number_of_guests: z.number().int().default(0),
  theme: z.string().optional().nullable(),
  event_date: z.string().optional().nullable(),
  event_type: z.string().optional().nullable(),
  custom_event_type: z.string().optional().nullable(),
  quotation_type: z.enum(['Event/Decor', 'Food/Catering']),
  sections: z.array(QuotationSectionSchema),
  additional_charges: z.object({
    cateringLabour: z.number().default(0),
    serviceCharge: z.number().default(0),
    transport: z.number().default(0),
  }).optional().nullable(),
  status: z.enum(['draft', 'sent', 'approved', 'rejected']).default('draft'),
  total_amount: z.number().min(0),
  notes: z.string().optional().nullable(),
});

export async function GET(_request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let query = supabase.from('quotations').select('*').eq('user_id', user.id).order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
        logger.error('Quotations GET Database Error:', error);
        return NextResponse.json({ data: [], error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error: any) {
    logger.error('Quotations GET Error:', error);
    return NextResponse.json({ data: [], error: 'Internal Server Error' }, { status: 500 });
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
    
    const dataWithUser = {
      ...body,
      user_id: user.id
    };
    
    const validatedData = QuotationSchema.parse(dataWithUser);

    const { data, error } = await supabase
      .from('quotations')
      .insert([validatedData])
      .select()
      .single();

    if (error) {
        logger.error('Quotations POST Database Error:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    logger.error('Quotations POST Error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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
      .from('quotations')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
        logger.error('Quotations PUT Database Error:', error);
        throw ApiError.fromSupabase(error);
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    logger.error('Quotations PUT Error:', error);
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json({ 
        error: error.message || 'Internal Server Error',
        details: error.details || null
    }, { status });
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
      .from('quotations')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
        logger.error('Quotations DELETE Database Error:', error);
        throw ApiError.fromSupabase(error);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Quotations DELETE Error:', error);
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json({ 
        error: error.message || 'Internal Server Error',
        details: error.details || null
    }, { status });
  }
}
