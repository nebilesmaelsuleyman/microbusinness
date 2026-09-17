export const ETHIOPIAN_CITY_LOCATIONS = [
  { name: 'Addis Ababa', latitude: 8.9806, longitude: 38.7578 },
  { name: 'Adama', latitude: 8.54, longitude: 39.27 },
  { name: 'Jimma', latitude: 7.6734, longitude: 36.835 },
  { name: 'Bahir Dar', latitude: 11.5742, longitude: 37.3614 },
  { name: 'Hawassa', latitude: 7.0621, longitude: 38.4764 },
  { name: 'Dire Dawa', latitude: 9.6009, longitude: 41.8501 },
  { name: 'Mekelle', latitude: 13.4967, longitude: 39.4753 },
  { name: 'Gondar', latitude: 12.6, longitude: 37.4667 },
] as const;

export function normalizeCityName(city?: string | null): string | null {
  if (typeof city !== 'string') return null;
  const value = city.trim();
  return value ? value : null;
}

export function resolveCityLocation(city?: string | null): { latitude: number; longitude: number } | null {
  const normalized = normalizeCityName(city);
  if (!normalized) return null;

  const key = normalized.toLowerCase();
  const match = ETHIOPIAN_CITY_LOCATIONS.find((item) => item.name.toLowerCase() === key);
  if (match) return { latitude: match.latitude, longitude: match.longitude };

  const fuzzy = ETHIOPIAN_CITY_LOCATIONS.find((item) =>
    item.name.toLowerCase().includes(key) || key.includes(item.name.toLowerCase()),
  );
  return fuzzy ? { latitude: fuzzy.latitude, longitude: fuzzy.longitude } : null;
}

export function buildLocationData(input?: {
  city?: string | null;
  formattedAddress?: string | null;
  latitude?: number | null;
  longitude?: number | null;
} | null): {
  city?: string | null;
  formattedAddress?: string | null;
  latitude: number;
  longitude: number;
} | null {
  if (!input) return null;

  const city = normalizeCityName(input.city);
  const formattedAddress = normalizeCityName(input.formattedAddress) ?? city ?? null;
  const cityCoordinates = city ? resolveCityLocation(city) : null;
  const latitude = input.latitude ?? cityCoordinates?.latitude ?? null;
  const longitude = input.longitude ?? cityCoordinates?.longitude ?? null;

  if (latitude == null || longitude == null) return null;

  return {
    city: city ?? null,
    formattedAddress: formattedAddress ?? null,
    latitude,
    longitude,
  };
}
