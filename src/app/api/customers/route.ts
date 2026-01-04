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

const CustomerSchema = z.object({
  user_id: z.string().uuid(),
  name: z.string().min(1),
  contact: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  event_type: z.string().optional().nullable(),
  event_date: z.string().optional().nullable(),
  total_amount: z.number().default(0),
  paid_amount: z.number().default(0),
  payment_status: z.string().default('pending'),
  payment_method: z.string().default('cash'),
  service_status: z.string().default('pending'),
  notes: z.string().optional().nullable(),
  requirements: z.any().optional().nullable(),
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
    const discovery = searchParams.get('discovery') === 'true';
    const fields = searchParams.get('fields') || '*';
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');

    // Default client
    let client = token ? createAuthenticatedClient(token) : supabase;
    let isManager = false;
    let sessionUserId = null;

    // Check for management privileges
    if (token && adminSupabase) {
      const authClient = createAuthenticatedClient(token);
      const { data: { user } } = await authClient.auth.getUser();
      if (user) {
        sessionUserId = user.id;
        const { data: profile } = await authClient
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        
        isManager = !!(profile && ['director', 'investor', 'operations_manager'].includes(profile.role));
        if (isManager) {
          client = adminSupabase;
        }
      }
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      sessionUserId = user?.id;
    }

    const userId = userIdParam || sessionUserId;
    if (!userId && !isManager) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });

    // DISCOVERY MODE: Cross-table customer search for Management
    if (discovery && isManager) {
      const [customersRes, monthlyRes, decorRes, gymRes, saunaRes, quotationsRes] = await Promise.all([
        client.from('customers').select('*'),
        client.from('monthly_allocations').select('*'),
        client.from('decor_allocations').select('*'),
        client.from('gym_members').select('*'),
        client.from('sauna_bookings').select('*'),
        client.from('quotations').select('*')
      ]);

      const combined = [
        ...(customersRes.data || []).map(c => ({
          id: c.id,
          name: c.name,
          eventType: c.event_type || 'General',
          eventDate: c.event_date || '-',
          source: 'core'
        })),
        ...(monthlyRes.data || []).map(a => ({
          id: a.id,
          name: a.customer_name,
          eventType: a.event_type || 'Equipment',
          eventDate: a.event_date || '-',
          source: 'allocation'
        })),
        ...(decorRes.data || []).map(d => ({
          id: d.id,
          name: d.customer_name,
          eventType: 'Decor Setup',
          eventDate: `${d.year}-${String(d.month).padStart(2, '0')}`,
          source: 'decor'
        })),
        ...(gymRes.data || []).map(g => ({
          id: g.id,
          name: g.member_name || g.name,
          eventType: `Gym (${g.membership_type || 'Member'})`,
          eventDate: g.start_date || '-',
          source: 'gym'
        })),
        ...(saunaRes.data || []).map(s => ({
          id: s.id,
          name: s.client_name || s.client,
          eventType: 'Sauna Session',
          eventDate: s.booking_date || s.date || '-',
          source: 'sauna'
        })),
        ...(quotationsRes.data || []).map(q => ({
          id: q.id,
          name: q.customer_name,
          eventType: `Quotation (${q.quotation_type})`,
          eventDate: q.event_date || '-',
          source: 'quotation'
        }))
      ];

      // De-duplicate by ID
      const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
      return NextResponse.json({ data: unique.sort((a, b) => a.name.localeCompare(b.name)) });
    }

    // Standard Query
    let query = client.from('customers').select(fields).order('created_at', { ascending: false });
    
    if (userId && !isManager) {
      query = query.eq('user_id', userId);
    } else if (userId && isManager && !discovery) {
      query = query.eq('user_id', userId);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) throw ApiError.fromSupabase(error);

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    logger.error('Customers GET Error:', error);
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error', data: [] }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    const dataToValidate = {
      user_id: body.userId || body.user_id,
      name: body.name || body.full_name,
      contact: body.contact || body.phone || body.email,
      location: body.location || body.address,
      event_type: body.event_type || body.eventType,
      event_date: body.event_date || body.eventDate,
      total_amount: body.total_amount || body.totalAmount || 0,
      paid_amount: body.paid_amount || body.paidAmount || 0,
      payment_status: body.payment_status || body.paymentStatus || 'pending',
      payment_method: body.payment_method || body.paymentMethod || 'cash',
      service_status: body.service_status || body.serviceStatus || 'pending',
      notes: body.notes,
      requirements: body.requirements,
    };

    const validatedData = CustomerSchema.parse(dataToValidate);

    const client = token ? createAuthenticatedClient(token) : supabase;
    
    // Get current user from session
    const { data: { user } } = await client.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure user_id matches authenticated user for staff
    const userRole = await getUserRole(user.id, client);
    if (userRole === 'staff' && validatedData.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden: Staff can only create their own records' }, { status: 403 });
    }

    const { data, error } = await client
      .from('customers')
      .insert([validatedData])
      .select()
      .single();

    if (error) throw ApiError.fromSupabase(error);

    return NextResponse.json({ data });
  } catch (error) {
    logger.error('Customers POST Error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 });
    }
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status });
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

    const client = token ? createAuthenticatedClient(token) : supabase;
    
    // Get current user from session
    const { data: { user } } = await client.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await client
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw ApiError.fromSupabase(error);

    return NextResponse.json({ data });
  } catch (error) {
    logger.error('Customers PUT Error:', error);
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status });
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

    const client = token ? createAuthenticatedClient(token) : supabase;
    
    // Get current user from session
    const { data: { user } } = await client.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = await getUserRole(user.id, client);
    
    // Only directors and investors can delete
    if (!['director', 'investor'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden: Only directors and investors can delete records' }, { status: 403 });
    }

    const { error } = await client
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) throw ApiError.fromSupabase(error);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Customers DELETE Error:', error);
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status });
  }
}
