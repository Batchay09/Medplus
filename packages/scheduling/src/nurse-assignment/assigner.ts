import { SupabaseClient } from '@supabase/supabase-js';
import { getAvailableNurses, getOrdersByNurse } from '@medplus/db';
import type { Nurse, NurseSchedule, NurseSkill } from '@medplus/db';
import type { AssignmentRequest, AssignmentResult, NurseCandidate } from './types';
import { scoreCandidate } from './scorer';
import { haversineDistance } from '../utils/geo';

/**
 * Find and score all nurse candidates for a given order.
 * Does NOT assign — returns ranked candidates for the caller to decide.
 */
export async function findBestNurse(
  supabase: SupabaseClient,
  request: AssignmentRequest
): Promise<AssignmentResult> {
  const { order, required_skill, duration_minutes } = request;

  // Step 1: Get nurses available for this time slot with the required skill
  const availableNurses = await getAvailableNurses(
    supabase,
    order.requested_date,
    order.requested_time_from,
    order.requested_time_to,
    required_skill as NurseSkill | undefined
  );

  if (availableNurses.length === 0) {
    return {
      success: false,
      candidates: [],
      reason: 'Нет доступных медсестёр на выбранное время',
    };
  }

  // Step 2: For each nurse, get their existing orders and compute scores
  const candidatePromises = availableNurses.map(async (nurse) => {
    const existingOrders = await getOrdersByNurse(
      supabase,
      nurse.id,
      order.requested_date
    );

    // Check for time conflicts
    if (hasTimeConflict(existingOrders, order.requested_time_from, duration_minutes)) {
      return null;
    }

    // Estimate distance from nurse's last known position
    const lastOrder = existingOrders
      .filter((o) => o.scheduled_at)
      .sort((a, b) => (a.scheduled_at! > b.scheduled_at! ? -1 : 1))[0];

    let distanceKm = 5; // Default distance if unknown
    if (lastOrder?.lat && lastOrder?.lng && order.lat && order.lng) {
      distanceKm = haversineDistance(
        lastOrder.lat,
        lastOrder.lng,
        order.lat,
        order.lng
      );
    }

    // Build a candidate stub (schedule is from the available nurses query)
    const candidateStub: Omit<NurseCandidate, 'score' | 'score_breakdown'> = {
      nurse,
      schedule: {
        id: '',
        nurse_id: nurse.id,
        date: order.requested_date,
        start_time: order.requested_time_from,
        end_time: order.requested_time_to,
        is_available: true,
      } as NurseSchedule,
      existing_orders: existingOrders,
      distance_km: distanceKm,
    };

    return scoreCandidate(candidateStub, request);
  });

  const allCandidates = await Promise.all(candidatePromises);
  const candidates = allCandidates
    .filter((c): c is NurseCandidate => c !== null)
    .sort((a, b) => b.score - a.score);

  if (candidates.length === 0) {
    return {
      success: false,
      candidates: [],
      reason: 'Все доступные медсёстры имеют конфликтующие заказы',
    };
  }

  return {
    success: true,
    nurse_id: candidates[0].nurse.id,
    candidates,
  };
}

/**
 * Check if a new order would conflict with existing orders.
 */
function hasTimeConflict(
  existingOrders: Array<{ scheduled_at: string | null; completed_at: string | null }>,
  requestedTimeFrom: string,
  durationMinutes: number
): boolean {
  const [reqH, reqM] = requestedTimeFrom.split(':').map(Number);
  const reqStart = reqH * 60 + reqM;
  const reqEnd = reqStart + durationMinutes;
  // Add 20 min buffer for travel
  const bufferMinutes = 20;

  for (const order of existingOrders) {
    if (!order.scheduled_at) continue;
    const orderDate = new Date(order.scheduled_at);
    const orderStart = orderDate.getHours() * 60 + orderDate.getMinutes();
    const orderEnd = orderStart + 60; // Assume ~60 min per procedure

    // Check overlap with buffer
    if (reqStart < orderEnd + bufferMinutes && reqEnd + bufferMinutes > orderStart) {
      return true;
    }
  }

  return false;
}
