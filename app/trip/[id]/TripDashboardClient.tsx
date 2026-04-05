"use client";

import type { Preloaded } from "convex/react";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { usePreloadedQuery } from "convex/react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { CalendarDays, Search, Settings2, Share2, X } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";

import UserAvatar from "@/components/UserAvatar";
import TripSummaryBoard from "@/components/trip/TripSummaryBoard";
import {
  TripListView,
  TripPeopleView,
  type AvailabilityMember,
  type ExpenseCard,
  type PhotoCard,
  type ProposalCard,
  type TaskCard,
} from "@/components/trip/TripPageViews";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import TripAvailabilityCalendar from "@/components/trip/TripAvailabilityCalendar";

export type DashboardView = "board" | "people" | "calendar" | "list";

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

type CurrentUser = {
  _id: string;
  name: string;
  image?: string | null;
  themePreset: string;
  useTripCoverBackground: boolean;
  lastActiveTripId?: Id<"trips"> | null;
  backgroundTrip?: {
    _id?: Id<"trips"> | null;
    title: string;
    coverUrl?: string | null;
  } | null;
} | null;

type TripDashboardPreloadedData = {
  currentUser: Preloaded<typeof api.users.current>;
  dashboardCards: Preloaded<typeof api.dashboardCards.list>;
  expenses: Preloaded<typeof api.expenses.list>;
  photos: Preloaded<typeof api.photos.list>;
  proposals: Preloaded<typeof api.proposals.listAccommodations>;
  scheduleItems: Preloaded<typeof api.tripScheduleItems.list>;
  tasks: Preloaded<typeof api.tasks.list>;
  travelers: Preloaded<typeof api.availabilities.list>;
  trip: Preloaded<typeof api.trips.get>;
};

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function matchesSearch(query: string, ...values: Array<string | undefined | null>) {
  if (!query) return true;
  return values.some((value) => value?.toLowerCase().includes(query));
}

function getViewHref(tripId: Id<"trips">, view: DashboardView): Route {
  if (view === "board") {
    return `/trip/${tripId}` as Route;
  }

  return `/trip/${tripId}/${view}` as Route;
}

