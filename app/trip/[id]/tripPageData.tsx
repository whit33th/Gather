import "server-only";

import { cache } from "react";
import { preloadedQueryResult } from "convex/nextjs";
import type { Preloaded } from "convex/react";

import AppState from "@/components/AppState";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { preloadServerQuery } from "@/lib/convex-server";

export type TripPagePreloadedData = {
  currentUser: Preloaded<typeof api.users.current>;
  dashboardCards: Preloaded<typeof api.dashboardCards.list>;
  expenses: Preloaded<typeof api.expenses.list>;
  photos: Preloaded<typeof api.photos.list>;
  proposals: Preloaded<typeof api.proposals.listAccommodations>;
  scheduleItems: Preloaded<typeof api.tripScheduleItems.list>;
  tasks: Preloaded<typeof api.tasks.list>;
  travelers: Preloaded<typeof api.availabilities.list>;
  trip: Preloaded<typeof api.trips.get>;
};

export const preloadTripPageData = cache(async (tripId: Id<"trips">): Promise<TripPagePreloadedData> => {
  const [
    trip,
    currentUser,
    proposals,
    travelers,
    expenses,
    tasks,
    photos,
    dashboardCards,
    scheduleItems,
  ] = await Promise.all([
    preloadServerQuery(api.trips.get, { tripId }),
    preloadServerQuery(api.users.current, {}),
    preloadServerQuery(api.proposals.listAccommodations, { tripId }),
    preloadServerQuery(api.availabilities.list, { tripId }),
    preloadServerQuery(api.expenses.list, { tripId }),
    preloadServerQuery(api.tasks.list, { tripId }),
    preloadServerQuery(api.photos.list, { tripId }),
    preloadServerQuery(api.dashboardCards.list, { tripId }),
    preloadServerQuery(api.tripScheduleItems.list, { tripId }),
  ]);

  return {
    trip,
    currentUser,
    proposals,
    travelers,
    expenses,
    tasks,
    photos,
    dashboardCards,
    scheduleItems,
  };
});

export function getPreloadedTripResult(preloaded: TripPagePreloadedData) {
  return preloadedQueryResult(preloaded.trip);
}

export function renderMissingTripState() {
  return (
    <AppState
      eyebrow="Trip unavailable"
      title="This trip is not available to you."
      description="You may no longer be a member of this notebook, or the trip was removed."
    />
  );
}
