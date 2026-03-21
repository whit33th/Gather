"use client";

import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useQuery } from "convex/react";
import { addDays, differenceInCalendarDays, parseISO } from "date-fns";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import { CalendarDays, List, Plus, Search, Share2, UsersRound, X } from "lucide-react";
import {
  TripBoardView,
  TripCalendarView,
  TripListView,
  TripPeopleView,
  TripSearchView,
  type AvailabilityMember,
  type ProposalCard,
} from "../../../components/trip/TripPageViews";
import AppState from "../../../components/AppState";
import UserAvatar from "../../../components/UserAvatar";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { cn } from "../../../lib/utils";

type DashboardView = "board" | "search" | "people" | "calendar" | "list";

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function matchesSearch(query: string, ...values: Array<string | undefined | null>) {
  if (!query) return true;
  return values.some((value) => value?.toLowerCase().includes(query));
}

function getValidView(value: string | null): DashboardView {
  if (value === "search" || value === "people" || value === "calendar" || value === "list") {
    return value;
  }

  return "board";
}

function buildTripDates(startDate: string, endDate: string) {
  const start = parseISO(startDate);
  const totalDays = Math.max(
    differenceInCalendarDays(parseISO(endDate), parseISO(startDate)) + 1,
    1
  );

  return Array.from({ length: totalDays }, (_, index) => addDays(start, index));
}

