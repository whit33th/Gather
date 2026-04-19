import { addDays, differenceInCalendarDays, parseISO } from "date-fns";

import type { ProposalCard, TripMarker } from "@/components/trip/types";
import type { Doc } from "@/convex/_generated/dataModel";

export const fallbackGallery = [
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?auto=format&fit=crop&w=1200&q=80",
] as const;

export function dedupeUrls(urls: Array<string | undefined>) {
  return [...new Set(urls.filter((url): url is string => Boolean(url)))];
}

export function buildTripDates(startDate: string, endDate: string) {
  const start = parseISO(startDate);
  const totalDays = Math.max(
    differenceInCalendarDays(parseISO(endDate), parseISO(startDate)) + 1,
    1,
  );

  return Array.from({ length: totalDays }, (_, index) => addDays(start, index));
}

export function buildTripMarkers(
  trip: Doc<"trips">,
  proposals: ProposalCard[] | undefined,
): TripMarker[] {
  const selectedIds = new Set(
    [
      trip.selectedAccommodationId,
      trip.selectedFoodId,
      trip.selectedActivityId,
      trip.selectedFavoriteId,
    ]
      .filter(Boolean)
      .map((id) => String(id)),
  );

  return [
    ...(trip.lat != null && trip.lng != null
      ? [
          {
            id: "destination",
            name: trip.destination,
            lat: trip.lat,
            lng: trip.lng,
            category: "general" as const,
          },
        ]
      : []),
    ...((proposals || [])
      .filter((proposal) => proposal.lat != null && proposal.lng != null)
      .map((proposal) => ({
        id: proposal._id,
        name: proposal.name,
        locationName: proposal.locationName,
        lat: proposal.lat!,
        lng: proposal.lng!,
        category: (proposal.category || "accommodation") as
          | "accommodation"
          | "food"
          | "activity"
          | "favorite",
        selected: selectedIds.has(proposal._id),
      })) || []),
  ];
}
