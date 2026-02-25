import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getClientWithRole, createAdminClient } from '@/lib/auth-utils';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const ClientSchema = z.object({
  date: z.string(),
  account_manager: z.string(),
  client_name: z.string(),
  location: z.string(),
  number_of_parks: z.number().default(0),
  phone_number: z.string(),
  type_of_events: z.string(),
  status: z.enum(['confirmed', 'no-feedback', 'under-discussion']).default('under-discussion'),
});

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const { userId, isManager } = await getClientWithRole(token);
    const adminClient = createAdminClient();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let query = adminClient.from('clients').select('*');

    // If not manager, only see own data or historical orphaned data
    if (!isManager) {
      query = query.or(`user_id.eq.${userId},user_id.is.null`);
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (error) {
      logger.error('Clients GET Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    logger.error('Clients GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const { userId } = await getClientWithRole(token);
    const adminClient = createAdminClient();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = ClientSchema.parse(body);

    const { data, error } = await adminClient
      .from('clients')
      .insert([
        {
          ...validatedData,
          user_id: userId,
        }
      ])
      .select()
      .single();

    if (error) {
      logger.error('Clients POST Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    logger.error('Clients POST Error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const { userId, isManager } = await getClientWithRole(token);
    const adminClient = createAdminClient();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Check ownership if not manager
    if (!isManager) {
      const { data: existing } = await adminClient
        .from('clients')
        .select('user_id')
        .eq('id', id)
        .single();
      
      if (existing && existing.user_id && existing.user_id !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const { data, error } = await adminClient
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Clients PUT Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    logger.error('Clients PUT Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    const { userId, isManager } = await getClientWithRole(token);
    const adminClient = createAdminClient();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // If not manager, verify ownership
    if (!isManager) {
        const { data: existing } = await adminClient
            .from('clients')
            .select('user_id')
            .eq('id', id)
            .single();
        
        if (existing && existing.user_id && existing.user_id !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
    }

    const { error } = await adminClient
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Clients DELETE Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Clients DELETE Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
