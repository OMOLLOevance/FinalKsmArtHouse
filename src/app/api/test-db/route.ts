import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(_req: NextRequest) {
  try {
    const tables = ['users', 'customers', 'gym_members', 'restaurant_sales'];
    const healthResults = [];

    for (const table of tables) {
      try {
        const result = await supabase.from(table).select('id').limit(1);
        healthResults.push({
          tableName: table,
          status: result.error ? 'error' : 'ok',
          error: result.error?.message || null
        });
      } catch (err) {
        healthResults.push({
          tableName: table,
          status: 'error',
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({ healthResults }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ 
      healthResults: [{ tableName: 'system', status: 'error', error: 'Health check failed' }]
    }, { status: 200 });
  }
}
