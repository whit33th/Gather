"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { addDays, differenceInCalendarDays, parseISO } from "date-fns";
import TripSummaryBoard from "./TripSummaryBoard";
import {
  AvailabilityStudio,
  BudgetStudio,
  GalleryStudio,
  MapStudio,
  ProposalStudio,
  TasksStudio,
} from "./TripOverview";
import AppState from "../AppState";
import UserAvatar from "../UserAvatar";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";

export type ProposalCard = {
  _id: string;
  name: string;
  link?: string;
  locationName?: string;
  imageUrl?: string;
  lat?: number;
  lng?: number;
  category?: "accommodation" | "food" | "activity" | "favorite";
  votes: number;
  isVotedByMe: boolean;
  isOwnedByMe?: boolean;
  authorName: string;
  authorImage?: string;
  authorUserId?: string;
  voters: Array<{ userId?: string; name: string; image?: string }>;
};

export type AvailabilityMember = {
  userId: string;
  memberId: string;
  name: string;
  image?: string;
  role: "owner" | "member";
  isCurrentUser: boolean;
  availabilities: Array<{
    date: string;
    status: "yes" | "no" | "maybe";
  }>;
};

type PhotoCard = {
  _id: string;
  url: string;
  uploaderName: string;
  uploaderImage?: string;
  uploaderUserId?: string;
  canDelete?: boolean;
};

type ExpenseCard = {
  _id: string;
  title: string;
  amount: number;
  payerName: string;
  payerImage?: string;
  payerUserId?: string;
};

type TaskCard = {
  _id: Id<"packingItems">;
  _creationTime: number;
  tripId: Id<"trips">;
  name: string;
  category: string;
  isChecked: boolean;
  assignedTo?: Id<"members">;
};

type TripMarker = {
  id: string;
  name: string;
  locationName?: string;
  lat: number;
  lng: number;
  category: "general" | "accommodation" | "food" | "activity" | "favorite";
  selected?: boolean;
};

function surface(extra = "") {
  return `rounded-[30px] border border-[#23362d] bg-[linear-gradient(180deg,#10211b,#0b1713)] text-[#f7f4ea] shadow-[0_24px_60px_rgba(0,0,0,0.22)] ${extra}`;
}

function buildTripDates(startDate: string, endDate: string) {
  const start = parseISO(startDate);
  const totalDays = Math.max(
    differenceInCalendarDays(parseISO(endDate), parseISO(startDate)) + 1,
    1
  );

  return Array.from({ length: totalDays }, (_, index) => addDays(start, index));
}

function matchesSearch(query: string, ...values: Array<string | undefined | null>) {
  if (!query) return true;
  return values.some((value) => value?.toLowerCase().includes(query));
}

