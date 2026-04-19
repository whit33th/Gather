import { redirect } from "next/navigation";

import { getTripViewHref } from "@/components/trip/view";
import type { Id } from "@/convex/_generated/dataModel";

export default async function TripCalendarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tripId = id as Id<"trips">;
  redirect(getTripViewHref(tripId, "calendar"));
}
