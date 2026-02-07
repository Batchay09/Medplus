import { SupabaseClient } from '@supabase/supabase-js';
import type { Payment, PaymentInsert } from '../types';

export async function getPaymentsByOrder(
  supabase: SupabaseClient,
  orderId: string
): Promise<Payment[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('order_id', orderId)
    .order('confirmed_at', { ascending: false });

  if (error) throw error;
  return data as Payment[];
}

export async function createPayment(
  supabase: SupabaseClient,
  payment: PaymentInsert
): Promise<Payment> {
  const { data, error } = await supabase
    .from('payments')
    .insert(payment)
    .select()
    .single();

  if (error) throw error;
  return data as Payment;
}

export async function confirmPayment(
  supabase: SupabaseClient,
  paymentId: string,
  confirmedBy: string
): Promise<Payment> {
  const { data, error } = await supabase
    .from('payments')
    .update({
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
      confirmed_by: confirmedBy,
    })
    .eq('id', paymentId)
    .select()
    .single();

  if (error) throw error;
  return data as Payment;
}

export async function getRevenueForPeriod(
  supabase: SupabaseClient,
  dateFrom: string,
  dateTo: string
): Promise<{ total: number; cash: number; card: number; count: number }> {
  const { data, error } = await supabase
    .from('payments')
    .select('amount, method')
    .eq('status', 'confirmed')
    .gte('confirmed_at', dateFrom)
    .lte('confirmed_at', dateTo);

  if (error) throw error;

  const payments = data || [];
  return {
    total: payments.reduce((sum, p) => sum + p.amount, 0),
    cash: payments.filter((p) => p.method === 'cash').reduce((sum, p) => sum + p.amount, 0),
    card: payments.filter((p) => p.method === 'card_transfer').reduce((sum, p) => sum + p.amount, 0),
    count: payments.length,
  };
}
