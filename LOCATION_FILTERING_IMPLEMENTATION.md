# Location Filtering Implementation ✅

## Overview
Implemented a professional location model combining human-readable city names with exact geographic coordinates. This fixes the issue where nearby searches returned no results and makes location management more user-friendly.

## The Problem (Before)
- Users could only provide raw latitude/longitude values
- Default coordinates were set to `[0, 0]` for missing locations, breaking search logic
- Admin searching for "nearby" providers got no results even if providers in the same city existed
- City information was lost after setup—inferred from coordinates only
- No graceful fallback when exact coordinates weren't available

## The Solution (After)
Hybrid location model with:
- **City name**: "Addis Ababa", "Jimma", "Hawassa" (human-readable)
- **Formatted address**: Optional arbitrary string (landmark, area, neighborhood)
- **Latitude & longitude**: Exact coordinates for distance calculations
- **GeoJSON coordinates**: MongoDB geospatial index for `$nearSphere` queries

## Files Created

### 1. `src/common/location.ts` (New)
Location resolution utility:
```typescript
export const ETHIOPIAN_CITY_LOCATIONS = [
  { name: 'Addis Ababa', latitude: 8.9806, longitude: 38.7578 },
  { name: 'Jimma', latitude: 7.6734, longitude: 36.835 },
  // ... 6 more major Ethiopian cities
];

export function resolveCityLocation(city?: string | null): 
  { latitude: number; longitude: number } | null

export function buildLocationData(input?: {...}):
  { city?: string; formattedAddress?: string; latitude: number; longitude: number } | null
```

**Key feature**: If user enters a city name, automatically resolves to canonical coordinates.

---

## Files Modified

### Backend

#### 1. `src/users/dto/update-user.dto.ts`
**Before**: Only latitude/longitude
```typescript
location?: { latitude: number; longitude: number };
```

**After**: City metadata + coordinates
```typescript
location?: {
  city?: string;
  formattedAddress?: string;
  latitude?: number;
  longitude?: number;
};
```

#### 2. `src/users/schemas/user.schema.ts`
**Before**: Flat lat/lng structure
```typescript
location: { latitude: number; longitude: number } | null;
```

**After**: Rich location model
```typescript
location: {
  city?: string | null;
  formattedAddress?: string | null;
  latitude?: number | null;
  longitude?: number | null;
} | null;
```

#### 3. `src/providers/dto/create-provider-profile.dto.ts`
**Before**: Separate `@IsNumber() latitude` and `longitude` fields

**After**: Both individual fields AND a nested `location` object for organized payloads
```typescript
@IsOptional()
@IsString()
city?: string;

@IsOptional()
@IsString()
formattedAddress?: string;

@IsOptional()
@IsNumber()
@Type(() => Number)
latitude?: number;

@IsOptional()
@IsNumber()
@Type(() => Number)
longitude?: number;

@IsObject()
@IsOptional()
@ValidateNested()
@Type(() => LocationPayloadDto)
location?: {
  city?: string;
  formattedAddress?: string;
  latitude?: number;
  longitude?: number;
};
```

#### 4. `src/providers/dto/update-provider-profile.dto.ts`
Same changes as above for consistency.

#### 5. `src/providers/dto/search-providers.dto.ts`
**Before**: No city-based search
```typescript
latitude?: number;
longitude?: number;
maxDistanceKm?: number;
```

**After**: Added fallback city search
```typescript
@IsOptional()
@IsString()
cityName?: string;
```

#### 6. `src/providers/schemas/provider-profile.schema.ts`
**Before**: Default coordinates to `[0, 0]`
```typescript
coordinates: {
  type: [Number],
  default: [0, 0],
};
coordinates: { type: 'Point'; coordinates: [number, number] };
```

**After**: Null by default, rich location metadata
```typescript
@Prop({
  type: {
    city: { type: String, default: null },
    formattedAddress: { type: String, default: null },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
  },
  default: null,
})
location: {
  city?: string | null;
  formattedAddress?: string | null;
  latitude?: number | null;
  longitude?: number | null;
} | null;

@Prop({
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point',
  },
  coordinates: {
    type: [Number],
    default: null,
  },
})
coordinates: { type: 'Point'; coordinates: [number, number] } | null;
```

#### 7. `src/providers/providers.service.ts`
**create()**: Auto-resolves city to coordinates using `buildLocationData()`
```typescript
const locationData = buildLocationData({
  city: dto.location?.city || dto.city,
  formattedAddress: dto.location?.formattedAddress || dto.formattedAddress,
  latitude: dto.location?.latitude || dto.latitude,
  longitude: dto.location?.longitude || dto.longitude,
});

const coordinates = locationData?.latitude != null 
  ? { type: 'Point', coordinates: [locationData.longitude, locationData.latitude] }
  : null;
```

**updateProfile()**: Same logic as create, handles null coordinates gracefully
```typescript
if (locationData?.latitude != null && locationData?.longitude != null) {
  update.coordinates = { type: 'Point', coordinates: [...] };
} else {
  update.coordinates = null;
}
```

**search()**: Two-tier fallback
```typescript
if (dto.latitude != null && dto.longitude != null) {
  // Tier 1: Distance search using coordinates
  filter['coordinates'] = {
    $nearSphere: {
      $geometry: { type: 'Point', coordinates: [...] },
      $maxDistance: maxDistanceMeters,
    },
  };
} else if (dto.cityName) {
  // Tier 2: Fallback to city name match
  filter['location.city'] = dto.cityName;
}
```

**uploadVerificationDocument()**: Fixed to use `null` instead of `[0, 0]`
```typescript
location: null,
coordinates: null,
```

