export type TaskType =
  | 'pickup_nurse'
  | 'deliver_nurse'
  | 'pickup_supplies'
  | 'deliver_supplies'
  | 'return';

export interface RouteTask {
  id: string;
  type: TaskType;
  address: string;
  lat: number;
  lng: number;
  /** Earliest time this task can be performed */
  time_window_start: string;
  /** Latest time this task should be completed */
  time_window_end: string;
  /** Estimated duration at this stop (minutes) */
  stop_duration_minutes: number;
  /** Priority: higher = more urgent */
  priority: number;
  /** Related order ID */
  order_id?: string;
  /** Related nurse ID */
  nurse_id?: string;
  /** Notes */
  notes?: string;
}

export interface OptimizedRoute {
  /** Ordered list of tasks */
  tasks: RouteTask[];
  /** Estimated total distance in km */
  total_distance_km: number;
  /** Estimated total time including stops (minutes) */
  total_duration_minutes: number;
  /** For each task: estimated arrival time */
  estimated_arrivals: string[];
}
