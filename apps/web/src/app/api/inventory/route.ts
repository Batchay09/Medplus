import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .order('name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { id, quantity_change } = await req.json();

  if (!id || quantity_change === undefined) {
    return NextResponse.json({ error: 'id and quantity_change are required' }, { status: 400 });
  }

  // Get current quantity
  const { data: item, error: getErr } = await supabase
    .from('inventory')
    .select('quantity')
    .eq('id', id)
    .single();

  if (getErr) return NextResponse.json({ error: getErr.message }, { status: 404 });

  const newQuantity = Math.max(0, item.quantity + quantity_change);

  const { data, error } = await supabase
    .from('inventory')
    .update({ quantity: newQuantity })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
