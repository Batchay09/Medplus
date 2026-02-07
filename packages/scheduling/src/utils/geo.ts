/**
 * Calculate the great-circle distance between two coordinates using the Haversine formula.
 * Returns distance in kilometers.
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Estimate driving time between two points.
 * Uses average city speed of 30 km/h for Cherkessk.
 */
export function estimateDrivingMinutes(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const distanceKm = haversineDistance(lat1, lng1, lat2, lng2);
  const avgSpeedKmH = 30;
  return Math.ceil((distanceKm / avgSpeedKmH) * 60);
}

/**
 * Simple clustering of points by proximity.
 * Groups points that are within maxDistanceKm of each other.
 */
export function clusterByProximity<T extends { lat: number; lng: number }>(
  points: T[],
  maxDistanceKm: number
): T[][] {
  const visited = new Set<number>();
  const clusters: T[][] = [];

  for (let i = 0; i < points.length; i++) {
    if (visited.has(i)) continue;
    visited.add(i);
    const cluster = [points[i]];

    for (let j = i + 1; j < points.length; j++) {
      if (visited.has(j)) continue;
      const dist = haversineDistance(
        points[i].lat,
        points[i].lng,
        points[j].lat,
        points[j].lng
      );
      if (dist <= maxDistanceKm) {
        visited.add(j);
        cluster.push(points[j]);
      }
    }
    clusters.push(cluster);
  }

  return clusters;
}
