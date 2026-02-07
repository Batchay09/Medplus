import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { searchParams } = new URL(req.url);

  let query = supabase
    .from('orders')
    .select('*, patient:patients(*), service:services(*), nurse:nurses(*)')
    .order('created_at', { ascending: false })
    .limit(50);

  const status = searchParams.get('status');
  const date = searchParams.get('date');
  const nurse_id = searchParams.get('nurse_id');

  if (status) query = query.eq('status', status);
  if (date) query = query.eq('requested_date', date);
  if (nurse_id) query = query.eq('nurse_id', nurse_id);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const body = await req.json();

  const { data, error } = await supabase
    .from('orders')
    .insert(body)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
