import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

interface PlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect?: (place: { name: string; address: string }) => void;
  placeholder?: string;
}

interface Prediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

declare global {
  interface Window {
    google: typeof google;
    initGoogleMaps: () => void;
  }
}

// Google Maps API Key - set this in Vercel environment variables
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

let isLoadingScript = false;
let isScriptLoaded = false;
const loadCallbacks: (() => void)[] = [];

function loadGoogleMapsScript(callback: () => void) {
  if (isScriptLoaded) {
    callback();
    return;
  }

  loadCallbacks.push(callback);

  if (isLoadingScript) {
    return;
  }

  if (!GOOGLE_MAPS_API_KEY) {
    console.log('Google Maps API key not configured - using manual entry');
    console.log('Expected env var: VITE_GOOGLE_MAPS_API_KEY');
    return;
  }

  console.log('Loading Google Maps with API key...');
  isLoadingScript = true;

  window.initGoogleMaps = () => {
    console.log('Google Maps loaded successfully!');
    isScriptLoaded = true;
    isLoadingScript = false;
    loadCallbacks.forEach(cb => cb());
    loadCallbacks.length = 0;
  };

  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGoogleMaps`;
  script.async = true;
  script.defer = true;
  script.onerror = (error) => {
    console.error('Failed to load Google Maps:', error);
  };
  document.head.appendChild(script);
}

export function PlacesAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder = 'Search for a bar or restaurant',
}: PlacesAutocompleteProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    loadGoogleMapsScript(() => {
      if (window.google?.maps?.places) {
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
        setIsLoaded(true);
      }
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchPlaces = useCallback((inputValue: string) => {
    if (!autocompleteService.current || inputValue.length < 2) {
      setPredictions([]);
      setIsOpen(false);
      setIsSearching(false);
      return;
    }

    autocompleteService.current.getPlacePredictions(
      {
        input: inputValue,
        types: ['establishment'],
      },
      (results, status) => {
        setIsSearching(false);
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          setPredictions(results.slice(0, 5));
          setIsOpen(true);
        } else {
          setPredictions([]);
          setIsOpen(false);
        }
      }
    );
  }, []);

  const handleInputChange = (inputValue: string) => {
    onChange(inputValue);

    if (!isLoaded) {
      return;
    }

    // Debounce the search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (inputValue.length >= 2) {
      setIsSearching(true);
      debounceRef.current = setTimeout(() => {
        searchPlaces(inputValue);
      }, 300);
    } else {
      setPredictions([]);
      setIsOpen(false);
    }
  };

  const handleSelectPrediction = (prediction: Prediction) => {
    const name = prediction.structured_formatting.main_text;
    const address = prediction.structured_formatting.secondary_text;

    onChange(address);
    setIsOpen(false);
    setPredictions([]);

    if (onPlaceSelect) {
      onPlaceSelect({ name, address });
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-ih-border-strong dark:border-ih-border-strong-dark">
        {isSearching ? (
          <Loader2 className="w-[18px] h-[18px] text-ih-text-muted dark:text-ih-text-muted-dark flex-shrink-0 animate-spin" />
        ) : (
          <MapPin className="w-[18px] h-[18px] text-ih-text-muted dark:text-ih-text-muted-dark flex-shrink-0" />
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => predictions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-ih-text dark:text-ih-text-dark placeholder:text-ih-text-muted dark:placeholder:text-ih-text-muted-dark focus:outline-none"
        />
      </div>

      {/* Predictions dropdown */}
      {isOpen && predictions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-ih-surface dark:bg-ih-surface-dark rounded-xl border border-ih-border dark:border-ih-border-dark shadow-lg overflow-hidden">
          {predictions.map((prediction) => (
            <button
              key={prediction.place_id}
              type="button"
              onClick={() => handleSelectPrediction(prediction)}
              className="w-full px-4 py-3 text-left hover:bg-ih-surface-warm dark:hover:bg-ih-surface-warm-dark transition-colors border-b border-ih-border dark:border-ih-border-dark last:border-b-0"
            >
              <div className="text-sm font-medium text-ih-text dark:text-ih-text-dark">
                {prediction.structured_formatting.main_text}
              </div>
              <div className="text-xs text-ih-text-muted dark:text-ih-text-muted-dark truncate">
                {prediction.structured_formatting.secondary_text}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
