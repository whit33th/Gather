import AppState from "@/components/AppState";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { fetchServerQuery } from "@/lib/convex-server";

import TripSettingsClient from "./TripSettingsClient";

export default async function TripSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tripId = id as Id<"trips">;
  const trip = await fetchServerQuery(api.trips.get, { tripId });

  if (trip === null) {
    return (
      <AppState
        eyebrow="Trip unavailable"
        title="You cannot edit this trip."
        description="Only members with access to this notebook can change its settings."
      />
    );
  }

  return <TripSettingsClient trip={trip} tripId={tripId} />;
}
