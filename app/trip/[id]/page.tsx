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
  const [isNoteComposerOpen, setIsNoteComposerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchHovered, setSearchHovered] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const activeView = getValidView(searchParams.get("view"));
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const normalizedSearchQuery = normalizeSearch(deferredSearchQuery);
  const displayedView =
    normalizedSearchQuery && activeView === "board" ? "search" : activeView;
  const searchExpanded =
    searchOpen || searchHovered || searchFocused || Boolean(searchQuery.trim());

  const setView = (view: DashboardView) => {
    if (view === activeView) {
      return;
    }

    const nextSearchParams = new URLSearchParams(searchParams.toString());
    if (view === "board") {
      nextSearchParams.delete("view");
    } else {
      nextSearchParams.set("view", view);
    }

    const nextHref = nextSearchParams.toString()
      ? `${pathname}?${nextSearchParams.toString()}`
      : pathname;

    startTransition(() => {
      router.push(nextHref as Route, {
        scroll: false,
      });
    });

    if (view !== "search" && !searchQuery.trim()) {
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

  const tripDates = useMemo(() => {
    if (!trip) {
      return [];
    }

    return buildTripDates(trip.startDate, trip.endDate);
  }, [trip?.endDate, trip?.startDate]);

  if (trip === undefined) {
    return (
      <AppState
        loading
        eyebrow="Trip"
        title="Loading trip"
        description="Syncing proposals, people, and dashboard cards."
      />
    );
  }

  if (trip === null) {
    return (
      <AppState
        eyebrow="Trip unavailable"
        title="This trip is not available to you."
        description="You may no longer be a member of this notebook, or the trip was removed."
      />
    );
  }

  const currentViewer = travelers?.find((traveler) => traveler.isCurrentUser);
  const totalTravelers = travelers?.length || 0;
  const headerTravelers = (travelers || []).slice(0, 3);
  const hiddenTravelerCount = Math.max(totalTravelers - headerTravelers.length, 0);

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
      setSearchFocused(false);
      return;
    }

    setSearchOpen(true);
  };

  const renderActiveView = () => {
    if (displayedView === "search") {
      return (
        <TripSearchView
          currentViewerRole={currentViewer?.role}
          proposals={visibleProposals}
          trip={trip}
          tripId={tripId}
        />
      );
    }

    if (displayedView === "people") {
      return <TripPeopleView travelers={visibleTravelers} />;
    }

    if (displayedView === "calendar") {
      return (
        <TripCalendarView
          members={visibleTravelers}
          tripDates={tripDates}
          tripId={tripId}
        />
      );
    }

    if (displayedView === "list") {
      return (
        <TripListView normalizedSearchQuery={normalizedSearchQuery} tripId={tripId} />
      );
    }

    return (
      <TripBoardView
        currentViewerRole={currentViewer?.role}
        noteComposerOpen={isNoteComposerOpen}
        onNoteComposerOpenChange={setIsNoteComposerOpen}
        onOpenView={setView}
        sortedProposals={sortedProposals}
        travelers={travelers}
        trip={trip}
        tripId={tripId}
      />
    );
  };

  return (
    <div className="relative flex min-h-full min-w-0 flex-col gap-4 overflow-x-hidden p-4 text-white sm:p-5 lg:p-6">
      <header className="sticky top-0 z-30">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
            <div className="flex min-w-0 flex-1 items-center">
              <div
                className={cn(
                  "trip-glass-button h-12 overflow-hidden px-0 transition-[width,padding,border-color,background-color,box-shadow] duration-300 ease-out",
                  searchExpanded
                    ? "w-[min(19rem,58vw)] pl-0 pr-2 sm:w-[min(24rem,40vw)]"
                    : "w-12 px-0"
                )}
                onMouseEnter={() => setSearchHovered(true)}
                onMouseLeave={() => {
                  setSearchHovered(false);
                  if (!searchOpen && !searchFocused && !searchQuery.trim()) {
                    setSearchHovered(false);
                  }
                }}
              >
                <button
                  type="button"
                  onClick={handleSearchToggle}
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white transition-colors"
                  )}
                  aria-label={searchOpen ? "Close search" : "Open search"}
                >
                  <Search className="h-4 w-4 shrink-0" />
                </button>

                <div
                  className={cn(
                    "flex min-w-0 items-center overflow-hidden transition-[max-width,opacity] duration-300 ease-out",
                    searchExpanded ? "max-w-[18rem] flex-1 opacity-100" : "max-w-0 opacity-0"
                  )}
                >
                  <input
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => {
                      setSearchFocused(false);
                      if (!searchOpen && !searchHovered && !searchQuery.trim()) {
                        setSearchOpen(false);
                      }
                    }}
                    placeholder="Search places, people, notes..."
                    className="h-full min-w-0 flex-1 bg-transparent pr-2 text-sm text-white outline-none placeholder:text-white/46"
                  />
                  {searchQuery ? (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
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
                setIsNoteComposerOpen(true);
              }}
              className="trip-glass-button h-12 px-5 text-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Add Notes</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="rounded-full flex gap-2 justify-center items-center h-12 border-white bg-white px-5 text-sm text-black hover:border-white hover:bg-[#f4f1e8] hover:text-black"
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
