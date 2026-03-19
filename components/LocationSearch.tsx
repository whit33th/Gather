"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Search } from "lucide-react";

interface LocationOption {
  id: string;
  place_name: string;
  center: [number, number];
}

interface LocationSearchProps {
  onSelect: (location: LocationOption) => void;
  placeholder?: string;
  defaultValue?: string;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function LocationSearch({
  onSelect,
  placeholder,
  defaultValue,
}: LocationSearchProps) {
  const [query, setQuery] = useState(defaultValue || "");
  const [options, setOptions] = useState<LocationOption[]>([]);
  const [showOptions, setShowOptions] = useState(false);
  const hasToken = Boolean(MAPBOX_TOKEN);
  const suppressOpenRef = useRef(false);

  useEffect(() => {
    setQuery(defaultValue || "");
  }, [defaultValue]);

  useEffect(() => {
    if (!hasToken || query.length < 3) {
      setOptions([]);
      setShowOptions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&limit=5`
        );

        if (!res.ok) {
          setOptions([]);
          return;
        }

        const data = await res.json();
        const features = Array.isArray(data?.features) ? data.features : [];
        setOptions(
          features.map((feature: { id: string; place_name: string; center: [number, number] }) => ({
            id: feature.id,
            place_name: feature.place_name,
            center: feature.center,
          }))
        );

        if (suppressOpenRef.current) {
          suppressOpenRef.current = false;
        } else {
          setShowOptions(true);
        }
      } catch (error) {
        console.error(error);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [hasToken, query]);

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            // Only show suggestions when Mapbox token is configured.
            if (hasToken) setShowOptions(true);
          }}
          onFocus={() => {
            if (hasToken && options.length > 0 && query.length >= 3) {
              setShowOptions(true);
            }
          }}
          className="editorial-input pr-12"
          placeholder={
            hasToken ? placeholder || "Search for a city or place" : "Type your destination"
          }
        />
        <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
      </div>

      {showOptions && options.length > 0 ? (
        <div className="editorial-card absolute z-50 mt-2 w-full overflow-hidden rounded-[1.4rem] p-2">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                suppressOpenRef.current = true;
                setQuery(option.place_name);
                onSelect(option);
                setShowOptions(false);
              }}
              className="flex w-full items-center gap-3 rounded-[1rem] px-4 py-3 text-left text-sm text-stone-700 transition-colors hover:bg-stone-900/[0.04] hover:text-stone-950"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fff2eb] text-[#df5b3e]">
                <MapPin className="h-4 w-4" />
              </div>
              <span className="truncate">{option.place_name}</span>
            </button>
          ))}
        </div>
      ) : null}

      {!hasToken ? (
        <p className="mt-2 text-xs text-stone-500" role="status" aria-live="polite">
          Mapbox is not configured (missing `NEXT_PUBLIC_MAPBOX_TOKEN`), so suggestions are disabled.
          You can still type a destination.
        </p>
      ) : null}
    </div>
  );
}