export default function TripPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tripId = params.id as Id<"trips">;

  const trip = useQuery(api.trips.get, { tripId });
  const proposals = useQuery(api.proposals.listAccommodations, { tripId }) as
    | ProposalCard[]
    | undefined;
  const travelers = useQuery(api.availabilities.list, { tripId }) as
    | AvailabilityMember[]
    | undefined;

  const [copied, setCopied] = useState(false);
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const activeView = getValidView(searchParams.get("view"));
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const normalizedSearchQuery = normalizeSearch(deferredSearchQuery);

  const setView = (view: DashboardView) => {
    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.set("view", view);
    startTransition(() => {
      router.replace(`${pathname}?${nextSearchParams.toString()}` as Route, {
        scroll: false,
      });
    });
    if (view === "search") {
      setSearchOpen(true);
    } else if (!searchQuery.trim()) {
      setSearchOpen(false);
    }
  };

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  const sortedProposals = useMemo(
    () =>
      proposals
        ? [...proposals].sort(
          (left, right) =>
            right.votes - left.votes || left.name.localeCompare(right.name)
        )
        : undefined,
    [proposals]
  );

  const visibleProposals = useMemo(
    () =>
      normalizedSearchQuery
        ? sortedProposals?.filter((proposal) =>
          matchesSearch(
            normalizedSearchQuery,
            proposal.name,
            proposal.locationName,
            proposal.category,
            proposal.authorName
          )
        )
        : sortedProposals,
    [normalizedSearchQuery, sortedProposals]
  );

  const visibleTravelers = useMemo(
    () =>
      normalizedSearchQuery
        ? travelers?.filter((traveler) =>
          matchesSearch(normalizedSearchQuery, traveler.name, traveler.role)
        )
        : travelers,
    [normalizedSearchQuery, travelers]
  );

  if (trip === undefined) {
    return (
      <AppState
        loading
        eyebrow="Trip"
        title="Loading trip"
        description="Syncing proposals, people, and dashboard cards."
        className="bg-[#050505]"
      />
    );
  }

  if (trip === null) {
    return (
      <AppState
        eyebrow="Trip unavailable"
        title="This trip is not available to you."
        description="You may no longer be a member of this notebook, or the trip was removed."
        className="bg-[#050505]"
      />
    );
  }

  const currentViewer = travelers?.find((traveler) => traveler.isCurrentUser);
  const totalTravelers = travelers?.length || 0;
  const headerTravelers = (travelers || []).slice(0, 3);
  const hiddenTravelerCount = Math.max(totalTravelers - headerTravelers.length, 0);
  const tripDates = useMemo(
    () => buildTripDates(trip.startDate, trip.endDate),
    [trip.endDate, trip.startDate]
  );

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
    if (searchOpen && !searchQuery.trim()) {
      setSearchOpen(false);
      if (activeView === "search") {
        setView("board");
      }
      return;
    }

    setSearchOpen(true);
    setView("search");
  };

  const renderActiveView = () => {
    if (activeView === "search") {
      return (
        <TripSearchView
          currentViewerRole={currentViewer?.role}
          proposals={visibleProposals}
          trip={trip}
          tripId={tripId}
        />
      );
    }

    if (activeView === "people") {
      return <TripPeopleView travelers={visibleTravelers} tripId={tripId} />;
    }

    if (activeView === "calendar") {
      return (
        <TripCalendarView
          members={visibleTravelers}
          tripDates={tripDates}
          tripId={tripId}
        />
      );
    }

    if (activeView === "list") {
      return (
        <TripListView normalizedSearchQuery={normalizedSearchQuery} tripId={tripId} />
      );
    }

    return (
      <TripBoardView
        currentViewerRole={currentViewer?.role}
        isAddCardOpen={isAddCardOpen}
        normalizedSearchQuery={normalizedSearchQuery}
        onAddCardOpenChange={setIsAddCardOpen}
        onOpenView={setView}
        sortedProposals={sortedProposals}
        travelers={travelers}
        trip={trip}
        tripId={tripId}
      />
    );
  };

  return (
    <div className="relative min-h-full text-white flex flex-col min-h-full gap-4 min-w-0 gap-4 overflow-x-hidden p-4 sm:p-5 lg:p-6">
      <header className="sticky top-0 z-30">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">


            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={handleSearchToggle}
                className={cn(
                  "trip-glass-icon-button shrink-0",
                  (activeView === "search" || searchOpen) &&
                  "border-white/24 bg-white/[0.14] text-white"
                )}
                aria-label="Open search"
              >
                <Search className="h-4 w-4" />
              </button>

              <div
                className={cn(
                  "overflow-hidden transition-[width,opacity,margin] duration-300 ease-out",
                  searchOpen
                    ? "ml-1 w-[min(18rem,58vw)] opacity-100 sm:w-[min(24rem,40vw)]"
                    : "w-0 opacity-0"
                )}
              >
                <div className="flex h-12 items-center rounded-full border border-white/12 bg-white/[0.08] px-4 shadow-[rgba(255,255,255,0.35)_0px_1px_0px_0px_inset,rgba(255,255,255,0.12)_0px_3px_16px_0px_inset,rgba(255,255,255,0.1)_0px_-2px_16px_0px_inset] backdrop-blur-xl">
                  <Search className="h-4 w-4 shrink-0 text-white/44" />
                  <input
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setSearchQuery(nextValue);
                      if (activeView !== "search") {
                        setView("search");
                      }
                    }}
                    placeholder="Search cards, proposals, people..."
                    className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-white/34"
                  />
                  {searchQuery ? (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="trip-glass-icon-button h-8 w-8 shrink-0"
                      aria-label="Clear search"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setView("board")}
              className={cn(
                "trip-glass-button h-12 px-2 text-sm",
                activeView === "board" &&
                "border-white/24 bg-white/[0.14] text-white"
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
              onClick={() => setView("people")}
              className={cn(
                "trip-glass-icon-button",
                activeView === "people" &&
                "border-white/24 bg-white/[0.14] text-white"
              )}
              aria-label="Open people"
            >
              <UsersRound className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setView("calendar")}
              className={cn(
                "trip-glass-icon-button",
                activeView === "calendar" &&
                "border-white/24 bg-white/[0.14] text-white"
              )}
              aria-label="Open calendar"
            >
              <CalendarDays className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setView("list")}
              className={cn(
                "trip-glass-icon-button",
                activeView === "list" &&
                "border-white/24 bg-white/[0.14] text-white"
              )}
              aria-label="Open lists"
            >
              <List className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setView("board");
                setIsAddCardOpen(true);
              }}
              className="trip-glass-button h-12 px-5 text-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Add Notes</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="trip-glass-button h-12 px-5 text-sm"
            >
              <Share2 className="h-4 w-4" />
              <span>{copied ? "Copied" : "Share"}</span>
            </button>
          </div>
        </div>
      </header>

      <section className="min-w-0 overflow-x-hidden ">{renderActiveView()}</section>
    </div>
  );
}
