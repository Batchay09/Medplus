import { NextRequest, NextResponse } from 'next/server';
import { validateInitData } from '@/lib/telegram/validate';
import { createSupabaseAdmin } from '@/lib/supabase/server';
import { getPatientByTelegramId, getOrderById } from '@medplus/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const initData = req.headers.get('x-telegram-init-data');
  if (!initData) {
    return NextResponse.json({ error: 'Missing initData' }, { status: 401 });
  }

  const { valid, user } = validateInitData(initData);
  if (!valid || !user) {
    return NextResponse.json({ error: 'Invalid initData' }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();
  const patient = await getPatientByTelegramId(supabase, user.id);
  if (!patient) {
    return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
  }

  const { id } = await params;
  const order = await getOrderById(supabase, id);

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // Ensure patient can only see their own orders
  if (order.patient_id !== patient.id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  return NextResponse.json(order);
}
