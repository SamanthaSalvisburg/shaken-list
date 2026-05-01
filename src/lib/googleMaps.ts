const KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
export const hasGoogleMapsKey = !!KEY;

let loadPromise: Promise<void> | null = null;

export function loadGoogleMaps(): Promise<void> {
  if (!KEY) return Promise.reject(new Error('Google Maps API key not configured'));
  if (typeof window !== 'undefined' && (window as { google?: { maps?: unknown } }).google?.maps) {
    return Promise.resolve();
  }
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src*="maps.googleapis.com/maps/api/js"]'
    );
    if (existing) {
      const start = Date.now();
      const interval = setInterval(() => {
        if ((window as { google?: { maps?: unknown } }).google?.maps) {
          clearInterval(interval);
          resolve();
        } else if (Date.now() - start > 10000) {
          clearInterval(interval);
          reject(new Error('Google Maps load timeout'));
        }
      }, 100);
      return;
    }

    const cbName = `__gm_cb_${Date.now()}`;
    (window as unknown as Record<string, () => void>)[cbName] = () => {
      delete (window as unknown as Record<string, unknown>)[cbName];
      resolve();
    };
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${KEY}&libraries=places&callback=${cbName}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });

  return loadPromise;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export async function geocodeWithCache(address: string): Promise<LatLng | null> {
  const cacheKey = `geocode:${address}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (parsed && typeof parsed.lat === 'number') return parsed;
      if (parsed === null) return null;
    } catch {
      // fall through to fresh geocode
    }
  }

  await loadGoogleMaps();
  const geocoder = new google.maps.Geocoder();
  try {
    const res = await geocoder.geocode({ address });
    const first = res.results[0];
    if (!first) {
      localStorage.setItem(cacheKey, 'null');
      return null;
    }
    const loc = first.geometry.location;
    const coords = { lat: loc.lat(), lng: loc.lng() };
    localStorage.setItem(cacheKey, JSON.stringify(coords));
    return coords;
  } catch {
    return null;
  }
}
