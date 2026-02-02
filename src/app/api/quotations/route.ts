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

// Helper function to get user role
async function getUserRole(userId: string, client: any): Promise<string> {
  const { data } = await client
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();
  return data?.role || 'staff';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('userId');
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');

    // Use supabase directly for simplicity
    const client = supabase;

    let query = client.from('quotations').select('*').order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
        logger.error('Quotations GET Database Error:', error);
        return NextResponse.json({ data: [], error: error.message }, { status: 200 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error: any) {
    logger.error('Quotations GET Error:', error);
    return NextResponse.json({ data: [], error: 'Internal Server Error' }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    // Add default user_id if missing
    const dataWithDefaults = {
      ...body,
      user_id: body.user_id || '00000000-0000-0000-0000-000000000001'
    };
    
    let validatedData = QuotationSchema.parse(dataWithDefaults);

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
    const body = await request.json();
    const { id, ...updates } = body;
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const client = token ? createAuthenticatedClient(token) : supabase;

    const { data, error } = await client
      .from('quotations')
      .update(updates)
      .eq('id', id)
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const client = token ? createAuthenticatedClient(token) : supabase;

    const { error } = await client
      .from('quotations')
      .delete()
      .eq('id', id);

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
