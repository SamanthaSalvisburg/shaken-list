import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Star,
  Search as SearchIcon,
  SlidersHorizontal,
  Locate,
  Plus,
  Minus,
  X,
  Navigation,
  DollarSign,
  Route,
  Info,
} from 'lucide-react';
import { Rating } from '../types/rating';
import { hasGoogleMapsKey, loadGoogleMaps, geocodeWithCache, LatLng } from '../lib/googleMaps';

interface MapScreenProps {
  ratings: Rating[];
}

interface Place {
  key: string;
  barName: string;
  location: string;
  ratings: Rating[];
  coords?: LatLng;
}

interface Filters {
  distance: 0 | 0.5 | 1 | 2 | 5; // 0 = any
  price: 0 | 1 | 2 | 3 | 4; // 0 = any
  minRating: 0 | 3 | 4 | 4.5; // 0 = any
}

const DEFAULT_FILTERS: Filters = { distance: 0, price: 0, minRating: 0 };

function priceTier(price?: number): number {
  if (price === undefined || price === null) return 0;
  if (price < 15) return 1;
  if (price < 20) return 2;
  if (price < 25) return 3;
  return 4;
}

function placeAvgPriceTier(place: Place): number {
  const tiers = place.ratings.map((r) => priceTier(r.price)).filter((t) => t > 0);
  if (tiers.length === 0) return 0;
  return Math.round(tiers.reduce((s, t) => s + t, 0) / tiers.length);
}

function averageRating(place: Place): number {
  if (!place.ratings.length) return 0;
  return place.ratings.reduce((acc, r) => acc + r.rating, 0) / place.ratings.length;
}

