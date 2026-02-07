import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const body = await req.json();

  const { order_id, amount, method } = body;

  if (!order_id || !amount) {
    return NextResponse.json({ error: 'order_id and amount are required' }, { status: 400 });
  }

  // Create payment record
  const { data: payment, error: payErr } = await supabase
    .from('payments')
    .insert({
      order_id,
      amount,
      method: method || 'cash',
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (payErr) return NextResponse.json({ error: payErr.message }, { status: 500 });

  // Update order payment status
  await supabase
    .from('orders')
    .update({
      payment_status: 'paid',
      updated_at: new Date().toISOString(),
    })
    .eq('id', order_id);

  return NextResponse.json(payment, { status: 201 });
}
