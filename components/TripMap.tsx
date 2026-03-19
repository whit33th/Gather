"use client";

import { useEffect, useRef, useState } from "react";
import Map, { Marker, NavigationControl, Popup, type MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { Expand, Flag, Heart, Hotel, MapPin, Shrink, Utensils } from "lucide-react";

interface MapMarker {
  id: string;
  name: string;
  locationName?: string;
  lat: number;
  lng: number;
  category: "accommodation" | "food" | "activity" | "favorite" | "general";
  selected?: boolean;
}

interface TripMapProps {
  center?: { lat: number; lng: number };
  markers: MapMarker[];
  activeMarkerId?: string;
  onActiveMarkerChange?: (markerId: string) => void;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const ICON_MAP = {
  accommodation: <Hotel className="h-4 w-4" />,
  food: <Utensils className="h-4 w-4" />,
  activity: <Flag className="h-4 w-4" />,
  favorite: <Heart className="h-4 w-4 fill-current" />,
  general: <MapPin className="h-4 w-4" />,
};

const COLOR_MAP = {
  accommodation: "bg-[#8ea3f4]",
  food: "bg-[#f2b266]",
  activity: "bg-[#8ac2a0]",
  favorite: "bg-[#d4a1ad]",
  general: "bg-stone-700",
};

export default function TripMap({
  center,
  markers,
  activeMarkerId,
  onActiveMarkerChange,
}: TripMapProps) {
  const fallbackCenter =
    center || (markers[0] ? { lat: markers[0].lat, lng: markers[0].lng } : { lat: 48.8566, lng: 2.3522 });

  const [viewState, setViewState] = useState({
    longitude: fallbackCenter.lng,
    latitude: fallbackCenter.lat,
    zoom: center || markers.length > 0 ? 11.5 : 3,
  });
  const [hoveredMarker, setHoveredMarker] = useState<MapMarker | null>(null);
  const [clickedMarker, setClickedMarker] = useState<MapMarker | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapRef | null>(null);
  const flyTimeoutRef = useRef<number | null>(null);
  const lastAnimatedMarkerRef = useRef<string | null>(null);

  const defaultZoom = center || markers.length > 0 ? 11.5 : 3;

  useEffect(() => {
    const nextCenter =
      center || (markers[0] ? { lat: markers[0].lat, lng: markers[0].lng } : null);
    if (!nextCenter) {
      return;
    }

    setViewState((previous) => ({
      ...previous,
      longitude: nextCenter.lng,
      latitude: nextCenter.lat,
      zoom: center || markers.length > 0 ? 11.5 : previous.zoom,
    }));
  }, [center, markers]);

  useEffect(() => {
    return () => {
      if (flyTimeoutRef.current) {
        window.clearTimeout(flyTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (event: WheelEvent) => {
      // Keep wheel interactions scoped to the map so the page doesn't scroll underneath.
      event.preventDefault();
      event.stopPropagation();
    };

    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleFullscreenChange = () => {
      const fullscreenActive = document.fullscreenElement === container;
      setIsFullscreen(fullscreenActive);
      window.setTimeout(() => {
        mapRef.current?.resize();
      }, 40);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      mapRef.current?.resize();
    }, 380);

    return () => window.clearTimeout(timeoutId);
  }, [isFullscreen]);

  if (!MAPBOX_TOKEN) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex h-full w-full items-center justify-center rounded-[1.4rem] bg-white text-sm text-stone-500"
      >
        Mapbox token missing
      </div>
    );
  }

  const animateToMarker = (marker: MapMarker) => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    const currentZoom = map.getZoom();
    const midpointZoom = Math.max(3, Math.min(currentZoom, defaultZoom) - 1.1);

    if (flyTimeoutRef.current) {
      window.clearTimeout(flyTimeoutRef.current);
    }

    map.flyTo({
      center: [marker.lng, marker.lat],
      zoom: midpointZoom,
      duration: 520,
      essential: true,
      curve: 1.15,
    });

    flyTimeoutRef.current = window.setTimeout(() => {
      map.flyTo({
        center: [marker.lng, marker.lat],
        zoom: defaultZoom,
        duration: 980,
        essential: true,
        curve: 1.35,
      });
    }, 380);
  };

  useEffect(() => {
    if (!activeMarkerId) return;
    if (activeMarkerId === lastAnimatedMarkerRef.current) return;

    const marker = markers.find((item) => item.id === activeMarkerId);
    if (!marker) return;

    lastAnimatedMarkerRef.current = activeMarkerId;
    animateToMarker(marker);
  }, [activeMarkerId, markers]);

  useEffect(() => {
    if (clickedMarker && !markers.some((item) => item.id === clickedMarker.id)) {
      setClickedMarker(null);
    }
    if (hoveredMarker && !markers.some((item) => item.id === hoveredMarker.id)) {
      setHoveredMarker(null);
    }
  }, [markers, clickedMarker, hoveredMarker]);

  const popupMarker = hoveredMarker || clickedMarker;

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (document.fullscreenElement === container) {
        await document.exitFullscreen();
      } else {
        await container.requestFullscreen();
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div
      ref={containerRef}
      data-lenis-prevent-wheel
      className={`relative h-full w-full overflow-hidden bg-[#eff0ef] transition-[border-radius,box-shadow] duration-300 ${
        isFullscreen
          ? "rounded-none shadow-none"
          : "rounded-[1.4rem]"
      }`}
      style={{ overscrollBehavior: "contain" }}
    >
      {!isMapLoaded ? (
        <div
          role="status"
          aria-live="polite"
          className="absolute inset-0 z-10 flex items-center justify-center bg-[#eff0ef] text-sm text-stone-500"
        >
          Loading map...
        </div>
      ) : null}

      <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={() => void toggleFullscreen()}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-stone-900/10 bg-white/92 text-stone-600 shadow-[0_10px_24px_rgba(15,15,15,0.08)] backdrop-blur-sm transition-colors hover:text-stone-950"
          aria-label={isFullscreen ? "Collapse map" : "Open map fullscreen"}
        >
          {isFullscreen ? <Shrink className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
        </button>
      </div>

      <Map
        ref={mapRef}
        {...viewState}
        onLoad={() => setIsMapLoaded(true)}
        onStyleData={() => setIsMapLoaded(true)}
        onMove={(event) => setViewState(event.viewState)}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
        reuseMaps
        scrollZoom
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="bottom-right" />

        {markers.map((marker) => (
          <Marker
            key={marker.id}
            longitude={marker.lng}
            latitude={marker.lat}
            anchor="bottom"
            onClick={(event) => {
              event.originalEvent.stopPropagation();
              setClickedMarker(marker);
              onActiveMarkerChange?.(marker.id);
            }}
          >
            <div
              onMouseEnter={() => setHoveredMarker(marker)}
              onMouseLeave={() =>
                setHoveredMarker((current) => (current?.id === marker.id ? null : current))
              }
              className={`flex cursor-pointer items-center justify-center rounded-full border-2 text-white shadow-md transition-transform hover:scale-110 ${
                marker.selected
                  ? "h-12 w-12 border-[#fff7dd] ring-4 ring-[#f1e3b3]/70"
                  : "h-10 w-10 border-white"
              } ${COLOR_MAP[marker.category]}`}
            >
              {ICON_MAP[marker.category]}
            </div>
          </Marker>
        ))}

        {popupMarker ? (
          <Popup
            longitude={popupMarker.lng}
            latitude={popupMarker.lat}
            anchor="top"
            onClose={() => setClickedMarker(null)}
            closeButton
          >
            <div className="p-4">
              <p className="section-kicker text-[0.58rem]">
                {popupMarker.selected ? "Chosen pick" : popupMarker.category}
              </p>
              <p className="mt-2 text-sm font-semibold text-stone-900">{popupMarker.name}</p>
              {popupMarker.locationName ? (
                <p className="mt-1 text-sm text-stone-500">{popupMarker.locationName}</p>
              ) : null}
            </div>
          </Popup>
        ) : null}
      </Map>
    </div>
  );
}
