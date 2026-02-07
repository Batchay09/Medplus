import { SupabaseClient } from '@supabase/supabase-js';
import type { Patient, PatientInsert } from '../types';

export async function getPatients(
  supabase: SupabaseClient,
  opts?: { search?: string; limit?: number; offset?: number }
): Promise<Patient[]> {
  let query = supabase
    .from('patients')
    .select('*')
    .order('created_at', { ascending: false });

  if (opts?.search) {
    query = query.or(`full_name.ilike.%${opts.search}%,phone.ilike.%${opts.search}%`);
  }
  if (opts?.limit) query = query.limit(opts.limit);
  if (opts?.offset) query = query.range(opts.offset, opts.offset + (opts.limit || 20) - 1);

  const { data, error } = await query;
  if (error) throw error;
  return data as Patient[];
}

export async function getPatientById(
  supabase: SupabaseClient,
  id: string
): Promise<Patient | null> {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as Patient;
}

export async function getPatientByTelegramId(
  supabase: SupabaseClient,
  telegramId: number
): Promise<Patient | null> {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('telegram_id', telegramId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as Patient;
}

export async function getPatientByPhone(
  supabase: SupabaseClient,
  phone: string
): Promise<Patient | null> {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('phone', phone)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as Patient;
}

export async function createPatient(
  supabase: SupabaseClient,
  patient: PatientInsert
): Promise<Patient> {
  const { data, error } = await supabase
    .from('patients')
    .insert(patient)
    .select()
    .single();

  if (error) throw error;
  return data as Patient;
}

export async function updatePatient(
  supabase: SupabaseClient,
  id: string,
  updates: Partial<Patient>
): Promise<Patient> {
  const { data, error } = await supabase
    .from('patients')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Patient;
}
