"use client";

import { useMemo } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { addDays, differenceInCalendarDays, parseISO } from "date-fns";

import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";

import AppState from "../AppState";
import UserAvatar from "../UserAvatar";
import TripSummaryBoard from "./TripSummaryBoard";
import {
  AvailabilityStudio,
  BudgetStudio,
  GalleryStudio,
  MapStudio,
  ProposalStudio,
  TasksStudio,
} from "./TripOverview";

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

export type PhotoCard = {
  _id: string;
  url: string;
  uploaderName: string;
  uploaderImage?: string;
  uploaderUserId?: string;
  canDelete?: boolean;
};

export type ExpenseCard = {
  _id: string;
  title: string;
  amount: number;
  payerName: string;
  payerImage?: string;
  payerUserId?: string;
};

export type TaskCard = {
  _id: Id<"packingItems">;
  _creationTime: number;
  tripId: Id<"trips">;
  name: string;
  category: string;
  isChecked: boolean;
  assignedTo?: Id<"members">;
};

type DashboardCardRecord = {
  _id: Id<"dashboardCards">;
  tripId: Id<"trips">;
  kind:
  | "hero"
  | "arrival"
  | "stay"
  | "weather"
  | "map"
  | "travelers"
  | "tripNotes"
  | "budgetSummary"
  | "spots"
  | "packingSummary"
  | "budget"
  | "packing"
  | "gallery"
  | "proposals"
  | "availability"
  | "chat"
  | "note";
  title?: string;
  content?: string;
  order: number;
};

type ScheduleItem = Doc<"tripScheduleItems">;

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
  return `trip-theme-card rounded-4xl text-[#f7f4ea] ${extra}`;
}

function buildTripDates(startDate: string, endDate: string) {
  const start = parseISO(startDate);
  const totalDays = Math.max(
    differenceInCalendarDays(parseISO(endDate), parseISO(startDate)) + 1,
    1,
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

export function TripBoardView({
  currentViewerRole,
  initialDashboardCards,
  initialExpenses,
  initialPhotos,
  initialScheduleItems,
  initialTasks,
  noteComposerOpen,
  onNoteComposerOpenChange,
  onOpenView,
  sortedProposals,
  travelers,
  trip,
  tripId,
}: {
  currentViewerRole?: "owner" | "member";
  initialDashboardCards: DashboardCardRecord[];
  initialExpenses: ExpenseCard[];
  initialPhotos: PhotoCard[];
  initialScheduleItems: ScheduleItem[];
  initialTasks: TaskCard[];
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
      initialDashboardCards={initialDashboardCards}
      initialExpenses={initialExpenses}
      initialPhotos={initialPhotos}
      initialScheduleItems={initialScheduleItems}
      initialTasks={initialTasks}
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
          <article className="trip-theme-muted rounded-3xl px-4 py-4">
            <p className="text-[0.65rem] uppercase tracking-[0.18em] text-white/42">
              Travelers
            </p>
            <p className="mt-3 text-[1.8rem] font-semibold tracking-[-0.06em] text-white">
              {syncedTravelers.length}
            </p>
          </article>
          <article className="trip-theme-muted rounded-3xl px-4 py-4">
            <p className="text-[0.65rem] uppercase tracking-[0.18em] text-white/42">Owners</p>
            <p className="mt-3 text-[1.8rem] font-semibold tracking-[-0.06em] text-white">
              {ownerCount}
            </p>
          </article>
          <article className="trip-theme-muted col-span-2 rounded-3xl px-4 py-4 sm:col-span-1">
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
            <article key={traveler.memberId} className="trip-theme-card rounded-[28px] p-5">
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

                <span className="trip-theme-chip rounded-full px-3 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em]">
                  {traveler.role}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="trip-theme-muted rounded-[20px] px-4 py-3">
                  <p className="text-[0.62rem] uppercase tracking-[0.16em] text-white/42">
                    Availability
                  </p>
                  <p className="mt-2 text-sm font-medium text-white">
                    {traveler.availabilities.length} days marked
                  </p>
                </div>
                <div className="trip-theme-muted rounded-[20px] px-4 py-3">
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
        <div className="trip-theme-subsurface-solid mt-8 rounded-[28px] border border-dashed px-5 py-6">
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
  initialExpenses,
  initialPhotos,
  initialTasks,
  normalizedSearchQuery,
  tripId,
}: {
  initialExpenses: ExpenseCard[];
  initialPhotos: PhotoCard[];
  initialTasks: TaskCard[];
  normalizedSearchQuery: string;
  tripId: Id<"trips">;
}) {
  const liveExpenses = useQuery(api.expenses.list, { tripId }) as ExpenseCard[] | undefined;
  const liveTasks = useQuery(api.tasks.list, { tripId }) as TaskCard[] | undefined;
  const livePhotos = useQuery(api.photos.list, { tripId }) as PhotoCard[] | undefined;

  const expenses = liveExpenses ?? initialExpenses;
  const tasks = liveTasks ?? initialTasks;
  const photos = livePhotos ?? initialPhotos;
  const totalBudget = expenses.reduce((sum, item) => sum + item.amount, 0);

  const visibleExpenses = useMemo(
    () =>
      normalizedSearchQuery
        ? expenses.filter((expense) =>
          matchesSearch(normalizedSearchQuery, expense.title, expense.payerName),
        )
        : expenses,
    [expenses, normalizedSearchQuery],
  );

  const visibleTasks = useMemo(
    () =>
      normalizedSearchQuery
        ? tasks.filter((task) => matchesSearch(normalizedSearchQuery, task.name, task.category))
        : tasks,
    [normalizedSearchQuery, tasks],
  );

  return (
    <div className="min-w-0 space-y-6">
      <div className="grid min-w-0 gap-6 xl:grid-cols-2">
        <BudgetStudio tripId={tripId} expenses={visibleExpenses} totalBudget={totalBudget} />
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
