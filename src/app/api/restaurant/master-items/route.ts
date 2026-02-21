import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const token = authHeader.split(' ')[1];

  // Create a Supabase client that can verify the user's token
  const supabaseAuth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Use anon key for client to verify token
    {
      auth: { persistSession: false }, // Do not persist session on server-side
    }
  );

  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

  if (authError || !user) {
    logger.error('Master Items GET Auth Error:', authError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Create a Supabase client with the service role key for RLS bypass
    const supabaseServiceRole = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabaseServiceRole
      .from('restaurant_master_items')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      logger.error('Master Items GET Database Error:', error);
      throw error;
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    logger.error('Master Items GET Handler Error:', {
      message: error.message,
      details: error,
      url: req.url,
    });
    return NextResponse.json({ error: error.message || 'An unknown error occurred', details: error }, { status: 500 });
  }
}
