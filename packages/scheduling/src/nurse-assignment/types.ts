import type { Nurse, NurseSchedule, Order, NurseSkill } from '@medplus/db';

export interface AssignmentRequest {
  /** The order to assign a nurse for */
  order: {
    id: string;
    service_id: string;
    requested_date: string;
    requested_time_from: string;
    requested_time_to: string;
    address: string;
    lat: number | null;
    lng: number | null;
    is_urgent: boolean;
  };
  /** Required skill for the service */
  required_skill: NurseSkill | null;
  /** Duration of the service in minutes */
  duration_minutes: number;
  /** Patient ID (for familiarity scoring) */
  patient_id: string;
}

export interface NurseCandidate {
  nurse: Nurse;
  schedule: NurseSchedule;
  /** Orders this nurse already has on the same day */
  existing_orders: Order[];
  /** Distance from nurse's previous location (km) */
  distance_km: number;
  /** Combined score (0-100) */
  score: number;
  /** Breakdown of scoring */
  score_breakdown: ScoreBreakdown;
}

export interface ScoreBreakdown {
  distance_score: number;      // 0-30
  workload_score: number;      // 0-25
  gap_score: number;           // 0-20
  experience_score: number;    // 0-15
  familiarity_score: number;   // 0-10
}

export interface AssignmentResult {
  success: boolean;
  nurse_id?: string;
  candidates: NurseCandidate[];
  reason?: string;
}
