import AppState from "@/components/AppState";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { preloadServerQuery } from "@/lib/convex-server";
import { preloadedQueryResult } from "convex/nextjs";

import TripSettingsClient from "./TripSettingsClient";

export default async function TripSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tripId = id as Id<"trips">;
  const preloadedTrip = await preloadServerQuery(api.trips.get, { tripId });
  const trip = preloadedQueryResult(preloadedTrip);

  if (trip === null) {
    return (
      <AppState
        eyebrow="Trip unavailable"
        title="You cannot edit this trip."
        description="Only members with access to this notebook can change its settings."
      />
    );
  }

  return <TripSettingsClient preloadedTrip={preloadedTrip} tripId={tripId} />;
}
