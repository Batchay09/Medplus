import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/server';
import { optimizeRoute, type RouteTask } from '@medplus/scheduling';

export async function POST(req: NextRequest) {
  const supabase = createSupabaseAdmin();
  const { driver_id, date } = await req.json();

  if (!driver_id || !date) {
    return NextResponse.json({ error: 'driver_id and date are required' }, { status: 400 });
  }

  // Get all orders for the date that need driver involvement
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*, nurse:nurses(full_name, phone), patient:patients(full_name)')
    .eq('requested_date', date)
    .in('status', ['assigned', 'in_progress', 'nurse_on_way'])
    .not('nurse_id', 'is', null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!orders || orders.length === 0) {
    return NextResponse.json({ tasks: [], message: 'No orders to route' });
  }

  // Build route tasks
  const tasks: RouteTask[] = [];

  for (const order of orders) {
    if (!order.lat || !order.lng) continue;

    // Task: deliver nurse to patient
    tasks.push({
      id: `deliver-${order.id}`,
      type: 'deliver_nurse',
      address: order.address,
      lat: order.lat,
      lng: order.lng,
      time_window_start: order.requested_time_from || '09:00',
      time_window_end: order.requested_time_to || '18:00',
      stop_duration_minutes: 5,
      priority: order.is_urgent ? 10 : 5,
      order_id: order.id,
      nurse_id: order.nurse_id,
      notes: `Доставить ${order.nurse?.full_name} к ${order.patient?.full_name}`,
    });
  }

  // Cherkessk center as starting point
  const startLat = 44.2233;
  const startLng = 42.0578;

  const optimized = optimizeRoute(tasks, startLat, startLng, '08:00');

  // Save route to database
  const { data: route } = await supabase
    .from('driver_routes')
    .upsert({
      driver_id,
      date,
      status: 'planned',
      route_points: optimized.tasks.map((t, i) => ({
        address: t.address,
        lat: t.lat,
        lng: t.lng,
        type: t.type,
        sequence: i,
      })),
      total_distance_km: optimized.total_distance_km,
      total_duration_minutes: optimized.total_duration_minutes,
    }, {
      onConflict: 'driver_id,date',
    })
    .select()
    .single();

  return NextResponse.json({
    route,
    optimized,
  });
}
