import { preloadedQueryResult } from "convex/nextjs";

import TripPageHeader from "@/components/trip/views/TripPageHeader";
import TripBackgroundEffects from "@/components/trip/views/TripBackgroundEffects";
import TripPersonProfile from "@/components/trip/views/TripPersonProfile";
import type { AvailabilityMember } from "@/components/trip/types";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { preloadServerQuery } from "@/lib/convex-server";

import {
  getPreloadedTripResult,
  preloadTripPageData,
  renderMissingTripState,
} from "../../tripPageData";

export default async function TripPersonProfilePage({
  params,
}: {
  params: Promise<{ id: string; memberId: string }>;
}) {
  const { id, memberId } = await params;
  const tripId = id as Id<"trips">;
  const resolvedMemberId = memberId as Id<"members">;
  const [preloaded, preloadedProfile] = await Promise.all([
    preloadTripPageData(tripId),
    preloadServerQuery(api.members.profile, { tripId, memberId: resolvedMemberId }),
  ]);

  const trip = getPreloadedTripResult(preloaded);
  if (trip === null) {
    return renderMissingTripState();
  }

  const travelers = (preloadedQueryResult(preloaded.travelers) || []) as AvailabilityMember[];

  return (
    <>
      <TripBackgroundEffects
        currentUserPreloaded={preloaded.currentUser}
        coverUrl={trip.coverUrl}
        tripId={tripId}
      />

      <TripPageHeader currentView="people" travelers={travelers} tripId={tripId} />

      <TripPersonProfile
        preloadedProfile={preloadedProfile}
        tripId={tripId}
        memberId={resolvedMemberId}
      />
    </>
  );
}
