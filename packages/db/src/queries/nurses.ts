import { SupabaseClient } from '@supabase/supabase-js';
import type { Nurse, NurseInsert, NurseSchedule, NurseScheduleInsert, NurseSkill } from '../types';

export async function getNurses(
  supabase: SupabaseClient,
  opts?: { active_only?: boolean }
): Promise<Nurse[]> {
  let query = supabase.from('nurses').select('*').order('full_name');

  if (opts?.active_only) query = query.eq('is_active', true);

  const { data, error } = await query;
  if (error) throw error;
  return data as Nurse[];
}

export async function getNurseById(
  supabase: SupabaseClient,
  id: string
): Promise<Nurse | null> {
  const { data, error } = await supabase
    .from('nurses')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as Nurse;
}

export async function createNurse(
  supabase: SupabaseClient,
  nurse: NurseInsert
): Promise<Nurse> {
  const { data, error } = await supabase
    .from('nurses')
    .insert(nurse)
    .select()
    .single();

  if (error) throw error;
  return data as Nurse;
}

export async function updateNurse(
  supabase: SupabaseClient,
  id: string,
  updates: Partial<Nurse>
): Promise<Nurse> {
  const { data, error } = await supabase
    .from('nurses')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Nurse;
}

export async function getAvailableNurses(
  supabase: SupabaseClient,
  date: string,
  timeFrom: string,
  timeTo: string,
  requiredSkill?: NurseSkill
): Promise<Nurse[]> {
  // Step 1: Get nurses with schedules covering the time window
  const { data: schedules, error: schedError } = await supabase
    .from('nurse_schedules')
    .select('nurse_id')
    .eq('date', date)
    .eq('is_available', true)
    .lte('start_time', timeFrom)
    .gte('end_time', timeTo);

  if (schedError) throw schedError;
  if (!schedules?.length) return [];

  const nurseIds = schedules.map((s) => s.nurse_id);

  // Step 2: Get active nurses from that set
  let query = supabase
    .from('nurses')
    .select('*')
    .eq('is_active', true)
    .in('id', nurseIds);

  if (requiredSkill) {
    query = query.contains('skills', [requiredSkill]);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Nurse[];
}

export async function getNurseSchedules(
  supabase: SupabaseClient,
  nurseId: string,
  dateFrom: string,
  dateTo: string
): Promise<NurseSchedule[]> {
  const { data, error } = await supabase
    .from('nurse_schedules')
    .select('*')
    .eq('nurse_id', nurseId)
    .gte('date', dateFrom)
    .lte('date', dateTo)
    .order('date')
    .order('start_time');

  if (error) throw error;
  return data as NurseSchedule[];
}

export async function createNurseSchedule(
  supabase: SupabaseClient,
  schedule: NurseScheduleInsert
): Promise<NurseSchedule> {
  const { data, error } = await supabase
    .from('nurse_schedules')
    .insert(schedule)
    .select()
    .single();

  if (error) throw error;
  return data as NurseSchedule;
}

export async function bulkCreateNurseSchedules(
  supabase: SupabaseClient,
  schedules: NurseScheduleInsert[]
): Promise<NurseSchedule[]> {
  const { data, error } = await supabase
    .from('nurse_schedules')
    .insert(schedules)
    .select();

  if (error) throw error;
  return data as NurseSchedule[];
}
