export interface LatLon {
  lat: number;
  lon: number;
}

/**
 * Deslocamento em km (leste, norte) de `point` em relação a `origin`. Projeção plana:
 * numa região de ~80 km o erro é de metros, bom para uma maquete.
 */
export function offsetKm(origin: LatLon, point: LatLon) {
  const kmPerDegreeLon = 111.32 * Math.cos((origin.lat * Math.PI) / 180);
  return { east: (point.lon - origin.lon) * kmPerDegreeLon, north: (point.lat - origin.lat) * 110.6 };
}

export function distanceKm(origin: LatLon, point: LatLon) {
  const { east, north } = offsetKm(origin, point);
  return Math.hypot(east, north);
}