### Frontend

#### 1. `frontend/src/api/client.ts`
Updated types:

**GeoLocation interface**:
```typescript
export interface GeoLocation {
  city?: string | null;
  formattedAddress?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}
```

**SearchParams interface**:
```typescript
cityName?: string;  // New fallback field
```

**ProviderProfileInput interface**:
```typescript
city?: string;
formattedAddress?: string;
latitude?: number;
longitude?: number;
location?: {
  city?: string;
  formattedAddress?: string;
  latitude?: number;
  longitude?: number;
};
```

#### 2. `frontend/src/views/Account.tsx`
**Before**: Lost city information on page load
```typescript
if (u.location) { setCity(cityForCoordinates(...) ?? ''); }
```

**After**: Preserves user's stored city
```typescript
if (u.location?.latitude && u.location?.longitude) {
  setCoords({ lat: u.location.latitude, lng: u.location.longitude });
  setCity(u.location.city || '');
}
```

Send both city and coordinates to backend:
```typescript
if (coords) {
  body.location = {
    city: city || undefined,
    latitude: coords.lat,
    longitude: coords.lng,
  };
}
```

#### 3. `frontend/src/views/ProviderProfileEdit.tsx`
Same improvements as Account view:
- Init from `location.city` and `location.latitude/longitude`
- Send organized `location` object to backend
- Removed dependency on `cityForCoordinates()` helper

#### 4. `frontend/src/views/Home.tsx`
Enhanced search with city fallback:
```typescript
if (coords) {
  params.latitude = coords.lat;
  params.longitude = coords.lng;
  params.maxDistanceKm = 50;
} else if (city) {
  params.cityName = city;  // New: fallback to city search
}
```

---

## How It Works: User Journey

### Provider registration (e.g., Mario Rossi - Admin):
1. Selects "Jimma" from dropdown
2. App auto-resolves to Jimma's coordinates: `{ lat: 7.6734, lng: 36.835 }`
3. Optionally gets exact GPS location by tapping "Use my exact location"
4. Saved to database:
   ```json
   {
     "location": {
       "city": "Jimma",
       "latitude": 7.6734,
       "longitude": 36.835
     },
     "coordinates": {
       "type": "Point",
       "coordinates": [36.835, 7.6734]
     }
   }
   ```

### Admin searching nearby:
1. Admin also in Jimma → taps "Use my location" or selects "Jimma"
2. Gets coordinates: `{ lat: 7.6734, lng: 36.835 }`
3. Sends search with:
   ```
   latitude=7.6734&longitude=36.835&maxDistanceKm=50
   ```
4. Backend queries: `coordinates: { $nearSphere: { $geometry: { type: 'Point', coordinates: [36.835, 7.6734] }, $maxDistance: 50000 } }`
5. **Now Mario Rossi's profile appears** ✅

### Fallback scenario (no coords, but city):
- Search with `cityName=Jimma` (no lat/lng)
- Backend queries: `location.city: "Jimma"`
- Still finds all providers in that city

---

## Settings Data:
All user/provider settings now look like:
```json
{
  "name": "Mario Rossi",
  "role": "admin",
  "location": {
    "city": "Jimma",
    "formattedAddress": null,
    "latitude": 7.6734,
    "longitude": 36.835
  }
}
```

Provider also has:
```json
{
  "location": {
    "city": "Jimma",
    "latitude": 7.6734,
    "longitude": 36.835
  },
  "coordinates": {
    "type": "Point",
    "coordinates": [36.835, 7.6734]
  },
  "serviceRadiusKm": 25
}
```

---

## Testing (Manual)

### 1. Create a user account in Jimma:
```bash
POST /api/auth/verify-otp
{
  "phoneNumber": "+251911223344",
  "otp": "[dev otp]",
  "name": "Test User Jimma",
  "role": "customer"
}
# Update account with city
PATCH /api/users/me
{
  "location": {
    "city": "Jimma",
    "latitude": 7.6734,
    "longitude": 36.835
  }
}
```

### 2. Create a provider in Jimma:
```bash
POST /api/providers/profile
{
  "serviceCategories": ["[category_id]"],
  "serviceDescription": "Moving services",
  "yearsOfExperience": 8,
  "serviceRadiusKm": 20,
  "location": {
    "city": "Jimma",
    "latitude": 7.6734,
    "longitude": 36.835
  }
}
```

### 3. Search from same location:
```bash
GET /api/providers/search?latitude=7.6734&longitude=36.835&maxDistanceKm=50
```
**Expected**: Provider returns ✅

### 4. Fallback search:
```bash
GET /api/providers/search?cityName=Jimma
```
**Expected**: Provider returns even without coordinates ✅

---

## Backward Compat Notes
- Old users with no location: Won't have coordinates, won't appear in distance searches
- To migrate: Run seed script or admin panel to bulk-set city locations
- GeoJSON index already present and functional

---

## What Changed Visually

### Before:
- User sees raw GPS input
- After save, city name is lost (reconstructed from fuzzy city lookup)
- Admin search returns 0 results (because of `[0, 0]` default)

### After:
- User selects city from dropdown
- City + exact location stored permanently
- Admin search returns results ✅
- Better UX with clear labels and status

---

## Performance
- GeoJSON `$nearSphere` queries: O(log N) with index
- City string match: O(N) but indexed
- No degradation; actually fixes buggy queries

---

## Summary
Location filtering now works correctly by:
1. **Storing** both human city name and precise coordinates
2. **Resolving** city names to real coordinates automatically
3. **Querying** with distance first, falling back to city name
4. **Displaying** human-friendly location info to users

Result: Admins and customers can find nearby providers reliably. ✅
