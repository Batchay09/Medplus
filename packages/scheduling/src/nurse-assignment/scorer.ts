import type { Nurse, Order } from '@medplus/db';
import type { AssignmentRequest, NurseCandidate, ScoreBreakdown } from './types';

const WEIGHTS = {
  distance: 30,
  workload: 25,
  gap: 20,
  experience: 15,
  familiarity: 10,
} as const;

/** Max distance in km that still gets some score */
const MAX_DISTANCE_KM = 15;

/** Max orders per day for a nurse */
const MAX_DAILY_ORDERS = 8;

/**
 * Calculate the distance score (0-30).
 * Closer nurses get higher scores.
 */
function scoreDistance(distanceKm: number): number {
  if (distanceKm <= 0) return WEIGHTS.distance;
  if (distanceKm >= MAX_DISTANCE_KM) return 0;
  return Math.round(WEIGHTS.distance * (1 - distanceKm / MAX_DISTANCE_KM));
}

/**
 * Calculate the workload score (0-25).
 * Less busy nurses get higher scores.
 */
function scoreWorkload(existingOrderCount: number): number {
  if (existingOrderCount >= MAX_DAILY_ORDERS) return 0;
  return Math.round(WEIGHTS.workload * (1 - existingOrderCount / MAX_DAILY_ORDERS));
}

/**
 * Calculate the gap score (0-20).
 * Minimizes idle time between procedures.
 */
function scoreGap(
  existingOrders: Order[],
  requestedTimeFrom: string,
  durationMinutes: number
): number {
  if (existingOrders.length === 0) return WEIGHTS.gap;

  // Parse the requested time
  const reqMinutes = timeToMinutes(requestedTimeFrom);

  // Find the closest existing order (before or after)
  let minGap = Infinity;
  for (const order of existingOrders) {
    if (!order.scheduled_at) continue;
    const orderTime = new Date(order.scheduled_at);
    const orderMinutes = orderTime.getHours() * 60 + orderTime.getMinutes();

    // Gap between end of existing order and start of new, or vice versa
    const gap1 = Math.abs(reqMinutes - (orderMinutes + 60)); // after existing
    const gap2 = Math.abs(orderMinutes - (reqMinutes + durationMinutes)); // before existing
    minGap = Math.min(minGap, gap1, gap2);
  }

  // Ideal gap: 20-40 minutes (travel time)
  if (minGap >= 20 && minGap <= 40) return WEIGHTS.gap;
  if (minGap < 20) return Math.round(WEIGHTS.gap * 0.5); // Too tight
  // Larger gaps reduce score
  const maxGap = 180; // 3 hours
  if (minGap >= maxGap) return 0;
  return Math.round(WEIGHTS.gap * (1 - (minGap - 40) / (maxGap - 40)));
}

/**
 * Calculate the experience score (0-15).
 * Based on how many times the nurse has done this type of service.
 */
function scoreExperience(
  nurse: Nurse,
  requiredSkill: string | null
): number {
  if (!requiredSkill) return WEIGHTS.experience;
  // If the nurse has the skill, she gets the full experience score
  // In a real system, we'd track completed procedure counts
  if (nurse.skills.includes(requiredSkill as never)) {
    return WEIGHTS.experience;
  }
  return 0;
}

/**
 * Calculate the familiarity score (0-10).
 * Bonus if the nurse has previously visited this patient.
 */
function scoreFamiliarity(
  existingOrders: Order[],
  patientId: string
): number {
  const hasVisited = existingOrders.some(
    (o) => o.patient_id === patientId && o.status === 'completed'
  );
  return hasVisited ? WEIGHTS.familiarity : 0;
}

/**
 * Parse a time string "HH:MM" into minutes since midnight.
 */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Score a nurse candidate for a given assignment request.
 */
export function scoreCandidate(
  candidate: Omit<NurseCandidate, 'score' | 'score_breakdown'>,
  request: AssignmentRequest
): NurseCandidate {
  const breakdown: ScoreBreakdown = {
    distance_score: scoreDistance(candidate.distance_km),
    workload_score: scoreWorkload(candidate.existing_orders.length),
    gap_score: scoreGap(
      candidate.existing_orders,
      request.order.requested_time_from,
      request.duration_minutes
    ),
    experience_score: scoreExperience(candidate.nurse, request.required_skill),
    familiarity_score: scoreFamiliarity(candidate.existing_orders, request.patient_id),
  };

  const score =
    breakdown.distance_score +
    breakdown.workload_score +
    breakdown.gap_score +
    breakdown.experience_score +
    breakdown.familiarity_score;

  return {
    ...candidate,
    score,
    score_breakdown: breakdown,
  };
}
