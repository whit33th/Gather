import "server-only";

import { cache } from "react";
import { preloadedQueryResult } from "convex/nextjs";

import AppState from "@/components/AppState";
import type { TripPagePreloadedData } from "@/components/trip/preloaded";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { preloadServerQuery } from "@/lib/convex-server";

export const preloadTripPageData = cache(async (tripId: Id<"trips">): Promise<TripPagePreloadedData> => {
  const [
    trip,
    currentUser,
    expenses,
    proposals,
    travelers,
    photos,
  ] = await Promise.all([
    preloadServerQuery(api.trips.get, { tripId }),
    preloadServerQuery(api.users.current, {}),
    preloadServerQuery(api.expenses.list, { tripId }),
    preloadServerQuery(api.proposals.listAccommodations, { tripId }),
    preloadServerQuery(api.availabilities.list, { tripId }),
    preloadServerQuery(api.photos.list, { tripId }),
  ]);

  return {
    trip,
    currentUser,
    expenses,
    proposals,
    travelers,
    photos,
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
