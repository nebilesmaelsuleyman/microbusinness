'use client';
import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import { Link } from '@/lib/router-compat';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import type { ProviderProfile } from '../api/client';
import { providerName, providerUserId } from '../lib/format';

// Leaflet's default marker asset paths break under bundlers; point them at the
// bundled image URLs Vite resolves from the leaflet package.
// Next imports images as objects ({ src, ... }); Leaflet needs the URL string.
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x.src,
  iconUrl: markerIcon.src,
  shadowUrl: markerShadow.src,
});

interface ProviderPin {
  provider: ProviderProfile;
  lat: number;
  lng: number;
}

interface Props {
  providers: ProviderProfile[];
  userCoords?: { lat: number; lng: number } | null;
  height?: number;
}

/** GeoJSON stores [lng, lat]; treat the default [0,0] placeholder as "no location". */
function toPin(p: ProviderProfile): ProviderPin | null {
  const c = p.coordinates?.coordinates;
  if (!c || c.length !== 2) return null;
  const [lng, lat] = c;
  if ((lng === 0 && lat === 0) || Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return { provider: p, lat, lng };
}

/** Keep the viewport framed around whatever points we have. */
function FitBounds({ pins, userCoords }: { pins: ProviderPin[]; userCoords?: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    const points: [number, number][] = pins.map((p) => [p.lat, p.lng]);
    if (userCoords) points.push([userCoords.lat, userCoords.lng]);
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 13);
    } else {
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 14 });
    }
  }, [map, pins, userCoords]);
  return null;
}

export default function ProvidersMap({ providers, userCoords, height = 420 }: Props) {
  const pins = useMemo(
    () => providers.map(toPin).filter((p): p is ProviderPin => p !== null),
    [providers],
  );

  // Default center: user location, else first pin, else a neutral world view.
  const center: [number, number] = userCoords
    ? [userCoords.lat, userCoords.lng]
    : pins.length
      ? [pins[0].lat, pins[0].lng]
      : [9.03, 38.74]; // Addis Ababa as a sensible default

  return (
    <div className="map-wrap card" style={{ height, overflow: 'hidden', position: 'relative' }}>
      <MapContainer center={center} zoom={pins.length ? 12 : 4} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds pins={pins} userCoords={userCoords} />

        {userCoords && (
          <CircleMarker
            center={[userCoords.lat, userCoords.lng]}
            radius={9}
            pathOptions={{ color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.7 }}
          >
            <Popup>You are here</Popup>
          </CircleMarker>
        )}

        {pins.map(({ provider, lat, lng }) => (
          <Marker key={provider._id} position={[lat, lng]}>
            <Popup>
              <strong>{providerName(provider)}</strong>
              {provider.reviewCount > 0 && (
                <div style={{ fontSize: 12, margin: '2px 0' }}>
                  ★ {provider.ratingAverage.toFixed(1)} ({provider.reviewCount})
                </div>
              )}
              <Link to={`/provider/${providerUserId(provider)}`}>View profile →</Link>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {pins.length === 0 && (
        <div className="map-empty">No providers with a pinned location to show on the map.</div>
      )}
    </div>
  );
}
