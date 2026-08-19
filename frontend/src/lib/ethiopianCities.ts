export const ETHIOPIAN_CITIES = [
  { name: 'Addis Ababa', lat: 8.9806, lng: 38.7578 },
  { name: 'Adama', lat: 8.54, lng: 39.27 },
  { name: 'Jimma', lat: 7.6734, lng: 36.835 },
  { name: 'Bahir Dar', lat: 11.5742, lng: 37.3614 },
  { name: 'Hawassa', lat: 7.0621, lng: 38.4764 },
  { name: 'Dire Dawa', lat: 9.6009, lng: 41.8501 },
  { name: 'Mekelle', lat: 13.4967, lng: 39.4753 },
  { name: 'Gondar', lat: 12.6, lng: 37.4667 },
] as const;

export type EthiopianCity = (typeof ETHIOPIAN_CITIES)[number];

export function cityForCoordinates(lat?: number, lng?: number): string | null {
  if (lat == null || lng == null) return null;
  let closest: EthiopianCity | null = null;
  let closestDistance = Infinity;
  for (const city of ETHIOPIAN_CITIES) {
    const distance = (city.lat - lat) ** 2 + (city.lng - lng) ** 2;
    if (distance < closestDistance) { closest = city; closestDistance = distance; }
  }
  return closestDistance < 1.5 ? closest?.name ?? null : null;
}
