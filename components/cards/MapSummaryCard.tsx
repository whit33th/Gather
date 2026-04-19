"use client";

import { useEffect, useMemo, useState } from "react";
import { Map as MapIcon } from "lucide-react";

import TripMap from "@/components/TripMap";
import type { TripMarker } from "@/components/trip/types";
import type { Doc } from "@/convex/_generated/dataModel";

import { cardSurface } from "./shared";

export function MapSummaryCard({
  trip,
  markers,
}: {
  trip: Doc<"trips">;
  markers: TripMarker[];
}) {
  const markerCount = markers.length;
  const categorizedMarkers = useMemo(
    () =>
      markers
        .slice()
        .sort((left, right) => Number(Boolean(right.selected)) - Number(Boolean(left.selected))),
    [markers],
  );
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(
    categorizedMarkers.find((marker) => marker.selected)?.id || categorizedMarkers[0]?.id || null,
  );

  useEffect(() => {
    if (categorizedMarkers.length === 0) {
      setActiveMarkerId(null);
      return;
    }

    if (!activeMarkerId || !categorizedMarkers.some((marker) => marker.id === activeMarkerId)) {
      setActiveMarkerId(
        categorizedMarkers.find((marker) => marker.selected)?.id || categorizedMarkers[0]?.id || null,
      );
    }
  }, [activeMarkerId, categorizedMarkers]);

  const hasMapContent = trip.lat != null && trip.lng != null;

  return (
    <section className={cardSurface("relative flex flex-col overflow-hidden p-0")}>
      {hasMapContent ? (
        <div className="relative h-full min-h-[20rem] w-full">
          <TripMap
            center={trip.lat != null && trip.lng != null ? { lat: trip.lat, lng: trip.lng } : undefined}
            markers={markers}
            activeMarkerId={activeMarkerId || undefined}
            onActiveMarkerChange={(markerId) => setActiveMarkerId(markerId)}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </div>
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-white/[0.03]">
          <MapIcon className="h-12 w-12 text-white/20" />
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white/60">
              Map
            </p>
            <h2 className="mt-1 text-[1.4rem] font-semibold tracking-[-0.04em] text-white">
              {trip.destination}
            </h2>
            <p className="mt-1 text-sm text-white/60">
              {markerCount} pinned location{markerCount !== 1 ? "s" : ""}
            </p>
          </div>
         
        </div>
      </div>
    </section>
  );
}
