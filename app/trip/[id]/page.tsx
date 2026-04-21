import { Activity } from "react";
import { preloadedQueryResult } from "convex/nextjs";

import TripPageHeader from "@/components/trip/views/TripPageHeader";
import TripBackgroundEffects from "@/components/trip/views/TripBackgroundEffects";
import TripBoardView from "@/components/trip/views/TripBoardView";
import TripCalendarView from "@/components/trip/views/TripCalendarView";
import TripPeopleView from "@/components/trip/views/TripPeopleView";
import TripSettingsView from "@/components/trip/views/TripSettingsView";
import { normalizeTripView } from "@/components/trip/view";
import type { AvailabilityMember } from "@/components/trip/types";
import type { Id } from "@/convex/_generated/dataModel";

import { getPreloadedTripResult, preloadTripPageData, renderMissingTripState } from "./tripPageData";

export default async function TripPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string | string[] }>;
}) {
  const [{ id }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const tripId = id as Id<"trips">;
  const preloaded = await preloadTripPageData(tripId);
  const trip = getPreloadedTripResult(preloaded);

  if (trip === null) {
    return renderMissingTripState();
  }

  const travelers = (preloadedQueryResult(preloaded.travelers) || []) as AvailabilityMember[];
  const currentView = normalizeTripView(resolvedSearchParams.view);

  return (
    <>
      <TripBackgroundEffects
        currentUserPreloaded={preloaded.currentUser}
        coverUrl={trip.coverUrl}
        tripId={tripId}
      />

      <TripPageHeader
        currentView={currentView}
        travelers={travelers}
        tripId={tripId}
      />

      <div className="relative min-w-0">
        <Activity mode={currentView === "board" ? "visible" : "hidden"}>
          <TripBoardView preloaded={preloaded} tripId={tripId} />
        </Activity>

        <Activity mode={currentView === "calendar" ? "visible" : "hidden"}>
          <TripCalendarView preloaded={preloaded} tripId={tripId} />
        </Activity>

        <Activity mode={currentView === "people" ? "visible" : "hidden"}>
          <TripPeopleView preloaded={preloaded} tripId={tripId} />
        </Activity>

        <Activity mode={currentView === "settings" ? "visible" : "hidden"}>
          <TripSettingsView preloadedTrip={preloaded.trip} tripId={tripId} />
        </Activity>
      </div>

    </>
  );
}
