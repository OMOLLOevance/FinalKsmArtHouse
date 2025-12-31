import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type'); // 'bookings' | 'spa' | 'finances'

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    let data, error;

    switch (type) {
      case 'spa':
        ({ data, error } = await supabase
          .from('spa_bookings')
          .select('*')
          .eq('user_id', userId)
          .order('date', { ascending: false }));
        break;
      case 'finances':
        ({ data, error } = await supabase
          .from('sauna_spa_finances')
          .select('*')
          .eq('user_id', userId)
          .order('date', { ascending: false }));
        break;
      default:
        ({ data, error } = await supabase
          .from('sauna_bookings')
          .select('*')
          .eq('user_id', userId)
          .order('date', { ascending: false }));
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, type, ...itemData } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    let data, error;
    const dataWithUser = { user_id: userId, ...itemData };

    switch (type) {
      case 'spa':
        ({ data, error } = await supabase
          .from('spa_bookings')
          .insert([dataWithUser])
          .select()
          .single());
        break;
      case 'finances':
        ({ data, error } = await supabase
          .from('sauna_spa_finances')
          .insert([dataWithUser])
          .select()
          .single());
        break;
      default:
        ({ data, error } = await supabase
          .from('sauna_bookings')
          .insert([dataWithUser])
          .select()
          .single());
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}