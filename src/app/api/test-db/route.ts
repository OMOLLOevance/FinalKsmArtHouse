import { NextRequest, NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const healthResults = await checkDatabaseHealth();
    return NextResponse.json({ healthResults }, { status: 200 });
  } catch (error: any) {
    logger.error('Database Health Check Error:', error);
    return NextResponse.json({ error: error.message || 'An unknown error occurred during database health check' }, { status: 500 });
  }
}