function haversineMiles(a: LatLng, b: LatLng): number {
  const R = 3958.8;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function groupByPlace(ratings: Rating[]): Place[] {
  const map = new Map<string, Place>();
  for (const r of ratings) {
    const key = `${r.barName}|||${r.location}`;
    if (!map.has(key)) {
      map.set(key, { key, barName: r.barName, location: r.location, ratings: [] });
    }
    map.get(key)!.ratings.push(r);
  }
  return Array.from(map.values());
}

function priceTierLabel(tier: number): string {
  return '$'.repeat(Math.max(1, tier));
}

export function MapScreen({ ratings }: MapScreenProps) {
  const navigate = useNavigate();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  // Tracks how the map was first centered. 'none' = not yet, 'bars' = fit to all bars
  // (so userLoc can still override), 'user' = locked to user location.
  const initialCenterMode = useRef<'none' | 'bars' | 'user'>('none');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [draftFilters, setDraftFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [userLoc, setUserLoc] = useState<LatLng | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [placeCoords, setPlaceCoords] = useState<Map<string, LatLng>>(new Map());

  const allPlaces = useMemo(() => groupByPlace(ratings), [ratings]);
  const placesWithCoords = useMemo(
    () => allPlaces.map((p) => ({ ...p, coords: placeCoords.get(p.key) })),
    [allPlaces, placeCoords]
  );

  // Apply filters + search query
  const visiblePlaces = useMemo(() => {
    const q = query.trim().toLowerCase();
    return placesWithCoords.filter((p) => {
      if (q && !`${p.barName} ${p.location}`.toLowerCase().includes(q)) return false;
      if (filters.minRating > 0 && averageRating(p) < filters.minRating) return false;
      if (filters.price > 0) {
        const tier = placeAvgPriceTier(p);
        if (tier === 0 || tier !== filters.price) return false;
      }
      if (filters.distance > 0 && userLoc && p.coords) {
        const miles = haversineMiles(userLoc, p.coords);
        if (miles > filters.distance) return false;
      } else if (filters.distance > 0 && !userLoc) {
        return false; // can't evaluate
      }
      return true;
    });
  }, [placesWithCoords, query, filters, userLoc]);

  const selectedPlace = useMemo(
    () => visiblePlaces.find((p) => p.key === selectedKey) ?? null,
    [visiblePlaces, selectedKey]
  );

  // Initialize map once
  useEffect(() => {
    if (!hasGoogleMapsKey) {
      setError('Google Maps API key not configured.');
      setLoading(false);
      return;
    }
    if (!mapContainerRef.current) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !mapContainerRef.current) return;
        const map = new google.maps.Map(mapContainerRef.current, {
          center: { lat: 40.7128, lng: -74.006 },
          zoom: 12,
          disableDefaultUI: true,
          gestureHandling: 'greedy',
          clickableIcons: false,
          styles: [
            { featureType: 'poi', stylers: [{ visibility: 'off' }] },
            { featureType: 'transit', stylers: [{ visibility: 'off' }] },
          ],
        });
        mapRef.current = map;
        if (!cancelled) setLoading(false);
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setError(e.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Geocode all places once on mount/ratings change
  useEffect(() => {
    if (!hasGoogleMapsKey) return;
    let cancelled = false;
    (async () => {
      await loadGoogleMaps();
      const next = new Map<string, LatLng>();
      for (const p of allPlaces) {
        if (cancelled) return;
        const coords = await geocodeWithCache(p.location || p.barName);
        if (coords) next.set(p.key, coords);
      }
      if (!cancelled) setPlaceCoords(next);
    })().catch(() => {/* swallow geocode errors */});
    return () => {
      cancelled = true;
    };
  }, [allPlaces]);

  // Silently request the user's location on mount. If granted, we'll center on it.
  // If denied or unavailable, we fall back to fitting all bars in the markers effect.
  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {/* permission denied or unavailable — fall back to bars-bounds */},
      { timeout: 8000, maximumAge: 300000 }
    );
  }, []);

  // When userLoc arrives, center on it. Overrides an earlier bars-fit (mode='bars'),
  // but won't re-center if user has already been located once (mode='user').
  useEffect(() => {
    if (!mapRef.current || !userLoc) return;
    if (initialCenterMode.current === 'user') return;
    mapRef.current.setCenter(userLoc);
    mapRef.current.setZoom(13);
    initialCenterMode.current = 'user';
  }, [userLoc]);

  // Render markers when visible places change
  useEffect(() => {
    if (!mapRef.current) return;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const bounds = new google.maps.LatLngBounds();
    let plotted = 0;

    for (const place of visiblePlaces) {
      if (!place.coords) continue;
      const isSelected = place.key === selectedKey;
      const marker = new google.maps.Marker({
        map: mapRef.current,
        position: place.coords,
        title: place.barName,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: isSelected ? 12 : 10,
          fillColor: '#C67A52',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 3,
        },
        zIndex: isSelected ? 999 : 1,
      });
      marker.addListener('click', () => setSelectedKey(place.key));
      markersRef.current.push(marker);
      bounds.extend(place.coords);
      plotted++;
    }

    // Only auto-fit to bars if we haven't centered the map yet. Once user-located
    // or already bars-fit, leave the viewport alone so the user can pan freely.
    if (plotted > 0 && !selectedKey && initialCenterMode.current === 'none') {
      if (plotted === 1) {
        mapRef.current.setCenter(bounds.getCenter());
        mapRef.current.setZoom(14);
      } else {
        mapRef.current.fitBounds(bounds, 80);
      }
      initialCenterMode.current = 'bars';
    }
  }, [visiblePlaces, selectedKey]);

  // Pan to selected
  useEffect(() => {
    if (!mapRef.current || !selectedPlace?.coords) return;
    mapRef.current.panTo(selectedPlace.coords);
  }, [selectedPlace]);

  // Render user location marker
  useEffect(() => {
    if (!mapRef.current) return;
    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
      userMarkerRef.current = null;
    }
    if (!userLoc) return;
    userMarkerRef.current = new google.maps.Marker({
      map: mapRef.current,
      position: userLoc,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#4285F4',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 3,
      },
      zIndex: 500,
    });
  }, [userLoc]);

  function requestLocation() {
    if (!('geolocation' in navigator)) {
      setGeoError('Geolocation not supported.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLoc(loc);
        setGeoError(null);
        if (mapRef.current) {
          mapRef.current.panTo(loc);
          mapRef.current.setZoom(14);
        }
      },
      (err) => {
        setGeoError(err.message || 'Location unavailable.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  function zoom(delta: number) {
    if (!mapRef.current) return;
    const z = mapRef.current.getZoom() ?? 12;
    mapRef.current.setZoom(z + delta);
  }

  function openDirections(place: Place) {
    const dest = encodeURIComponent(`${place.barName} ${place.location}`);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}`, '_blank');
  }

  function openFilters() {
    setDraftFilters(filters);
    setFilterOpen(true);
  }

  function applyFilters() {
    setFilters(draftFilters);
    if (draftFilters.distance > 0 && !userLoc) {
      requestLocation();
    }
    setFilterOpen(false);
  }

  function clearFilters() {
    setDraftFilters(DEFAULT_FILTERS);
  }

  const filtersActive =
    filters.distance > 0 || filters.price > 0 || filters.minRating > 0;

  const selectedDistance =
    selectedPlace && userLoc && selectedPlace.coords
      ? haversineMiles(userLoc, selectedPlace.coords)
      : null;
  const selectedPriceTier = selectedPlace ? placeAvgPriceTier(selectedPlace) : 0;

  return (
    <div className="h-full flex flex-col bg-ih-bg dark:bg-ih-bg-dark">
      <div className="h-[env(safe-area-inset-top,20px)]" />

      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0">
          <div ref={mapContainerRef} className="w-full h-full" />
        </div>

        {/* Floating search bar */}
        <div className="absolute top-3 left-4 right-20 flex items-center gap-2 px-4 h-12 rounded-2xl bg-ih-surface dark:bg-ih-surface-dark shadow-md">
          <SearchIcon className="w-[18px] h-[18px] text-ih-text-muted dark:text-ih-text-muted-dark flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search bars on map…"
            className="flex-1 bg-transparent text-[14px] text-ih-text dark:text-ih-text-dark placeholder:text-ih-text-muted dark:placeholder:text-ih-text-muted-dark focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="text-ih-text-muted dark:text-ih-text-muted-dark"
            >
              <X className="w-[18px] h-[18px]" />
            </button>
          )}
        </div>

        {/* Filter button (separate, top-right) */}
        <button
          type="button"
          onClick={openFilters}
          aria-label="Open filters"
          className={`absolute top-3 right-4 w-12 h-12 rounded-2xl shadow-md flex items-center justify-center ${
            filtersActive
              ? 'bg-ih-accent text-white'
              : 'bg-ih-surface dark:bg-ih-surface-dark text-ih-accent'
          }`}
        >
          <SlidersHorizontal className="w-5 h-5" />
        </button>

        {/* Locate button */}
        <button
          type="button"
          onClick={requestLocation}
          aria-label="My location"
          className="absolute top-[72px] right-4 w-12 h-12 rounded-2xl bg-ih-surface dark:bg-ih-surface-dark shadow-md flex items-center justify-center text-ih-accent"
        >
          <Locate className="w-5 h-5" />
        </button>

        {/* Zoom controls */}
        <div className="absolute top-[140px] right-4 flex flex-col rounded-2xl bg-ih-surface dark:bg-ih-surface-dark shadow-md overflow-hidden">
          <button
            type="button"
            onClick={() => zoom(1)}
            aria-label="Zoom in"
            className="w-12 h-12 flex items-center justify-center text-ih-text dark:text-ih-text-dark"
          >
            <Plus className="w-5 h-5" />
          </button>
          <div className="h-px bg-ih-border dark:bg-ih-border-dark" />
          <button
            type="button"
            onClick={() => zoom(-1)}
            aria-label="Zoom out"
            className="w-12 h-12 flex items-center justify-center text-ih-text dark:text-ih-text-dark"
          >
            <Minus className="w-5 h-5" />
          </button>
        </div>

        {loading && !error && (
          <div className="absolute inset-x-0 top-[68px] flex items-center justify-center pointer-events-none">
            <div className="bg-ih-surface dark:bg-ih-surface-dark px-4 py-2 rounded-full text-sm text-ih-text-muted dark:text-ih-text-muted-dark border border-ih-border dark:border-ih-border-dark shadow-sm">
              Loading map…
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="bg-ih-surface dark:bg-ih-surface-dark rounded-2xl p-6 max-w-xs text-center border border-ih-border dark:border-ih-border-dark">
              <MapPin className="w-8 h-8 text-ih-text-muted dark:text-ih-text-muted-dark mx-auto mb-3" />
              <p className="text-sm text-ih-text dark:text-ih-text-dark font-medium mb-1">
                Map unavailable
              </p>
              <p className="text-xs text-ih-text-muted dark:text-ih-text-muted-dark">
                {error}
              </p>
            </div>
          </div>
        )}

        {geoError && filters.distance > 0 && (
          <div className="absolute bottom-4 left-4 right-4 px-3 py-2 rounded-xl bg-ih-negative/95 text-white text-xs text-center">
            Location needed for distance filter — {geoError}
          </div>
        )}

        {/* Bottom card */}
        {selectedPlace && (
          <div className="absolute left-4 right-4 bottom-4 rounded-3xl bg-ih-surface dark:bg-ih-surface-dark shadow-xl p-5 space-y-4 border border-ih-border dark:border-ih-border-dark">
            <button
              type="button"
              aria-label="Close"
              onClick={() => setSelectedKey(null)}
              className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-ih-text-muted dark:text-ih-text-muted-dark hover:bg-ih-surface-warm dark:hover:bg-ih-surface-warm-dark"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start justify-between gap-3 pr-7">
              <div className="min-w-0">
                <div className="text-[18px] font-semibold text-ih-text dark:text-ih-text-dark tracking-tight truncate">
                  {selectedPlace.barName}
                </div>
                <div className="text-[13px] text-ih-text-secondary dark:text-ih-text-secondary-dark truncate">
                  {selectedPlace.location}
                </div>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-ih-accent-soft flex-shrink-0">
                <Star className="w-3.5 h-3.5 text-ih-accent" fill="currentColor" />
                <span className="text-sm font-semibold text-ih-accent">
                  {averageRating(selectedPlace).toFixed(1)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              {selectedDistance !== null && (
                <DetailItem
                  icon={<Navigation className="w-3.5 h-3.5" />}
                  text={`${selectedDistance.toFixed(1)} mi`}
                />
              )}
              <DetailItem
                icon={<MapPin className="w-3.5 h-3.5" />}
                text={`${selectedPlace.ratings.length} ${
                  selectedPlace.ratings.length === 1 ? 'rating' : 'ratings'
                }`}
              />
              {selectedPriceTier > 0 && (
                <DetailItem
                  icon={<DollarSign className="w-3.5 h-3.5" />}
                  text={priceTierLabel(selectedPriceTier)}
                />
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => openDirections(selectedPlace)}
                className="flex-1 h-12 rounded-xl bg-ih-accent flex items-center justify-center gap-2 text-white text-[15px] font-semibold"
              >
                <Route className="w-[18px] h-[18px]" />
                Directions
              </button>
              <button
                type="button"
                onClick={() => navigate(`/rating/${selectedPlace.ratings[0].id}`)}
                className="flex-1 h-12 rounded-xl bg-ih-surface dark:bg-ih-surface-dark border border-ih-border dark:border-ih-border-dark flex items-center justify-center gap-2 text-ih-text dark:text-ih-text-dark text-[15px] font-semibold"
              >
                <Info className="w-[18px] h-[18px]" />
                Details
              </button>
            </div>
          </div>
        )}

        {/* Filter bottom sheet */}
        {filterOpen && (
          <>
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setFilterOpen(false)}
              aria-hidden
            />
            <div className="absolute left-0 right-0 bottom-0 rounded-t-3xl bg-ih-surface dark:bg-ih-surface-dark px-6 pt-3 pb-7 space-y-5 shadow-2xl">
              <div className="flex justify-center">
                <div className="w-10 h-1 rounded-full bg-ih-border-strong dark:bg-ih-border-strong-dark" />
              </div>

              <div className="flex items-center justify-between">
                <h2 className="text-[20px] font-bold text-ih-text dark:text-ih-text-dark tracking-tight">
                  Filters
                </h2>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm font-semibold text-ih-accent"
                >
                  Clear all
                </button>
              </div>

              <FilterChipGroup
                label="Distance"
                value={draftFilters.distance}
                onChange={(v) => setDraftFilters((f) => ({ ...f, distance: v as Filters['distance'] }))}
                options={[
                  { value: 0, label: 'Any' },
                  { value: 0.5, label: '0.5 mi' },
                  { value: 1, label: '1 mi' },
                  { value: 2, label: '2 mi' },
                  { value: 5, label: '5 mi' },
                ]}
              />

              <FilterChipGroup
                label="Price"
                value={draftFilters.price}
                onChange={(v) => setDraftFilters((f) => ({ ...f, price: v as Filters['price'] }))}
                options={[
                  { value: 0, label: 'Any' },
                  { value: 1, label: '$' },
                  { value: 2, label: '$$' },
                  { value: 3, label: '$$$' },
                  { value: 4, label: '$$$$' },
                ]}
              />

              <FilterChipGroup
                label="Minimum rating"
                value={draftFilters.minRating}
                onChange={(v) => setDraftFilters((f) => ({ ...f, minRating: v as Filters['minRating'] }))}
                options={[
                  { value: 0, label: 'Any' },
                  { value: 3, label: '3.0+' },
                  { value: 4, label: '4.0+' },
                  { value: 4.5, label: '4.5+' },
                ]}
              />

              <button
                type="button"
                onClick={applyFilters}
                className="w-full h-12 rounded-xl bg-ih-accent text-white font-semibold text-[15px]"
              >
                Apply filters
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DetailItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[13px] font-medium text-ih-text-secondary dark:text-ih-text-secondary-dark">
      <span className="text-ih-text-muted dark:text-ih-text-muted-dark">{icon}</span>
      {text}
    </div>
  );
}

function FilterChipGroup({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  options: { value: number; label: string }[];
}) {
  return (
    <div className="space-y-2">
      <div className="text-[13px] font-semibold text-ih-text-secondary dark:text-ih-text-secondary-dark">
        {label}
      </div>
      <div className="flex gap-2">
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`flex-1 h-10 rounded-xl text-[13px] font-semibold transition-colors ${
                active
                  ? 'bg-ih-accent text-white'
                  : 'bg-ih-surface dark:bg-ih-surface-dark text-ih-text dark:text-ih-text-dark border border-ih-border-strong dark:border-ih-border-strong-dark'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
