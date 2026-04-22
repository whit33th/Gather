"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { usePreloadedQuery } from "convex/react";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { useMemo, useState } from "react";

import { BudgetOverviewCard } from "@/components/cards/BudgetOverviewCard";
import { HeroSummaryCard } from "@/components/cards/HeroSummaryCard";
import { MapSummaryCard } from "@/components/cards/MapSummaryCard";
import { ReadinessSummaryCard } from "@/components/cards/ReadinessSummaryCard";
import WeatherCard from "@/components/cards/WeatherCard";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";

import { GalleryStudio, MapStudio, ProposalStudio } from "../TripOverview";
import type { TripPagePreloadedData } from "../preloaded";
import type {
  AvailabilityMember,
  ExpenseCard,
  PhotoCard,
  ProposalCard,
} from "../types";
import { buildTripMarkers, dedupeUrls, fallbackGallery } from "../utils";
import TripBudgetDrawer from "./TripBudgetDrawer";

export default function TripBoardView({
  preloaded,
  tripId,
}: {
  preloaded: TripPagePreloadedData;
  tripId: Id<"trips">;
}) {
  const trip = usePreloadedQuery(preloaded.trip) as Doc<"trips">;
  const initialExpenses = usePreloadedQuery(preloaded.expenses) as ExpenseCard[];
  const initialPhotos = usePreloadedQuery(preloaded.photos) as PhotoCard[];
  const initialProposals = usePreloadedQuery(preloaded.proposals) as ProposalCard[];
  const initialTravelers = usePreloadedQuery(preloaded.travelers) as AvailabilityMember[];

  const liveExpenses = useQuery(api.expenses.list, { tripId }) as ExpenseCard[] | undefined;
  const livePhotos = useQuery(api.photos.list, { tripId }) as PhotoCard[] | undefined;
  const liveProposals = useQuery(api.proposals.listAccommodations, { tripId }) as
    | ProposalCard[]
    | undefined;
  const liveTravelers = useQuery(api.availabilities.list, { tripId }) as
    | AvailabilityMember[]
    | undefined;

  const expenses = liveExpenses ?? initialExpenses;
  const photos = livePhotos ?? initialPhotos;
  const proposals = liveProposals ?? initialProposals;
  const travelers = liveTravelers ?? initialTravelers;
  const currentViewer = travelers.find((traveler) => traveler.isCurrentUser);
  const sortedProposals = useMemo(
    () =>
      [...proposals].sort(
        (left, right) => right.votes - left.votes || left.name.localeCompare(right.name),
      ),
    [proposals],
  );

  const gallery = useMemo(
    () =>
      dedupeUrls([
        trip.coverUrl,
        ...photos.map((photo) => photo.url),
        ...sortedProposals.map((proposal) => proposal.imageUrl),
        ...fallbackGallery,
      ]),
    [photos, sortedProposals, trip.coverUrl],
  );

  const markers = useMemo(() => buildTripMarkers(trip, sortedProposals), [trip, sortedProposals]);

  const heroImage = gallery[0] || fallbackGallery[0];
  const totalBudget = expenses.reduce((sum, item) => sum + item.amount, 0);
  const budgetTarget =
    totalBudget > 0 ? Math.max(Math.ceil(totalBudget / 0.7 / 50) * 50, totalBudget) : 1800;
  const daysLeft = Math.max(differenceInCalendarDays(parseISO(trip.startDate), new Date()), 0);
  const readinessScore = 100;
  const [isBudgetDrawerOpen, setIsBudgetDrawerOpen] = useState(false);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="md:col-span-2 xl:col-span-2">
          <HeroSummaryCard trip={trip} heroImage={heroImage} />
        </div>

        <div className="md:col-span-1 xl:col-span-1">
          <ReadinessSummaryCard daysLeft={daysLeft} readinessScore={readinessScore} />
        </div>

        <div className="md:col-span-1 xl:col-span-1">
          <MapSummaryCard trip={trip} markers={markers} />
        </div>

        <div className="md:col-span-2 xl:col-span-2">
          <WeatherCard
            lat={trip.lat}
            lng={trip.lng}
            location={trip.locationName || trip.destination}
          />
        </div>

        <div className="md:col-span-2 xl:col-span-2">
          <BudgetOverviewCard
            expenses={expenses}
            totalBudget={totalBudget}
            expenseCount={expenses.length}
            budgetTarget={budgetTarget}
            onOpen={() => setIsBudgetDrawerOpen(true)}
          />
        </div>
      </div>

      <div className="mt-6 space-y-6">
        <ProposalStudio
          trip={trip}
          tripId={tripId}
          proposals={sortedProposals}
          canManageSelections={currentViewer?.role === "owner"}
        />
        <MapStudio trip={trip} markers={markers} />
        <GalleryStudio tripId={tripId} photos={photos} />
      </div>

      <TripBudgetDrawer
        tripId={tripId}
        expenses={expenses}
        totalBudget={totalBudget}
        open={isBudgetDrawerOpen}
        onOpenChange={setIsBudgetDrawerOpen}
      />
    </>
  );
}
