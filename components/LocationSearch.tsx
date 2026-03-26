"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MapPin, Search } from "lucide-react";

interface LocationOption {
  id: string;
  place_name: string;
  center: [number, number];
}

interface LocationSearchProps {
  autoComplete?: string;
  defaultValue?: string;
  id?: string;
  inputLabel?: string;
  name?: string;
  onSelect?: (location: LocationOption) => void;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  value?: string;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function LocationSearch({
  autoComplete = "off",
  defaultValue,
  id,
  inputLabel,
  name,
  onSelect,
  onValueChange,
  placeholder,
  required = false,
  value,
}: LocationSearchProps) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const isControlled = value !== undefined;
  const [query, setQuery] = useState(value ?? defaultValue ?? "");
  const [options, setOptions] = useState<LocationOption[]>([]);
  const [showOptions, setShowOptions] = useState(false);
  const hasToken = Boolean(MAPBOX_TOKEN);
  const suppressOpenRef = useRef(false);
  const hasInteractedRef = useRef(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (isControlled) {
      setQuery(value ?? "");
      return;
    }

    setQuery(defaultValue || "");
  }, [defaultValue, isControlled, value]);

  useEffect(() => {
    if (!hasToken || query.length < 3) {
      requestIdRef.current += 1;
      setOptions([]);
      setShowOptions(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&limit=5`,
          { signal: controller.signal }
        );

        if (!res.ok) {
          setOptions([]);
          return;
        }

        const data = await res.json();
        const features = Array.isArray(data?.features) ? data.features : [];
        if (requestId !== requestIdRef.current) {
          return;
        }
        setOptions(
          features.map((feature: { id: string; place_name: string; center: [number, number] }) => ({
            id: feature.id,
            place_name: feature.place_name,
            center: feature.center,
          }))
        );

        if (suppressOpenRef.current) {
          suppressOpenRef.current = false;
        } else if (hasInteractedRef.current) {
          setShowOptions(true);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        console.error(error);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [hasToken, query]);

  return (
    <div className="relative">
      <div className="relative">
        <input
          id={inputId}
          name={name}
          type="text"
          value={query}
          onChange={(e) => {
            const nextValue = e.target.value;
            hasInteractedRef.current = true;
            if (!isControlled) {
              setQuery(nextValue);
            }
            onValueChange?.(nextValue);
            // Only show suggestions when Mapbox token is configured.
            if (hasToken) setShowOptions(true);
          }}
          onFocus={() => {
            hasInteractedRef.current = true;
            if (hasToken && options.length > 0 && query.length >= 3) {
              setShowOptions(true);
            }
          }}
          aria-label={inputLabel}
          aria-controls={showOptions && options.length > 0 ? `${inputId}-options` : undefined}
          aria-expanded={showOptions && options.length > 0}
          autoComplete={autoComplete}
          className="editorial-input pr-12"
          placeholder={
            hasToken ? placeholder || "Search for a city or place" : "Type your destination"
          }
          required={required}
        />
        <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
      </div>

      {showOptions && options.length > 0 ? (
        <div
          id={`${inputId}-options`}
          role="listbox"
          className="editorial-card absolute z-[70] mt-2 max-h-[18rem] w-full overflow-y-auto rounded-[1.4rem] p-2"
        >
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              role="option"
              onClick={() => {
                suppressOpenRef.current = true;
                if (!isControlled) {
                  setQuery(option.place_name);
                }
                onValueChange?.(option.place_name);
                onSelect?.(option);
                setShowOptions(false);
              }}
              className="flex w-full items-center gap-3 rounded-[1rem] px-4 py-3 text-left text-sm text-[#f7f4ea] transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/8 bg-[#152720] text-[#dbe887]">
                <MapPin className="h-4 w-4" />
              </div>
              <span className="truncate">{option.place_name}</span>
            </button>
          ))}
        </div>
      ) : null}

      {!hasToken ? (
        <p className="mt-2 text-xs text-white/44" role="status" aria-live="polite">
          Mapbox is not configured (missing `NEXT_PUBLIC_MAPBOX_TOKEN`), so suggestions are disabled.
          You can still type a destination.
        </p>
      ) : null}
    </div>
  );
}
