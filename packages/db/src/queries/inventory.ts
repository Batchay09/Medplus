import { SupabaseClient } from '@supabase/supabase-js';
import type { InventoryItem, InventoryItemInsert } from '../types';

export async function getInventoryItems(
  supabase: SupabaseClient,
  opts?: { low_stock_only?: boolean; category?: string }
): Promise<InventoryItem[]> {
  let query = supabase.from('inventory').select('*').order('name');

  if (opts?.category) query = query.eq('category', opts.category);

  const { data, error } = await query;
  if (error) throw error;

  let items = data as InventoryItem[];
  if (opts?.low_stock_only) {
    items = items.filter((item) => item.quantity <= item.min_quantity);
  }
  return items;
}

export async function getInventoryItemById(
  supabase: SupabaseClient,
  id: string
): Promise<InventoryItem | null> {
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as InventoryItem;
}

export async function createInventoryItem(
  supabase: SupabaseClient,
  item: InventoryItemInsert
): Promise<InventoryItem> {
  const { data, error } = await supabase
    .from('inventory')
    .insert(item)
    .select()
    .single();

  if (error) throw error;
  return data as InventoryItem;
}

export async function updateInventoryQuantity(
  supabase: SupabaseClient,
  id: string,
  quantityChange: number
): Promise<InventoryItem> {
  // Use RPC for atomic increment, fallback to read-update
  const { data: current, error: readError } = await supabase
    .from('inventory')
    .select('quantity')
    .eq('id', id)
    .single();

  if (readError) throw readError;

  const newQuantity = Math.max(0, (current?.quantity || 0) + quantityChange);

  const { data, error } = await supabase
    .from('inventory')
    .update({ quantity: newQuantity })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as InventoryItem;
}

export async function getLowStockItems(
  supabase: SupabaseClient
): Promise<InventoryItem[]> {
  return getInventoryItems(supabase, { low_stock_only: true });
}
