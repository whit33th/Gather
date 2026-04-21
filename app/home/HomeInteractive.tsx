"use client";

import { useState } from "react";
import type { Preloaded } from "convex/react";
import { usePreloadedQuery } from "convex/react";

import CreateTripModalNew from "@/components/CreateTripModalNew";
import { api } from "@/convex/_generated/api";

import { HomeGlobeHero } from "./HomeGlobeHero";
import { HomeTripsFeed } from "./HomeTripsFeed";
import type { HomeTripListItem } from "./types";

export function HomeInteractive({
  preloadedTrips,
}: {
  preloadedTrips: Preloaded<typeof api.trips.list>;
}) {
  const trips = usePreloadedQuery(preloadedTrips) as HomeTripListItem[];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [prefillLocation, setPrefillLocation] = useState<{
    destination: string;
    lat: number;
    lng: number;
  } | null>(null);

  const handleOpenTemplate = (destination: string, lat: number, lng: number) => {
    setPrefillLocation({ destination, lat, lng });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setPrefillLocation(null), 300);
  };

  const sorted = [...trips].sort((a, b) => a.startDate.localeCompare(b.startDate));

  return (
    <>
      <HomeGlobeHero trips={trips} onAddTripFromTemplate={handleOpenTemplate} />
      <HomeTripsFeed sortedTrips={sorted} onCreateTrip={() => setIsModalOpen(true)} />
      <CreateTripModalNew
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        initialDestination={prefillLocation?.destination}
        initialLat={prefillLocation?.lat}
        initialLng={prefillLocation?.lng}
      />
    </>
  );
}
