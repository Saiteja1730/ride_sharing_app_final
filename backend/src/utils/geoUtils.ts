/**
 * Haversine formula — distance between two lat/lng points in km
 */
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371; // Earth radius km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Estimate ETA in minutes given distance (km) and average speed (km/h)
 */
export function estimateEta(distanceKm: number, avgSpeedKmh = 30): number {
  return Math.ceil((distanceKm / avgSpeedKmh) * 60);
}

/**
 * Generate bounding box for a given radius (km) around a point
 */
export function getBoundingBox(
  lat: number, lng: number, radiusKm: number
): { minLat: number; maxLat: number; minLng: number; maxLng: number } {
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos(toRad(lat)));
  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta,
  };
}

/**
 * Convert [lng, lat] MongoDB GeoJSON to { lat, lng }
 */
export function mongoGeoToCoords(coordinates: [number, number]): { lat: number; lng: number } {
  return { lat: coordinates[1], lng: coordinates[0] };
}

/**
 * Convert { lat, lng } to MongoDB GeoJSON [lng, lat]
 */
export function coordsToMongoGeo(lat: number, lng: number): [number, number] {
  return [lng, lat];
}
