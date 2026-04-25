"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { usePreloadedQuery } from "convex/react";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { useMemo, useState } from "react";
import { BedDouble, Coins, Users } from "lucide-react";

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
import TripShareButton from "./TripShareButton";

export default function TripBoardView({
  preloaded,
  tripId,
}: {
  preloaded: TripPagePreloadedData;
  tripId: Id<"trips">;
}) {
  const trip = usePreloadedQuery(preloaded.trip) as Doc<"trips">;
  const initialExpenses = usePreloadedQuery(
    preloaded.expenses,
  ) as ExpenseCard[];
  const initialPhotos = usePreloadedQuery(preloaded.photos) as PhotoCard[];
  const initialProposals = usePreloadedQuery(
    preloaded.proposals,
  ) as ProposalCard[];
  const initialTravelers = usePreloadedQuery(
    preloaded.travelers,
  ) as AvailabilityMember[];

  const liveExpenses = useQuery(api.expenses.list, { tripId }) as
    | ExpenseCard[]
    | undefined;
  const livePhotos = useQuery(api.photos.list, { tripId }) as
    | PhotoCard[]
    | undefined;
  const liveProposals = useQuery(api.proposals.listAccommodations, {
    tripId,
  }) as ProposalCard[] | undefined;
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
        (left, right) =>
          right.votes - left.votes || left.name.localeCompare(right.name),
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

  const markers = useMemo(
    () => buildTripMarkers(trip, sortedProposals),
    [trip, sortedProposals],
  );

  const heroImage = gallery[0] || fallbackGallery[0];
  const totalBudget = expenses.reduce((sum, item) => sum + item.amount, 0);
  const budgetTarget =
    totalBudget > 0
      ? Math.max(Math.ceil(totalBudget / 0.7 / 50) * 50, totalBudget)
      : 1800;
  const daysLeft = Math.max(
    differenceInCalendarDays(parseISO(trip.startDate), new Date()),
    0,
  );
  const readinessScore = 100;
  const [isBudgetDrawerOpen, setIsBudgetDrawerOpen] = useState(false);
  const showQuickStart =
    proposals.length === 0 || expenses.length === 0 || travelers.length <= 1;

  return (
    <>
      {showQuickStart ? (
        <section className="mb-4 overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5 backdrop-blur-2xl sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <h2 className=" text-[1.85rem] font-semibold tracking-[-0.05em] text-white">
                Finish the first planning loop without guessing
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/60">
                Save a stay, log the first expense, and invite the group so
                people can vote and add their own info.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            <a
              href="#trip-proposals"
              className="rounded-[1.5rem] border border-white/10 bg-black/16 px-4 py-4 transition-colors hover:border-white/18 hover:bg-black/24"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.08] text-white">
                  <BedDouble className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {proposals.length > 0
                      ? "Stays and picks are saved"
                      : "Add your stay"}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-white/55">
                    {proposals.length > 0
                      ? `${proposals.length} place${proposals.length === 1 ? "" : "s"} already in the notebook.`
                      : "Save the hotel, Airbnb, restaurant, or activity the group is considering."}
                  </p>
                </div>
              </div>
            </a>

            <button
              type="button"
              onClick={() => setIsBudgetDrawerOpen(true)}
              className="rounded-[1.5rem] border border-white/10 bg-black/16 px-4 py-4 text-left transition-colors hover:border-white/18 hover:bg-black/24"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.08] text-white">
                  <Coins className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {expenses.length > 0
                      ? "Budget is already moving"
                      : "Log the first cost"}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-white/55">
                    {expenses.length > 0
                      ? `${expenses.length} expense${expenses.length === 1 ? "" : "s"} logged so far.`
                      : "Start with the stay, transport, or first shared meal so the total is visible."}
                  </p>
                </div>
              </div>
            </button>

            <div className="rounded-[1.5rem] border border-white/10 bg-black/16 px-4 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.08] text-white">
                  <Users className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {travelers.length > 1
                      ? "Group is connected"
                      : "Invite the rest of the group"}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-white/55">
                    {travelers.length > 1
                      ? `${travelers.length} travelers can already view and update this trip.`
                      : "Share the invite link so friends can vote, mark dates, and log their own spend."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="md:col-span-2 xl:col-span-2">
          <HeroSummaryCard trip={trip} heroImage={heroImage} />
        </div>

        <div className="md:col-span-1 xl:col-span-1">
          <ReadinessSummaryCard
            daysLeft={daysLeft}
            readinessScore={readinessScore}
          />
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
          sectionId="trip-proposals"
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
