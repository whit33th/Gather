"use client";

import { Activity, startTransition, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import {
  CalendarDays,
  CheckSquare,
  CloudSun,
  DollarSign,
  FileText,
  Image as ImageIcon,
  List,
  MapPin,
  Pencil,
  Plus,
  Search,
  Share2,
  UsersRound,
  Wallet,
  X,
} from "lucide-react";
import Navigation from "../../../components/trip/Navigation";
import TripBoard from "../../../components/trip/TripBoard";
import TripChatTab from "../../../components/trip/TripChatTab";
import {
  ArrivalSummaryCard,
  BudgetSummaryCard,
  HeroSummaryCard,
  PackingSummaryCard,
  SpotsSummaryCard,
  StaySummaryCard,
  TravelersSummaryCard,
  TripNotesSummaryCard,
} from "../../../components/trip/TripDashboardCards";
import {
  AvailabilityStudio,
  BudgetStudio,
  GalleryStudio,
  MapStudio,
  ProposalStudio,
  TasksStudio,
} from "../../../components/trip/TripOverview";
import WeatherCard from "../../../components/trip/WeatherCard";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "../../../components/ui/drawer";
import UserAvatar from "../../../components/UserAvatar";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { cn } from "../../../lib/utils";

type DashboardView = "board" | "search" | "people" | "calendar" | "list";

type ProposalCard = {
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

type PhotoCard = {
  _id: string;
  url: string;
  uploaderName: string;
  uploaderImage?: string;
  uploaderUserId?: string;
  canDelete?: boolean;
};

type AvailabilityMember = {
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

type SavedPlan = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
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

const fallbackGallery = [
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?auto=format&fit=crop&w=1200&q=80",
];

const addableCards = [
  {
    kind: "weather" as const,
    title: "Weather",
    description: "Live forecast tied to the trip destination.",
    icon: CloudSun,
  },
  {
    kind: "map" as const,
    title: "Map",
    description: "Live map with destination and proposal markers.",
    icon: MapPin,
  },
  {
    kind: "availability" as const,
    title: "Availability",
    description: "Yes / no / maybe calendar for every traveler.",
    icon: CalendarDays,
  },
  {
    kind: "proposals" as const,
    title: "Proposals",
    description: "Add, edit, vote and pin the group picks.",
    icon: Search,
  },
  {
    kind: "budget" as const,
    title: "Budget",
    description: "Expanded expense editor and breakdown.",
    icon: Wallet,
  },
  {
    kind: "packing" as const,
    title: "Packing",
    description: "Expanded checklist editor.",
    icon: CheckSquare,
  },
  {
    kind: "gallery" as const,
    title: "Gallery",
    description: "Upload and remove trip photos.",
    icon: ImageIcon,
  },
  {
    kind: "chat" as const,
    title: "Chat",
    description: "Keep the trip conversation on the board.",
    icon: UsersRound,
  },
  {
    kind: "note" as const,
    title: "Note",
    description: "Custom planning note card.",
    icon: FileText,
  },
];

function surface(extra = "") {
  return `rounded-[28px] border border-white/10 bg-[#171717] text-white shadow-[0_24px_60px_rgba(0,0,0,0.32)] ${extra}`;
}

function dedupeUrls(urls: Array<string | undefined>) {
  return [...new Set(urls.filter((url): url is string => Boolean(url)))];
}

function tripRange(startDate: string, endDate: string) {
  return `${format(parseISO(startDate), "MMM d")} - ${format(parseISO(endDate), "MMM d, yyyy")}`;
}

function buildTripDates(startDate: string, endDate: string) {
  const start = parseISO(startDate);
  const totalDays = Math.max(
    differenceInCalendarDays(parseISO(endDate), parseISO(startDate)) + 1,
    1
  );

  return Array.from({ length: totalDays }, (_, index) => addDays(start, index));
}

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

export default function TripPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tripId = params.id as Id<"trips">;

  const trip = useQuery(api.trips.get, { tripId });
  const photos = useQuery(api.photos.list, { tripId }) as PhotoCard[] | undefined;
  const proposals = useQuery(api.proposals.listAccommodations, { tripId }) as ProposalCard[] | undefined;
  const travelers = useQuery(api.availabilities.list, { tripId }) as AvailabilityMember[] | undefined;
  const expenses = useQuery(api.expenses.list, { tripId }) as ExpenseCard[] | undefined;
  const tasks = useQuery(api.tasks.list, { tripId }) as TaskCard[] | undefined;
  const dashboardCards = useQuery(api.dashboardCards.list, { tripId }) as DashboardCardRecord[] | undefined;
  const scheduleItems = useQuery(api.tripScheduleItems.list, { tripId }) as Doc<"tripScheduleItems">[] | undefined;

  const ensureDefaultCards = useMutation(api.dashboardCards.ensureDefaults);
  const addDashboardCard = useMutation(api.dashboardCards.add);
  const updateDashboardCard = useMutation(api.dashboardCards.update);
  const removeDashboardCard = useMutation(api.dashboardCards.remove);
  const reorderDashboardCards = useMutation(api.dashboardCards.reorder);

  const [savedPlansOpen, setSavedPlansOpen] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [editingNoteCard, setEditingNoteCard] = useState<DashboardCardRecord | null>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
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
      router.replace(`${pathname}?${nextSearchParams.toString()}` as Route, { scroll: false });
    });
    if (view === "search") {
      setSearchOpen(true);
    } else if (!searchQuery.trim()) {
      setSearchOpen(false);
    }
    setMobileNavOpen(false);
  };

  useEffect(() => {
    if (dashboardCards !== undefined && dashboardCards.length === 0) {
      void ensureDefaultCards({ tripId });
    }
  }, [dashboardCards, ensureDefaultCards, tripId]);

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  const sortedProposals = useMemo(
    () =>
      proposals
        ? [...proposals].sort((left, right) => right.votes - left.votes || left.name.localeCompare(right.name))
        : undefined,
    [proposals]
  );

  const filteredProposals = useMemo(
    () =>
      sortedProposals?.filter((proposal) =>
        matchesSearch(
          normalizedSearchQuery,
          proposal.name,
          proposal.locationName,
          proposal.category,
          proposal.authorName
        )
      ),
    [normalizedSearchQuery, sortedProposals]
  );

  const filteredTravelers = useMemo(
    () => travelers?.filter((traveler) =>
        matchesSearch(normalizedSearchQuery, traveler.name, traveler.role)
      ),
    [normalizedSearchQuery, travelers]
  );

  const filteredExpenses = useMemo(
    () => expenses?.filter((expense) =>
        matchesSearch(normalizedSearchQuery, expense.title, expense.payerName)
      ),
    [expenses, normalizedSearchQuery]
  );

  const filteredTasks = useMemo(
    () => tasks?.filter((task) =>
        matchesSearch(normalizedSearchQuery, task.name, task.category)
      ),
    [normalizedSearchQuery, tasks]
  );

  const filteredDashboardCards = useMemo(
    () => dashboardCards?.filter((card) =>
        matchesSearch(
          normalizedSearchQuery,
          card.title,
          card.content,
          card.kind.replace(/([A-Z])/g, " $1")
        )
      ),
    [dashboardCards, normalizedSearchQuery]
  );

  const tripDates = useMemo(
    () => (trip ? buildTripDates(trip.startDate, trip.endDate) : []),
    [trip]
  );

  const gallery = useMemo(
    () =>
      dedupeUrls([
        trip?.coverUrl,
        ...(photos || []).map((photo) => photo.url),
        ...((sortedProposals || []).map((proposal) => proposal.imageUrl)),
        ...fallbackGallery,
      ]),
    [photos, sortedProposals, trip?.coverUrl]
  );

  if (trip === undefined) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#050505] text-white">
        <div className="flex items-center gap-4 rounded-full border border-white/10 bg-white/5 px-6 py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          <span className="text-sm text-white/72">Loading trip...</span>
        </div>
      </div>
    );
  }

  if (trip === null) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#050505] px-6 text-white">
        <section className={surface("max-w-xl p-8 text-center")}>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">
            Trip unavailable
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.05em]">
            This trip is not available to you.
          </h1>
        </section>
      </div>
    );
  }

  const currentViewer = travelers?.find((traveler) => traveler.isCurrentUser);
  const heroImage = gallery[0] || fallbackGallery[0];
  const totalTravelers = travelers?.length || 0;
  const stayProposal = sortedProposals?.[0];
  const totalBudget = expenses?.reduce((sum, item) => sum + item.amount, 0) || 0;
  const markers = [
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
    ...(filteredProposals || [])
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
        selected:
          trip.selectedAccommodationId === proposal._id ||
          trip.selectedFoodId === proposal._id ||
          trip.selectedActivityId === proposal._id ||
          trip.selectedFavoriteId === proposal._id,
      })),
  ];
  const savedPlans: SavedPlan[] = [
    {
      id: `trip-${trip._id}`,
      title: trip.title,
      subtitle: tripRange(trip.startDate, trip.endDate),
      image: heroImage,
    },
    ...(sortedProposals || []).slice(0, 3).map((proposal, index) => ({
      id: proposal._id,
      title: proposal.name,
      subtitle: proposal.locationName || trip.destination,
      image: proposal.imageUrl || gallery[index + 1] || heroImage,
    })),
  ].slice(0, 4);

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

  const handleSearchReset = () => {
    setSearchQuery("");
    setSearchOpen(false);
    if (activeView === "search") {
      setView("board");
    }
  };

  const handleAddCard = async (kind: (typeof addableCards)[number]["kind"]) => {
    const template = addableCards.find((card) => card.kind === kind);
    await addDashboardCard({
      tripId,
      kind,
      title: kind === "note" ? `Note ${((dashboardCards?.filter((card) => card.kind === "note").length || 0) + 1)}` : template?.title,
      content:
        kind === "note"
          ? "Add transport details, booking references, meeting points, or local reminders here."
          : undefined,
    });

    setIsAddCardOpen(false);
    setView("board");
  };

  const handleRemoveCard = async (cardId: Id<"dashboardCards">) => {
    if (!window.confirm("Delete this card from the dashboard?")) return;
    await removeDashboardCard({ cardId });
  };

  const handleReorderCards = async (cardIds: Id<"dashboardCards">[]) => {
    await reorderDashboardCards({ tripId, cardIds });
  };

  const handleSaveNote = async () => {
    if (!editingNoteCard) return;

    await updateDashboardCard({
      cardId: editingNoteCard._id,
      title: noteTitle.trim() || "Untitled note",
      content: noteContent.trim(),
    });

    setEditingNoteCard(null);
    setNoteTitle("");
    setNoteContent("");
  };

  const getBoardSpan = (kind: DashboardCardRecord["kind"]) => {
    if (kind === "hero") return "lg:col-span-4 lg:row-span-4";
    if (kind === "arrival" || kind === "weather" || kind === "travelers" || kind === "tripNotes") {
      return "lg:col-span-4 lg:row-span-2";
    }
    if (kind === "stay" || kind === "budgetSummary" || kind === "spots" || kind === "packingSummary") {
      return "lg:col-span-4 lg:row-span-3";
    }
    if (kind === "note") return "lg:col-span-6";
    if (kind === "map" || kind === "availability" || kind === "proposals" || kind === "chat") {
      return "lg:col-span-12";
    }
    return "lg:col-span-6";
  };

  const renderBoardCard = (card: DashboardCardRecord) => {
    if (card.kind === "hero") {
      return <HeroSummaryCard trip={trip} heroImage={heroImage} travelerCount={totalTravelers} />;
    }

    if (card.kind === "arrival") {
      return (
        <ArrivalSummaryCard
          tripId={tripId}
          arrivalDate={format(parseISO(trip.startDate), "d MMM yyyy")}
          items={scheduleItems}
        />
      );
    }

    if (card.kind === "stay") {
      return (
        <StaySummaryCard
          proposal={stayProposal}
          image={gallery[1] || heroImage}
          onOpenSearch={() => setView("search")}
        />
      );
    }

    if (card.kind === "weather") {
      return (
        <WeatherCard
          lat={trip.lat}
          lng={trip.lng}
          location={trip.locationName || trip.destination}
        />
      );
    }

    if (card.kind === "map") {
      return <MapStudio trip={trip} markers={markers} proposalCount={sortedProposals?.length || 0} />;
    }

    if (card.kind === "travelers") {
      return <TravelersSummaryCard travelers={travelers} onOpenPeople={() => setView("people")} />;
    }

    if (card.kind === "tripNotes") {
      return <TripNotesSummaryCard card={card} />;
    }

    if (card.kind === "budgetSummary") {
      return <BudgetSummaryCard tripId={tripId} expenses={expenses} totalBudget={totalBudget} />;
    }

    if (card.kind === "spots") {
      return (
        <SpotsSummaryCard
          proposals={sortedProposals || []}
          destination={trip.destination}
          images={gallery.slice(1)}
          onOpenSearch={() => setView("search")}
        />
      );
    }

    if (card.kind === "packingSummary") {
      return <PackingSummaryCard tripId={tripId} tasks={tasks} />;
    }

    if (card.kind === "availability") {
      return <AvailabilityStudio tripId={tripId} dates={tripDates} members={travelers} />;
    }

    if (card.kind === "proposals") {
      return (
        <ProposalStudio
          trip={trip}
          tripId={tripId}
          proposals={sortedProposals}
          canManageSelections={currentViewer?.role === "owner"}
        />
      );
    }

    if (card.kind === "budget") {
      return <BudgetStudio tripId={tripId} expenses={expenses} totalBudget={totalBudget} />;
    }

    if (card.kind === "packing") {
      return <TasksStudio tripId={tripId} tasks={tasks} />;
    }

    if (card.kind === "gallery") {
      return <GalleryStudio tripId={tripId} photos={photos} />;
    }

    if (card.kind === "chat") {
      return <TripChatTab tripId={tripId} />;
    }

    return (
      <section className={surface("p-5")}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-white/42">{card.title || "Note"}</p>
            <p className="mt-4 max-w-2xl whitespace-pre-wrap text-[1.05rem] leading-8 text-white/72">
              {card.content || "Empty note. Open edit to add transport details, bookings or reminders."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingNoteCard(card);
              setNoteTitle(card.title || "");
              setNoteContent(card.content || "");
            }}
            className="trip-glass-icon-button"
            aria-label="Edit note card"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
      </section>
    );
  };

  const visibleCards = normalizedSearchQuery ? filteredDashboardCards : dashboardCards;
  const visibleProposals = normalizedSearchQuery ? filteredProposals : sortedProposals;
  const visibleTravelers = normalizedSearchQuery ? filteredTravelers : travelers;
  const visibleExpenses = normalizedSearchQuery ? filteredExpenses : expenses;
  const visibleTasks = normalizedSearchQuery ? filteredTasks : tasks;
  const headerTravelers = (travelers || []).slice(0, 3);
  const hiddenTravelerCount = Math.max((travelers?.length || 0) - headerTravelers.length, 0);

  return (
    <div className="min-h-dvh overflow-x-hidden bg-[#040404] text-white">
      <div className="flex min-h-dvh min-w-0 flex-col overflow-x-hidden md:flex-row">
        <Navigation
          tripId={tripId}
          title={trip.title}
          destination={trip.destination}
          heroImage={gallery[1] || heroImage}
          currentViewerRole={currentViewer?.role}
          travelerCount={totalTravelers}
          activeView={activeView}
          savedPlans={savedPlans}
          savedPlansOpen={savedPlansOpen}
          mobileNavOpen={mobileNavOpen}
          copied={copied}
          onToggleMobileNav={() => setMobileNavOpen((value) => !value)}
          onSelectView={setView}
          onShare={handleShare}
          onToggleSavedPlans={() => setSavedPlansOpen((value) => !value)}
          onOpenAddCard={() => {
            setMobileNavOpen(false);
            setIsAddCardOpen(true);
          }}
        />

        <main className="min-h-dvh min-w-0 flex-1 overflow-x-hidden">
          <div className="grid min-h-dvh min-w-0 gap-4 overflow-x-hidden p-4 sm:p-5 lg:p-6">
            <header className="sticky top-0 z-30 -mx-4 -mt-4 border-b border-white/10 bg-[#040404]/76 px-4 py-4 backdrop-blur-2xl sm:-mx-5 sm:-mt-5 sm:px-5 lg:-mx-6 lg:-mt-6 lg:px-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={handleSearchToggle}
                    className={cn(
                      "trip-glass-icon-button shrink-0",
                      (activeView === "search" || searchOpen) && "border-white/24 bg-white/[0.14] text-white"
                    )}
                    aria-label="Open search"
                  >
                    <Search className="h-4 w-4" />
                  </button>

                  <div
                    className={cn(
                      "overflow-hidden transition-[width,opacity,margin] duration-300 ease-out",
                      searchOpen ? "ml-1 w-[min(18rem,58vw)] opacity-100 sm:w-[min(24rem,40vw)]" : "w-0 opacity-0"
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

                  <button
                    type="button"
                    onClick={() => setView("people")}
                    className={cn(
                      "trip-glass-icon-button shrink-0",
                      activeView === "people" && "border-white/24 bg-white/[0.14] text-white"
                    )}
                    aria-label="Open people"
                  >
                    <UsersRound className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setView("board")}
                    className={cn(
                      "trip-glass-button h-12 px-3 text-sm",
                      activeView === "board" && "border-white/24 bg-white/[0.14] text-white"
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
                    {hiddenTravelerCount > 0 ? <span className="text-sm text-white/68">+{hiddenTravelerCount}</span> : null}
                  </button>

                  <button
                    type="button"
                    onClick={() => setView("calendar")}
                    className={cn(
                      "trip-glass-icon-button",
                      activeView === "calendar" && "border-white/24 bg-white/[0.14] text-white"
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
                      activeView === "list" && "border-white/24 bg-white/[0.14] text-white"
                    )}
                    aria-label="Open lists"
                  >
                    <List className="h-4 w-4" />
                  </button>

                  <button type="button" onClick={() => setIsAddCardOpen(true)} className="trip-glass-button h-12 px-5 text-sm">
                    <Plus className="h-4 w-4" />
                    <span>Add Notes</span>
                  </button>

                  <button type="button" onClick={handleShare} className="trip-glass-button h-12 px-5 text-sm">
                    <Share2 className="h-4 w-4" />
                    <span>{copied ? "Copied" : "Share"}</span>
                  </button>
                </div>
              </div>
            </header>

            <section className="min-w-0 overflow-x-hidden pt-1">
              <div className={cn("min-w-0", activeView === "board" ? "block" : "hidden")} aria-hidden={activeView !== "board"}>
                <Activity mode={activeView === "board" ? "visible" : "hidden"}>
                  {visibleCards === undefined ? (
                    <TripBoard
                      cards={dashboardCards}
                      getSpan={getBoardSpan}
                      renderCard={renderBoardCard}
                      onRemove={handleRemoveCard}
                      onReorder={handleReorderCards}
                    />
                  ) : visibleCards.length > 0 ? (
                    <TripBoard
                      cards={visibleCards}
                      getSpan={getBoardSpan}
                      renderCard={renderBoardCard}
                      onRemove={handleRemoveCard}
                      onReorder={handleReorderCards}
                    />
                  ) : (
                    <section className={surface("p-8 text-center")}>
                      <p className="text-sm uppercase tracking-[0.18em] text-white/42">No matches</p>
                      <p className="mt-3 text-lg text-white/68">No dashboard cards match this search.</p>
                    </section>
                  )}
                </Activity>
              </div>

              <div className={cn("min-w-0", activeView === "search" ? "block" : "hidden")} aria-hidden={activeView !== "search"}>
                <Activity mode={activeView === "search" ? "visible" : "hidden"}>
                  <div className="min-w-0 space-y-6">
                  <ProposalStudio
                    trip={trip}
                    tripId={tripId}
                    proposals={visibleProposals}
                    canManageSelections={currentViewer?.role === "owner"}
                  />
                  <MapStudio trip={trip} markers={markers} proposalCount={visibleProposals?.length || 0} />
                  </div>
                </Activity>
              </div>

              <div className={cn("min-w-0", activeView === "people" ? "block" : "hidden")} aria-hidden={activeView !== "people"}>
                <Activity mode={activeView === "people" ? "visible" : "hidden"}>
                  <div className="grid min-w-0 gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
                  <section className={surface("p-5")}>
                    <p className="text-sm uppercase tracking-[0.18em] text-white/42">People</p>
                    <div className="mt-4 space-y-3">
                      {(visibleTravelers || []).map((traveler) => (
                        <article
                          key={traveler.memberId}
                          className="flex items-center gap-3 rounded-[20px] border border-white/10 bg-white/6 px-4 py-4"
                        >
                          <UserAvatar
                            name={traveler.name}
                            image={traveler.image}
                            seed={traveler.userId}
                            size={40}
                          />
                          <div className="min-w-0">
                            <p className="truncate text-base font-medium">{traveler.name}</p>
                            <p className="text-sm text-white/46">
                              {traveler.isCurrentUser ? "You" : traveler.role || "member"}
                            </p>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                  <TripChatTab tripId={tripId} />
                  </div>
                </Activity>
              </div>

              <div className={cn("min-w-0", activeView === "calendar" ? "block" : "hidden")} aria-hidden={activeView !== "calendar"}>
                <Activity mode={activeView === "calendar" ? "visible" : "hidden"}>
                  <div className="min-w-0">
                    <AvailabilityStudio tripId={tripId} dates={tripDates} members={visibleTravelers} />
                  </div>
                </Activity>
              </div>

              <div className={cn("min-w-0", activeView === "list" ? "block" : "hidden")} aria-hidden={activeView !== "list"}>
                <Activity mode={activeView === "list" ? "visible" : "hidden"}>
                  <div className="min-w-0 space-y-6">
                  <div className="grid min-w-0 gap-6 xl:grid-cols-2">
                    <BudgetStudio tripId={tripId} expenses={visibleExpenses} totalBudget={totalBudget} />
                    <TasksStudio tripId={tripId} tasks={visibleTasks} />
                  </div>
                  <GalleryStudio tripId={tripId} photos={photos} />
                  </div>
                </Activity>
              </div>
            </section>
          </div>

          {isAddCardOpen ? (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/68 p-4 backdrop-blur-sm"
              role="dialog"
              aria-modal="true"
              aria-labelledby="add-notes-title"
              onClick={() => setIsAddCardOpen(false)}
            >
              <div
                className="w-full max-w-4xl rounded-[32px] border border-white/12 bg-[#101010]/94 p-5 shadow-[0_32px_90px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-6"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-white/42">Add Notes</p>
                    <h2 id="add-notes-title" className="mt-3 text-[1.9rem] font-semibold tracking-[-0.06em] text-white">
                      Insert a dashboard component
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-white/52">
                      Choose a live component to add to the board. Singleton tiles can only exist once.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddCardOpen(false)}
                    className="trip-glass-icon-button"
                    aria-label="Close add notes dialog"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {addableCards.map((card) => {
                    const alreadyAdded =
                      card.kind !== "note" && dashboardCards?.some((item) => item.kind === card.kind);
                    const Icon = card.icon;

                    return (
                      <button
                        key={card.kind}
                        type="button"
                        disabled={alreadyAdded}
                        onClick={() => void handleAddCard(card.kind)}
                        className={cn(
                          "rounded-[24px] border p-4 text-left transition",
                          alreadyAdded
                            ? "border-white/10 bg-white/[0.03] text-white/30"
                            : "border-white/12 bg-white/[0.05] text-white hover:border-white/22 hover:bg-white/[0.08]"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="trip-glass-icon-button h-11 w-11 shrink-0">
                            <Icon className="h-4 w-4" />
                          </span>
                          {alreadyAdded ? (
                            <span className="rounded-full border border-white/10 bg-white/6 px-2.5 py-1 text-[0.68rem] text-white/46">
                              Added
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-4 text-lg font-medium tracking-[-0.03em]">{card.title}</p>
                        <p className="mt-2 text-sm leading-6 text-white/52">{card.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}

          <Drawer open={Boolean(editingNoteCard)} onOpenChange={(open) => !open && setEditingNoteCard(null)}>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Edit Note</DrawerTitle>
                <DrawerDescription>Update the card title and the planning details inside it.</DrawerDescription>
              </DrawerHeader>
              <div className="grid gap-4 px-5 pb-4 sm:px-6">
                <input
                  value={noteTitle}
                  onChange={(event) => setNoteTitle(event.target.value)}
                  placeholder="Card title"
                  className="editorial-input"
                />
                <textarea
                  rows={8}
                  value={noteContent}
                  onChange={(event) => setNoteContent(event.target.value)}
                  placeholder="Write your note here"
                  className="editorial-input editorial-textarea"
                />
              </div>
              <DrawerFooter>
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingNoteCard(null)}
                    className="trip-glass-button px-4 py-3 text-sm"
                  >
                    Cancel
                  </button>
                  <button type="button" onClick={() => void handleSaveNote()} className="trip-glass-button px-5 py-3 text-sm">
                    Save note
                  </button>
                </div>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </main>
      </div>
    </div>
  );
}
