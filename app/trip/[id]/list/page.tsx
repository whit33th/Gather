import type { Id } from "@/convex/_generated/dataModel";

import TripDashboardClient from "../TripDashboardClient";
import { getTripPageData, renderMissingTripState } from "../tripPageData";

export default async function TripListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tripId = id as Id<"trips">;
  const { currentUser, dashboardCards, expenses, photos, proposals, scheduleItems, tasks, travelers, trip } =
    await getTripPageData(tripId);

  if (trip === null) {
    return renderMissingTripState();
  }

  return (
    <TripDashboardClient
      currentUser={currentUser}
      initialDashboardCards={dashboardCards}
      initialExpenses={expenses}
      initialPhotos={photos}
      initialProposals={proposals}
      initialScheduleItems={scheduleItems}
      initialTasks={tasks}
      initialTravelers={travelers}
      initialTrip={trip}
      tripId={tripId}
      view="list"
    />
  );
}
