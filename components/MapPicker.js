import { useEffect, useRef } from 'react';

// This component loads Leaflet dynamically (no SSR)
export default function MapPicker({ lat, lng, onLocationSelect }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load Leaflet CSS client-side only — importing it at the module level (or
    // in _app.js) causes Next.js/Turbopack to try to resolve its relative asset
    // URLs during SSR, which throws a 500 for every page in the app.
    import('leaflet/dist/leaflet.css').catch(() => {});

    // Dynamically import Leaflet
    import('leaflet').then((L) => {
      if (mapInstanceRef.current) return; // already initialized

      // Fix default icon paths
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const defaultLat = lat || 1.2921;
      const defaultLng = lng || 36.8219;

      const map = L.map(mapRef.current).setView([defaultLat, defaultLng], lat ? 14 : 4);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      if (lat && lng) {
        markerRef.current = L.marker([lat, lng]).addTo(map);
      }

      map.on('click', (e) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;

        if (markerRef.current) {
          markerRef.current.setLatLng([clickLat, clickLng]);
        } else {
          markerRef.current = L.marker([clickLat, clickLng]).addTo(map);
        }

        if (onLocationSelect) {
          onLocationSelect({ lat: clickLat.toFixed(6), lng: clickLng.toFixed(6) });
        }
      });

      mapInstanceRef.current = map;
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // Update marker if lat/lng props change externally
  useEffect(() => {
    if (!mapInstanceRef.current || !lat || !lng) return;
    import('leaflet').then((L) => {
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng]).addTo(mapInstanceRef.current);
      }
      mapInstanceRef.current.setView([lat, lng], 14);
    });
  }, [lat, lng]);

  return (
    <div className="w-full">
      <div
        ref={mapRef}
        className="w-full h-64 rounded-xl border border-slate-700 overflow-hidden"
        aria-label="Interactive map — click to drop a PIN"
      />
      <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Click anywhere on the map to drop a PIN and capture coordinates
      </p>
    </div>
  );
}
