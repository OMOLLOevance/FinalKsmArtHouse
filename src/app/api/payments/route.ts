import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getAuth } from '@clerk/nextjs/server';

const PaymentSchema = z.object({
  quotation_id: z.string().uuid(),
  customer_id: z.string().uuid(),
  amount_paid: z.number().positive(),
  payment_method: z.string(),
  payment_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const { userId } = getAuth(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validatedData = PaymentSchema.parse(body);

    const paymentData = {
      ...validatedData,
      user_id: userId,
    };

    const { data, error } = await supabase
      .from('payments')
      .insert(paymentData)
      .select()
      .single();

    if (error) {
      logger.error('Payments POST Database Error:', error);
      throw error;
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    logger.error('Payments POST Error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'An unknown error occurred' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  
    try {
      const { searchParams } = new URL(req.url);
      const quotationId = searchParams.get('quotationId');
  
      let query = supabase.from('payments').select('*').eq('user_id', userId);
  
      if (quotationId) {
        query = query.eq('quotation_id', quotationId);
      }
  
      const { data, error } = await query.order('payment_date', { ascending: false });
  
      if (error) {
        logger.error('Payments GET Database Error:', error);
        throw error;
      }
  
      return NextResponse.json({ data });
    } catch (error: any) {
      logger.error('Payments GET Error:', error);
      return NextResponse.json({ error: error.message || 'An unknown error occurred' }, { status: 500 });
    }
  }