function buildMarkers(trip: Doc<"trips">, proposals: ProposalCard[] | undefined) {
  const selectedIds = new Set(
    [
      trip.selectedAccommodationId,
      trip.selectedFoodId,
      trip.selectedActivityId,
      trip.selectedFavoriteId,
    ]
      .filter(Boolean)
      .map((id) => String(id))
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

export function TripBoardView({
  currentViewerRole,
  noteComposerOpen,
  onNoteComposerOpenChange,
  onOpenView,
  sortedProposals,
  travelers,
  trip,
  tripId,
}: {
  currentViewerRole?: "owner" | "member";
  noteComposerOpen: boolean;
  onNoteComposerOpenChange: (open: boolean) => void;
  onOpenView: (view: "board" | "search" | "people" | "calendar" | "list") => void;
  sortedProposals: ProposalCard[] | undefined;
  travelers: AvailabilityMember[] | undefined;
  trip: Doc<"trips">;
  tripId: Id<"trips">;
}) {
  return (
    <TripSummaryBoard
      currentViewerRole={currentViewerRole}
      noteComposerOpen={noteComposerOpen}
      onNoteComposerOpenChange={onNoteComposerOpenChange}
      onOpenView={onOpenView}
      sortedProposals={sortedProposals}
      travelers={travelers}
      trip={trip}
      tripId={tripId}
    />
  );
}

export function TripSearchView({
  currentViewerRole,
  proposals,
  trip,
  tripId,
}: {
  currentViewerRole?: "owner" | "member";
  proposals: ProposalCard[] | undefined;
  trip: Doc<"trips">;
  tripId: Id<"trips">;
}) {
  const markers = useMemo(() => buildMarkers(trip, proposals), [proposals, trip]);

  return (
    <div className="min-w-0 space-y-6">
      <ProposalStudio
        trip={trip}
        tripId={tripId}
        proposals={proposals}
        canManageSelections={currentViewerRole === "owner"}
      />
      <MapStudio trip={trip} markers={markers} proposalCount={proposals?.length || 0} />
    </div>
  );
}

export function TripPeopleView({
  travelers,
}: {
  travelers: AvailabilityMember[] | undefined;
}) {
  const syncedTravelers = travelers || [];
  const ownerCount = syncedTravelers.filter((traveler) => traveler.role === "owner").length;

  return (
    <section className={surface("p-6 sm:p-7")}>
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm uppercase tracking-[0.18em] text-white/42">People</p>
          <h1 className="mt-3 text-[2rem] font-semibold tracking-[-0.06em] text-white sm:text-[2.7rem]">
            Everyone on this trip
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#9fb0a3] sm:text-base">
            Full-screen roster for the shared notebook. Keep this view focused on members,
            roles, and sync status instead of splitting the page with chat.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <article className="rounded-[24px] border border-white/10 bg-white/[0.05] px-4 py-4">
            <p className="text-[0.65rem] uppercase tracking-[0.18em] text-white/42">
              Travelers
            </p>
            <p className="mt-3 text-[1.8rem] font-semibold tracking-[-0.06em] text-white">
              {syncedTravelers.length}
            </p>
          </article>
          <article className="rounded-[24px] border border-white/10 bg-white/[0.05] px-4 py-4">
            <p className="text-[0.65rem] uppercase tracking-[0.18em] text-white/42">Owners</p>
            <p className="mt-3 text-[1.8rem] font-semibold tracking-[-0.06em] text-white">
              {ownerCount}
            </p>
          </article>
          <article className="col-span-2 rounded-[24px] border border-white/10 bg-white/[0.05] px-4 py-4 sm:col-span-1">
            <p className="text-[0.65rem] uppercase tracking-[0.18em] text-white/42">
              Synced
            </p>
            <p className="mt-3 text-[1.8rem] font-semibold tracking-[-0.06em] text-white">
              {syncedTravelers.length > 0 ? "Live" : "Pending"}
            </p>
          </article>
        </div>
      </div>

      {syncedTravelers.length > 0 ? (
        <div className="mt-8 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {syncedTravelers.map((traveler) => (
            <article
              key={traveler.memberId}
              className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(21,37,30,0.96),rgba(14,24,20,0.92))] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.18)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                  <UserAvatar
                    name={traveler.name}
                    image={traveler.image}
                    seed={traveler.userId}
                    size={52}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-lg font-medium text-white">{traveler.name}</p>
                    <p className="mt-1 text-sm text-white/46">
                      {traveler.isCurrentUser ? "You" : traveler.role || "member"}
                    </p>
                  </div>
                </div>

                <span className="rounded-full border border-[#31463c] bg-[#152720] px-3 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[#d7e1d3]">
                  {traveler.role}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-[20px] border border-white/8 bg-white/[0.04] px-4 py-3">
                  <p className="text-[0.62rem] uppercase tracking-[0.16em] text-white/42">
                    Availability
                  </p>
                  <p className="mt-2 text-sm font-medium text-white">
                    {traveler.availabilities.length} days marked
                  </p>
                </div>
                <div className="rounded-[20px] border border-white/8 bg-white/[0.04] px-4 py-3">
                  <p className="text-[0.62rem] uppercase tracking-[0.16em] text-white/42">
                    Presence
                  </p>
                  <p className="mt-2 text-sm font-medium text-white">
                    {traveler.isCurrentUser ? "Current account" : "Shared member"}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-[28px] border border-dashed border-[#31463c] bg-[#12241d] px-5 py-6">
          <p className="text-base font-medium text-white">No people synced yet</p>
          <p className="mt-2 text-sm leading-6 text-[#9fb0a3]">
            Once members join this trip, the roster will fill the whole view instead of
            opening chat.
          </p>
        </div>
      )}
    </section>
  );
}

export function TripCalendarView({
  members,
  tripDates,
  tripId,
}: {
  members: AvailabilityMember[] | undefined;
  tripDates: Date[];
  tripId: Id<"trips">;
}) {
  return <AvailabilityStudio tripId={tripId} dates={tripDates} members={members} />;
}

export function TripListView({
  normalizedSearchQuery,
  tripId,
}: {
  normalizedSearchQuery: string;
  tripId: Id<"trips">;
}) {
  const expenses = useQuery(api.expenses.list, { tripId }) as ExpenseCard[] | undefined;
  const tasks = useQuery(api.tasks.list, { tripId }) as TaskCard[] | undefined;
  const photos = useQuery(api.photos.list, { tripId }) as PhotoCard[] | undefined;

  const totalBudget = expenses?.reduce((sum, item) => sum + item.amount, 0) || 0;

  const visibleExpenses = useMemo(
    () =>
      normalizedSearchQuery
        ? expenses?.filter((expense) =>
            matchesSearch(normalizedSearchQuery, expense.title, expense.payerName)
          )
        : expenses,
    [expenses, normalizedSearchQuery]
  );

  const visibleTasks = useMemo(
    () =>
      normalizedSearchQuery
        ? tasks?.filter((task) =>
            matchesSearch(normalizedSearchQuery, task.name, task.category)
          )
        : tasks,
    [normalizedSearchQuery, tasks]
  );

  return (
    <div className="min-w-0 space-y-6">
      <div className="grid min-w-0 gap-6 xl:grid-cols-2">
        <BudgetStudio
          tripId={tripId}
          expenses={visibleExpenses}
          totalBudget={totalBudget}
        />
        <TasksStudio tripId={tripId} tasks={visibleTasks} />
      </div>
      <GalleryStudio tripId={tripId} photos={photos} />
    </div>
  );
}

export function TripPageLoadingState() {
  return (
    <AppState
      loading
      eyebrow="Trip"
      title="Loading trip"
      description="Syncing proposals, people, and dashboard summaries."
    />
  );
}
