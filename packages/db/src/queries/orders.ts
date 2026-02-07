import { SupabaseClient } from '@supabase/supabase-js';
import type { Order, OrderInsert, OrderStatus, OrderWithRelations } from '../types';

export async function getOrders(
  supabase: SupabaseClient,
  filters?: {
    status?: OrderStatus;
    date?: string;
    nurse_id?: string;
    patient_id?: string;
    limit?: number;
    offset?: number;
  }
): Promise<OrderWithRelations[]> {
  let query = supabase
    .from('orders')
    .select(`
      *,
      patient:patients(*),
      service:services(*),
      nurse:nurses(*),
      driver:drivers(*)
    `)
    .order('created_at', { ascending: false });

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.date) query = query.eq('requested_date', filters.date);
  if (filters?.nurse_id) query = query.eq('nurse_id', filters.nurse_id);
  if (filters?.patient_id) query = query.eq('patient_id', filters.patient_id);
  if (filters?.limit) query = query.limit(filters.limit);
  if (filters?.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);

  const { data, error } = await query;
  if (error) throw error;
  return data as OrderWithRelations[];
}

export async function getOrderById(
  supabase: SupabaseClient,
  id: string
): Promise<OrderWithRelations | null> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      patient:patients(*),
      service:services(*),
      nurse:nurses(*),
      driver:drivers(*),
      payments(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as OrderWithRelations;
}

export async function createOrder(
  supabase: SupabaseClient,
  order: OrderInsert
): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .insert(order)
    .select()
    .single();

  if (error) throw error;
  return data as Order;
}

export async function updateOrderStatus(
  supabase: SupabaseClient,
  id: string,
  status: OrderStatus,
  extraFields?: Partial<Order>
): Promise<Order> {
  const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() };

  if (status === 'procedure_started') updates.started_at = new Date().toISOString();
  if (status === 'completed') updates.completed_at = new Date().toISOString();

  if (extraFields) Object.assign(updates, extraFields);

  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Order;
}

export async function assignNurseToOrder(
  supabase: SupabaseClient,
  orderId: string,
  nurseId: string
): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .update({
      nurse_id: nurseId,
      status: 'assigned' as OrderStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;
  return data as Order;
}

export async function getOrdersForDate(
  supabase: SupabaseClient,
  date: string
): Promise<OrderWithRelations[]> {
  return getOrders(supabase, { date });
}

export async function getOrdersByNurse(
  supabase: SupabaseClient,
  nurseId: string,
  date: string
): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('nurse_id', nurseId)
    .eq('requested_date', date)
    .not('status', 'eq', 'cancelled')
    .order('scheduled_at', { ascending: true });

  if (error) throw error;
  return data as Order[];
}

export async function getTodayStats(
  supabase: SupabaseClient
): Promise<{
  total: number;
  completed: number;
  in_progress: number;
  revenue: number;
}> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('orders')
    .select('status, total_price, payment_status')
    .eq('requested_date', today);

  if (error) throw error;
  const orders = data || [];

  return {
    total: orders.length,
    completed: orders.filter((o) => o.status === 'completed').length,
    in_progress: orders.filter((o) =>
      ['assigned', 'in_progress', 'nurse_on_way', 'nurse_arrived', 'procedure_started'].includes(o.status)
    ).length,
    revenue: orders
      .filter((o) => o.payment_status === 'paid')
      .reduce((sum, o) => sum + (o.total_price || 0), 0),
  };
}
