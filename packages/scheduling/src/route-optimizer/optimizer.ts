import type { RouteTask, OptimizedRoute } from './types';
import { haversineDistance, estimateDrivingMinutes } from '../utils/geo';

/** Buffer time between route points in minutes */
const BUFFER_MINUTES = 15;

/**
 * Greedy route optimizer with time windows.
 *
 * Strategy:
 * 1. Sort tasks by priority (urgent first), then by earliest start time
 * 2. Starting from the driver's position, always pick the best next task:
 *    - Must respect time windows
 *    - Prefer nearby tasks (minimize detour)
 *    - Prefer tasks with tighter deadlines
 * 3. Insert supply pickups into gaps between nurse deliveries
 */
export function optimizeRoute(
  tasks: RouteTask[],
  startLat: number,
  startLng: number,
  startTime: string // HH:MM format
): OptimizedRoute {
  if (tasks.length === 0) {
    return {
      tasks: [],
      total_distance_km: 0,
      total_duration_minutes: 0,
      estimated_arrivals: [],
    };
  }

  const remaining = [...tasks];
  const ordered: RouteTask[] = [];
  const arrivals: string[] = [];

  let currentLat = startLat;
  let currentLng = startLng;
  let currentMinutes = timeToMinutes(startTime);
  let totalDistance = 0;

  while (remaining.length > 0) {
    // Find the best next task
    let bestIdx = -1;
    let bestScore = -Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const task = remaining[i];
      const drivingTime = estimateDrivingMinutes(currentLat, currentLng, task.lat, task.lng);
      const arrivalTime = currentMinutes + drivingTime + BUFFER_MINUTES;
      const windowStart = timeToMinutes(task.time_window_start);
      const windowEnd = timeToMinutes(task.time_window_end);

      // Can we make it before the window closes?
      if (arrivalTime > windowEnd) continue;

      // How long would we wait if we arrive early?
      const waitTime = Math.max(0, windowStart - arrivalTime);

      // Score: higher is better
      // Prioritize: urgency > deadline proximity > distance
      const urgencyBonus = task.priority * 20;
      const deadlineProximity = Math.max(0, 100 - (windowEnd - currentMinutes));
      const distancePenalty = drivingTime * 2;
      const waitPenalty = waitTime;

      const score = urgencyBonus + deadlineProximity - distancePenalty - waitPenalty;

      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }

    if (bestIdx === -1) {
      // Can't reach any remaining tasks in their time windows.
      // Add them anyway at the end (late) — admin will need to adjust.
      for (const task of remaining) {
        const drivingTime = estimateDrivingMinutes(currentLat, currentLng, task.lat, task.lng);
        totalDistance += haversineDistance(currentLat, currentLng, task.lat, task.lng);
        currentMinutes += drivingTime + BUFFER_MINUTES + task.stop_duration_minutes;
        arrivals.push(minutesToTime(currentMinutes - task.stop_duration_minutes));
        ordered.push(task);
        currentLat = task.lat;
        currentLng = task.lng;
      }
      break;
    }

    const task = remaining.splice(bestIdx, 1)[0];
    const drivingTime = estimateDrivingMinutes(currentLat, currentLng, task.lat, task.lng);
    const distance = haversineDistance(currentLat, currentLng, task.lat, task.lng);
    totalDistance += distance;

    const arrivalMinutes = currentMinutes + drivingTime + BUFFER_MINUTES;
    const windowStart = timeToMinutes(task.time_window_start);
    const effectiveArrival = Math.max(arrivalMinutes, windowStart);

    arrivals.push(minutesToTime(effectiveArrival));
    currentMinutes = effectiveArrival + task.stop_duration_minutes;
    currentLat = task.lat;
    currentLng = task.lng;
    ordered.push(task);
  }

  const totalDuration = currentMinutes - timeToMinutes(startTime);

  return {
    tasks: ordered,
    total_distance_km: Math.round(totalDistance * 10) / 10,
    total_duration_minutes: totalDuration,
    estimated_arrivals: arrivals,
  };
}

/**
 * Recalculate route when a new task is added mid-day.
 * Inserts the new task optimally among remaining (not yet completed) tasks.
 */
export function insertTaskIntoRoute(
  currentRoute: OptimizedRoute,
  newTask: RouteTask,
  completedCount: number,
  currentLat: number,
  currentLng: number,
  currentTime: string
): OptimizedRoute {
  // Take remaining tasks + new task and re-optimize
  const remainingTasks = [
    ...currentRoute.tasks.slice(completedCount),
    newTask,
  ];

  return optimizeRoute(remainingTasks, currentLat, currentLng, currentTime);
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}
