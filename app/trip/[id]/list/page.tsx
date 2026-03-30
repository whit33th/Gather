import type { Id } from "@/convex/_generated/dataModel";

import TripDashboardClient from "../TripDashboardClient";
import { getPreloadedTripResult, preloadTripPageData, renderMissingTripState } from "../tripPageData";

export default async function TripListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tripId = id as Id<"trips">;
  const preloaded = await preloadTripPageData(tripId);
  const trip = getPreloadedTripResult(preloaded);

  if (trip === null) {
    return renderMissingTripState();
  }

  return (
    <TripDashboardClient
      preloaded={preloaded}
      tripId={tripId}
      view="list"
    />
  );
}
