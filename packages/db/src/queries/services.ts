import { SupabaseClient } from '@supabase/supabase-js';
import type { Service, ServiceCategory, ServiceInsert } from '../types';

export async function getServices(
  supabase: SupabaseClient,
  opts?: { category?: ServiceCategory; active_only?: boolean }
): Promise<Service[]> {
  let query = supabase.from('services').select('*').order('category').order('name');

  if (opts?.category) query = query.eq('category', opts.category);
  if (opts?.active_only !== false) query = query.eq('is_active', true);

  const { data, error } = await query;
  if (error) throw error;
  return data as Service[];
}

export async function getServiceById(
  supabase: SupabaseClient,
  id: string
): Promise<Service | null> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as Service;
}

export async function createService(
  supabase: SupabaseClient,
  service: ServiceInsert
): Promise<Service> {
  const { data, error } = await supabase
    .from('services')
    .insert(service)
    .select()
    .single();

  if (error) throw error;
  return data as Service;
}

export async function updateService(
  supabase: SupabaseClient,
  id: string,
  updates: Partial<Service>
): Promise<Service> {
  const { data, error } = await supabase
    .from('services')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Service;
}

export async function getServicesByCategory(
  supabase: SupabaseClient,
  category: ServiceCategory
): Promise<Service[]> {
  return getServices(supabase, { category, active_only: true });
}
