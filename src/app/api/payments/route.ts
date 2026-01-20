import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getAuth } from '@clerk/nextjs/server';

const BasePaymentSchema = z.object({
  amount_paid: z.number().positive(),
  payment_method: z.string(),
  payment_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }),
  notes: z.string().optional(),
});

const QuotationPaymentSchema = BasePaymentSchema.extend({
  service_type: z.literal('quotation'),
  quotation_id: z.string().uuid(),
  customer_id: z.string().uuid(),
});

const GymPaymentSchema = BasePaymentSchema.extend({
  service_type: z.literal('gym'),
  gym_member_id: z.string().uuid(),
});

const SaunaPaymentSchema = BasePaymentSchema.extend({
  service_type: z.literal('sauna'),
  sauna_booking_id: z.string().uuid(),
});

const PaymentSchema = z.discriminatedUnion('service_type', [
  QuotationPaymentSchema,
  GymPaymentSchema,
  SaunaPaymentSchema,
]);

export async function POST(req: NextRequest) {
  const { userId } = getAuth(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    
    // For backward compatibility, only handle quotation payments for now
    if (body.service_type && body.service_type !== 'quotation') {
      return NextResponse.json({ error: 'Service type not yet supported. Please apply database migration first.' }, { status: 400 });
    }
    
    const validatedData = QuotationPaymentSchema.parse(body);

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
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
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
      const gymMemberId = searchParams.get('gymMemberId');
      const saunaBookingId = searchParams.get('saunaBookingId');
  
      let query = supabase.from('payments').select('*').eq('user_id', userId);
  
      // Only filter by quotation_id for now (backward compatibility)
      if (quotationId) {
        query = query.eq('quotation_id', quotationId);
      }
      // For gym and sauna, return empty array until migration is applied
      else if (gymMemberId || saunaBookingId) {
        return NextResponse.json({ data: [] });
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
