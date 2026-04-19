"use client";

import { usePreloadedQuery } from "convex/react";
import { useQuery } from "convex-helpers/react/cache/hooks";

import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";

import TripAvailabilityCalendar from "@/components/cards/TripAvailabilityCalendarCard";
import type { TripPagePreloadedData } from "../preloaded";
import type { AvailabilityMember } from "../types";

export default function TripCalendarView({
  preloaded,
  tripId,
}: {
  preloaded: TripPagePreloadedData;
  tripId: Id<"trips">;
}) {
  const trip = usePreloadedQuery(preloaded.trip) as Doc<"trips">;
  const initialTravelers = usePreloadedQuery(preloaded.travelers) as AvailabilityMember[];
  const liveTravelers = useQuery(api.availabilities.list, { tripId }) as
    | AvailabilityMember[]
    | undefined;
  const travelers = liveTravelers ?? initialTravelers;

  return (
    <TripAvailabilityCalendar
      tripId={tripId}
      travelers={travelers}
      tripStartDate={trip.startDate}
      tripEndDate={trip.endDate}
    />
  );
}