export default function TripDashboardClient({
  preloaded,
  tripId,
  view,
}: {
  preloaded: TripDashboardPreloadedData;
  tripId: Id<"trips">;
  view: DashboardView;
}) {
  const currentUser = usePreloadedQuery(preloaded.currentUser) as CurrentUser;
  const initialDashboardCards = usePreloadedQuery(preloaded.dashboardCards) as DashboardCardRecord[];
  const initialExpenses = usePreloadedQuery(preloaded.expenses) as ExpenseCard[];
  const initialPhotos = usePreloadedQuery(preloaded.photos) as PhotoCard[];
  const initialProposals = usePreloadedQuery(preloaded.proposals) as ProposalCard[];
  const initialScheduleItems = usePreloadedQuery(preloaded.scheduleItems) as ScheduleItem[];
  const initialTasks = usePreloadedQuery(preloaded.tasks) as TaskCard[];
  const initialTravelers = usePreloadedQuery(preloaded.travelers) as AvailabilityMember[];
  const initialTrip = usePreloadedQuery(preloaded.trip) as Doc<"trips">;
  const router = useRouter();
  const liveProposals = useQuery(
    api.proposals.listAccommodations,
    view === "board" ? { tripId } : "skip",
  ) as ProposalCard[] | undefined;
  const liveTravelers = useQuery(
    api.availabilities.list,
    view === "board" || view === "people" || view === "calendar" ? { tripId } : "skip",
  ) as AvailabilityMember[] | undefined;
  const setLastActiveTrip = useMutation(api.users.setLastActiveTrip);

  const trip = initialTrip;
  const proposals = liveProposals ?? initialProposals;
  const travelers = liveTravelers ?? initialTravelers;

  const [copied, setCopied] = useState(false);
  const [isNoteComposerOpen, setIsNoteComposerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchHovered, setSearchHovered] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchControlRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const syncedBackgroundTripRef = useRef<string | null>(null);

  const deferredSearchQuery = useDeferredValue(searchQuery);
  const normalizedSearchQuery = normalizeSearch(deferredSearchQuery);
  const hasSearchQuery = Boolean(searchQuery.trim());
  const searchExpanded = searchOpen || searchHovered || searchFocused || hasSearchQuery;

  useEffect(() => {
    if (searchExpanded) {
      searchInputRef.current?.focus();
    }
  }, [searchExpanded]);

  useEffect(() => {
    if (!searchHovered && !searchFocused && !hasSearchQuery) {
      setSearchOpen(false);
    }
  }, [hasSearchQuery, searchFocused, searchHovered]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (searchControlRef.current?.contains(target)) {
        return;
      }

      if (!hasSearchQuery) {
        setSearchOpen(false);
      }
      setSearchFocused(false);
      setSearchHovered(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [hasSearchQuery]);

  useEffect(() => {
    if (!currentUser?.useTripCoverBackground) {
      return;
    }

    if (
      currentUser.lastActiveTripId === tripId ||
      syncedBackgroundTripRef.current === tripId
    ) {
      return;
    }

    syncedBackgroundTripRef.current = tripId;

    void setLastActiveTrip({ tripId }).catch(() => {
      syncedBackgroundTripRef.current = null;
    });
  }, [
    currentUser?.lastActiveTripId,
    currentUser?.useTripCoverBackground,
    setLastActiveTrip,
    tripId,
  ]);

  useEffect(() => {
    if (!currentUser?.useTripCoverBackground || !trip.coverUrl || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem("gather:lastTripCover", trip.coverUrl);
    window.dispatchEvent(new Event("gather:lastTripCoverChanged"));
  }, [currentUser?.useTripCoverBackground, trip.coverUrl]);

  const sortedProposals = useMemo(
    () =>
      [...proposals].sort(
        (left, right) => right.votes - left.votes || left.name.localeCompare(right.name),
      ),
    [proposals],
  );

  const visibleProposals = useMemo(
    () =>
      normalizedSearchQuery
        ? sortedProposals.filter((proposal) =>
          matchesSearch(
            normalizedSearchQuery,
            proposal.name,
            proposal.locationName,
            proposal.category,
            proposal.authorName,
          ),
        )
        : sortedProposals,
    [normalizedSearchQuery, sortedProposals],
  );

  const visibleTravelers = useMemo(
    () =>
      normalizedSearchQuery
        ? travelers.filter((traveler) =>
          matchesSearch(normalizedSearchQuery, traveler.name, traveler.role),
        )
        : travelers,
    [normalizedSearchQuery, travelers],
  );

  const currentViewer = travelers.find((traveler) => traveler.isCurrentUser);
  const headerTravelers = travelers.slice(0, 3);
  const hiddenTravelerCount = Math.max(travelers.length - headerTravelers.length, 0);

  const navigateToView = (nextView: DashboardView) => {
    if (nextView === view) {
      return;
    }

    router.push(getViewHref(tripId, nextView));
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/invite/${trip._id}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleSearchToggle = () => {
    if (searchOpen && !hasSearchQuery) {
      setSearchOpen(false);
      setSearchFocused(false);
      return;
    }

    setSearchOpen(true);
    searchInputRef.current?.focus();
  };

  return (
    <

    >
      <header className="sticky top-4 z-30 flex flex-wrap items-center  justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
          <div className="flex min-w-0 flex-1 items-center">
            <div
              ref={searchControlRef}
              className={cn(
                "trip-glass-button trip-control-surface h-12 overflow-hidden pl-0 transition-[padding,border-color,background-color,box-shadow] duration-300 ease-out",
                searchExpanded ? "pr-2" : "pr-0",
              )}
              style={{
                width: searchExpanded ? "min(24rem, 58vw)" : "3rem",
              }}
              onMouseEnter={() => setSearchHovered(true)}
              onMouseLeave={() => setSearchHovered(false)}
            >
              <button
                type="button"
                onClick={handleSearchToggle}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white transition-colors"
                aria-label={searchExpanded ? "Collapse search" : "Open search"}
              >
                <Search className="h-4 w-4 shrink-0" />
              </button>

              <div
                className={cn(
                  "flex min-w-0 items-center overflow-hidden transition-[width,opacity] duration-300 ease-out",
                  searchExpanded ? "opacity-100" : "opacity-0",
                )}
                style={{
                  width: searchExpanded ? "calc(100% - 3rem)" : "0px",
                }}
              >
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onFocus={() => {
                    setSearchFocused(true);
                    setSearchOpen(true);
                  }}
                  onBlur={() => {
                    setSearchFocused(false);
                  }}
                  onMouseEnter={() => setSearchHovered(true)}
                  placeholder="Search places, people, notes..."
                  className="h-full min-w-0 flex-1 bg-transparent pr-2 text-sm text-white outline-none placeholder:text-white/46"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      searchInputRef.current?.focus();
                    }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/68 transition-colors hover:bg-white/10 hover:text-white"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => navigateToView("people")}
            className={cn(
              "trip-glass-button trip-control-surface h-11 p-2 text-sm",
              view === "board" &&
              "trip-header-button-active border-white/24 bg-white/[0.14] text-white",
            )}
          >
            <div className="flex items-center">
              {headerTravelers.map((traveler, index) => (
                <span key={traveler.memberId} className={index === 0 ? "" : "-ml-2"}>
                  <UserAvatar
                    name={traveler.name}
                    image={traveler.image}
                    seed={traveler.userId}
                    size={32}
                  />
                </span>
              ))}
            </div>
            {hiddenTravelerCount > 0 ? (
              <span className="text-sm text-white/68">+{hiddenTravelerCount}</span>
            ) : null}
          </button>



          <button
            type="button"
            onClick={() => navigateToView("calendar")}
            className={cn(
              "trip-glass-icon-button trip-control-surface",
              view === "calendar" &&
              "trip-header-button-active border-white/24 bg-white/[0.14] text-white",
            )}
            aria-label="Open calendar"
          >
            <CalendarDays className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => router.push(`/trip/${tripId}/settings` as Route)}
            className="trip-glass-icon-button trip-control-surface"
            aria-label="Open trip settings"
          >
            <Settings2 className="h-4 w-4" />
          </button>

          {/* <button
            type="button"
            onClick={() => {
              navigateToView("board");
              setIsNoteComposerOpen(true);
            }}
            className="trip-glass-button trip-control-surface h-12 px-5 text-sm"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:block">Add Notes</span>
          </button> */}

          <button
            type="button"
            onClick={() => void handleShare()}
            className="flex h-11 sm:w-fit w-11 items-center justify-center gap-2 rounded-full border border-white bg-white sm:px-5 text-sm text-black transition hover:border-white hover:bg-[#f4f1e8] hover:text-black"
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:block">{copied ? "Copied" : "Share"}</span>
          </button>
        </div>
      </header>

      <section
        className={cn(
          "relative min-w-0",
          view === "calendar" ? "flex min-h-0 flex-1 flex-col" : "",
        )}
      >
        {view === "people" ? <TripPeopleView travelers={visibleTravelers} /> : null}

        {view === "calendar" ? (
          <TripAvailabilityCalendar
            tripId={tripId}
            travelers={visibleTravelers}
            tripStartDate={trip.startDate}
            tripEndDate={trip.endDate}
          />

        ) : null}

        {view === "list" ? (
          <TripListView
            initialExpenses={initialExpenses}
            initialPhotos={initialPhotos}
            initialTasks={initialTasks}
            normalizedSearchQuery={normalizedSearchQuery}
            tripId={tripId}
          />
        ) : null}

        {view === "board" ? (
          <TripSummaryBoard
            currentViewerRole={currentViewer?.role}
            initialDashboardCards={initialDashboardCards}
            initialExpenses={initialExpenses}
            initialPhotos={initialPhotos}
            initialScheduleItems={initialScheduleItems}
            initialTasks={initialTasks}
            noteComposerOpen={isNoteComposerOpen}
            onNoteComposerOpenChange={setIsNoteComposerOpen}
            onOpenView={navigateToView}
            onOpenSearch={() => {
              setSearchOpen(true);
              searchInputRef.current?.focus();
            }}
            sortedProposals={visibleProposals}
            travelers={visibleTravelers}
            trip={trip}
            tripId={tripId}
          />
        ) : null}
      </section>
    </>
  );
}
