import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getClientWithRole } from '@/lib/auth-utils';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    const { client, userId } = await getClientWithRole(token);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await client
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
      url: req.url,
    });
    return NextResponse.json({ error: error.message || 'An unknown error occurred' }, { status: 500 });
  }
}
