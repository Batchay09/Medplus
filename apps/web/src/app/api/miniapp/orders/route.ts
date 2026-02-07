import { NextRequest, NextResponse } from 'next/server';
import { validateInitData } from '@/lib/telegram/validate';
import { createSupabaseAdmin } from '@/lib/supabase/server';
import { getPatientByTelegramId, getOrders, createOrder, getServiceById } from '@medplus/db';

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

  const orders = await getOrders(supabase, {
    patient_id: patient.id,
    limit: 20,
  });

  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
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
  const { service_id, address, lat, lng, requested_date, requested_time_from, requested_time_to, supplies_source, notes } = body;

  if (!service_id || !address || !requested_date || !requested_time_from || !requested_time_to) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Get service to determine price
  const service = await getServiceById(supabase, service_id);
  if (!service) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 });
  }

  const suppliesCost = supplies_source === 'company' ? 500 : 0;

  const order = await createOrder(supabase, {
    patient_id: patient.id,
    service_id,
    nurse_id: null,
    driver_id: null,
    status: 'new',
    source: 'telegram',
    requested_date,
    requested_time_from,
    requested_time_to,
    scheduled_at: null,
    started_at: null,
    completed_at: null,
    address,
    lat: lat || null,
    lng: lng || null,
    supplies_source: supplies_source || 'client',
    prescription_photo_url: null,
    custom_supplies_list: null,
    supplies_cost: suppliesCost,
    service_price: service.base_price,
    surcharge: 0,
    payment_method: null,
    payment_status: 'pending',
    contract_url: null,
    consent_url: null,
    service_act_url: null,
    is_urgent: false,
    notes: notes || null,
  });

  return NextResponse.json({ id: order.id }, { status: 201 });
}
