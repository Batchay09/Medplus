import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/server';
import { findBestNurse, type AssignmentRequest } from '@medplus/scheduling';

export async function POST(req: NextRequest) {
  const supabase = createSupabaseAdmin();
  const { order_id } = await req.json();

  if (!order_id) {
    return NextResponse.json({ error: 'order_id is required' }, { status: 400 });
  }

  // Get the order with service info
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('*, service:services(*)')
    .eq('id', order_id)
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (order.nurse_id) {
    return NextResponse.json({ error: 'Order already has a nurse assigned' }, { status: 400 });
  }

  // Build the assignment request
  const request: AssignmentRequest = {
    order: {
      id: order.id,
      service_id: order.service_id,
      requested_date: order.requested_date,
      requested_time_from: order.requested_time_from || '09:00',
      requested_time_to: order.requested_time_to || '18:00',
      address: order.address,
      lat: order.lat,
      lng: order.lng,
      is_urgent: order.is_urgent,
    },
    required_skill: order.service?.required_skill || null,
    duration_minutes: order.service?.duration_minutes || 60,
    patient_id: order.patient_id,
  };

  // Run the assignment algorithm
  const result = await findBestNurse(supabase, request);

  if (!result.success || !result.nurse_id) {
    return NextResponse.json(
      {
        error: result.reason || 'No suitable nurse found',
        candidates: result.candidates.map((c) => ({
          nurse_id: c.nurse.id,
          nurse_name: c.nurse.full_name,
          score: c.score,
          breakdown: c.score_breakdown,
        })),
      },
      { status: 404 }
    );
  }

  // Assign the nurse
  const scheduledTime = `${order.requested_date}T${order.requested_time_from || '09:00'}:00`;

  const { data: updated, error: updateErr } = await supabase
    .from('orders')
    .update({
      nurse_id: result.nurse_id,
      status: 'assigned',
      scheduled_at: scheduledTime,
      updated_at: new Date().toISOString(),
    })
    .eq('id', order_id)
    .select('*, nurse:nurses(full_name)')
    .single();

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({
    order: updated,
    assignment: {
      nurse_id: result.nurse_id,
      score: result.candidates[0].score,
      candidates_count: result.candidates.length,
    },
  });
}
