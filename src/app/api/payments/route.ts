import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getClientWithRole, getUserRole } from '@/lib/auth-utils';
import { supabase } from '@/lib/supabase';

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
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const token = authHeader.split(' ')[1];

  const { client, userId } = await getClientWithRole(token);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Create a Supabase client with the service role key for certain operations
    const supabaseServiceRole = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await req.json();

    if (body.service_type === 'quotation' && !body.customer_id && body.quotation_id) {
        const { data: quotation, error: quotationError } = await supabaseServiceRole
            .from('quotations')
            .select('customer_name, customer_email, user_id')
            .eq('id', body.quotation_id)
            .single();

        if (quotationError) {
            logger.error('Payments POST Quotation Fetch Error:', quotationError);
            return NextResponse.json({ error: 'Failed to fetch quotation details' }, { status: 500 });
        }

        if (quotation && quotation.customer_email) {
            const { data: existingCustomer, error: customerError } = await supabaseServiceRole
                .from('customers')
                .select('id')
                .eq('contact', quotation.customer_email)
                .single();

            if (customerError && customerError.code !== 'PGRST116') { // PGRST116 means no rows found
                logger.error('Payments POST Existing Customer Fetch Error:', customerError);
                return NextResponse.json({ error: 'Failed to check for existing customer' }, { status: 500 });
            }

            if (existingCustomer) {
                body.customer_id = existingCustomer.id;
            } else {
                const { data: newCustomer, error: newCustomerError } = await supabaseServiceRole
                    .from('customers')
                    .insert({
                        name: quotation.customer_name,
                        contact: quotation.customer_email,
                        user_id: quotation.user_id,
                    })
                    .select('id')
                    .single();
                
                if (newCustomerError) {
                    logger.error('Payments POST New Customer Create Error:', newCustomerError);
                    return NextResponse.json({ error: 'Failed to create new customer' }, { status: 500 });
                }
                
                if (newCustomer) {
                    body.customer_id = newCustomer.id;
                }
            }
        }
    }

    const validatedData = PaymentSchema.parse(body);

    // --- Server-side overpayment prevention for quotations ---
    if (validatedData.service_type === 'quotation') {
      const quotationId = validatedData.quotation_id;
      const newPaymentAmount = validatedData.amount_paid;

      // 1. Fetch quotation details
      const { data: quotation, error: quotationFetchError } = await supabaseServiceRole
        .from('quotations')
        .select('total_amount')
        .eq('id', quotationId)
        .single();

      if (quotationFetchError) {
        logger.error('Error fetching quotation for payment validation:', quotationFetchError);
        return NextResponse.json({ error: 'Quotation not found or inaccessible' }, { status: 404 });
      }
      if (!quotation) {
        return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
      }

      // 2. Fetch all existing payments for this quotation
      const { data: existingPayments, error: paymentsFetchError } = await supabaseServiceRole
        .from('payments')
        .select('amount_paid')
        .eq('quotation_id', quotationId)
        .eq('service_type', 'quotation'); // Ensure we only sum quotation payments

      if (paymentsFetchError) {
        logger.error('Error fetching existing payments for quotation validation:', paymentsFetchError);
        return NextResponse.json({ error: 'Failed to retrieve existing payments' }, { status: 500 });
      }

      const totalPaid = existingPayments.reduce((sum, payment) => sum + payment.amount_paid, 0);
      const remainingBalance = quotation.total_amount - totalPaid;

      // 3. Validate new payment amount
      if (newPaymentAmount > remainingBalance) {
        return NextResponse.json(
          { 
            error: `Payment exceeds remaining balance. Remaining: ${remainingBalance.toFixed(2)}`,
            remaining_balance: remainingBalance,
            quotation_total: quotation.total_amount,
            total_paid_so_far: totalPaid,
            new_payment_amount: newPaymentAmount,
          },
          { status: 400 }
        );
      }
    }
    // --- End server-side overpayment prevention ---

    const paymentData = {
      ...validatedData,
      user_id: userId,
    };

    const { data, error } = await supabaseServiceRole
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
  try {
    const { searchParams } = new URL(req.url);
    const quotationId = searchParams.get('quotationId');
    const gymMemberId = searchParams.get('gymMemberId');
    const saunaBookingId = searchParams.get('saunaBookingId');
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const filterUserId = searchParams.get('filterUserId');
    const discovery = searchParams.get('discovery') === 'true';
    const token = req.headers.get('authorization')?.replace('Bearer ', '');

    const { client, userId, isManager } = await getClientWithRole(token);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const finalClient = client || supabase;

    // Enforce Access Control
    if (filterUserId && !isManager) {
      return NextResponse.json({ error: 'Forbidden: Managers only' }, { status: 403 });
    }

    let query = finalClient.from('payments').select('*');

    // Apply User Scoping
    if (filterUserId) {
      query = query.eq('user_id', filterUserId);
    } else if (discovery && isManager) {
      // Discovery mode for managers: no user_id filter (show all data)
    } else {
      query = query.eq('user_id', userId);
    }

    // Apply service-specific filters
    if (quotationId) {
      query = query.eq('quotation_id', quotationId);
    } else if (gymMemberId) {
      query = query.eq('gym_member_id', gymMemberId);
    } else if (saunaBookingId) {
      query = query.eq('sauna_booking_id', saunaBookingId);
    }

    // Apply month/year filter if provided
    if (month && month !== 'all' && year) {
      const monthNum = parseInt(month); // Expected 1-12
      const yearNum = parseInt(year);
      
      if (monthNum >= 1 && monthNum <= 12 && yearNum > 2000) {
        // Use UTC dates to avoid timezone boundary issues
        // [startOfMonth, nextMonthStart)
        const startOfMonth = new Date(Date.UTC(yearNum, monthNum - 1, 1));
        const nextMonthStart = new Date(Date.UTC(yearNum, monthNum, 1));
        
        query = query
          .gte('payment_date', startOfMonth.toISOString().split('T')[0])
          .lt('payment_date', nextMonthStart.toISOString().split('T')[0]);
      }
    }

    const { data, error } = await query.order('payment_date', { ascending: false });

    if (error) {
      logger.error('Payments GET Database Error:', error);
      throw error;
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    logger.error('Payments GET Handler Error:', {
      message: error.message,
      details: error,
      url: req.url,
    });
    return NextResponse.json({ error: error.message || 'An unknown error occurred', details: error }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const { client, userId, userRole } = await getClientWithRole(token);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only directors and investors can delete
    if (!['director', 'investor'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden: Only directors and investors can delete payments' }, { status: 403 });
    }

    const { error } = await client
      .from('payments')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Payments DELETE Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const { client, userId, userRole } = await getClientWithRole(token);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only managers can update payments
    if (!['director', 'investor', 'operations_manager'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden: Manager clearance required for payment updates' }, { status: 403 });
    }

    const { data, error } = await client
      .from('payments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error: any) {
    logger.error('Payments PUT Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}