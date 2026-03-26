import "server-only";

import { cache } from "react";

import AppState from "@/components/AppState";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { fetchServerQuery } from "@/lib/convex-server";

export const getTripPageData = cache(async (tripId: Id<"trips">) => {
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
    fetchServerQuery(api.trips.get, { tripId }),
    fetchServerQuery(api.users.current, {}),
    fetchServerQuery(api.proposals.listAccommodations, { tripId }),
    fetchServerQuery(api.availabilities.list, { tripId }),
    fetchServerQuery(api.expenses.list, { tripId }),
    fetchServerQuery(api.tasks.list, { tripId }),
    fetchServerQuery(api.photos.list, { tripId }),
    fetchServerQuery(api.dashboardCards.list, { tripId }),
    fetchServerQuery(api.tripScheduleItems.list, { tripId }),
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

export function renderMissingTripState() {
  return (
    <AppState
      eyebrow="Trip unavailable"
      title="This trip is not available to you."
      description="You may no longer be a member of this notebook, or the trip was removed."
    />
  );
}
