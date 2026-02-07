import { NextRequest, NextResponse } from 'next/server';
import { validateInitData } from '@/lib/telegram/validate';
import { createSupabaseAdmin } from '@/lib/supabase/server';
import { getPatientByTelegramId, updatePatient } from '@medplus/db';

export async function GET(req: NextRequest) {
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

  // Get order stats
  const { count: totalOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('patient_id', patient.id);

  const { count: completedOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('patient_id', patient.id)
    .eq('status', 'completed');

  return NextResponse.json({
    ...patient,
    total_orders: totalOrders || 0,
    completed_orders: completedOrders || 0,
  });
}

export async function PATCH(req: NextRequest) {
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

  const body = await req.json();
  const allowed = ['full_name', 'phone', 'address', 'birth_date', 'allergies'];
  const updates: Record<string, string> = {};
  for (const key of allowed) {
    if (key in body) {
      updates[key] = body[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  await updatePatient(supabase, patient.id, updates);
  return NextResponse.json({ success: true });
}
