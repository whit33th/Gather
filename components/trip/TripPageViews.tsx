"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import {
  CalendarDays,
  CheckSquare,
  CloudSun,
  FileText,
  Image as ImageIcon,
  MapPin,
  Pencil,
  Plus,
  Search,
  UsersRound,
  Wallet,
  X,
} from "lucide-react";
import TripChatTab from "./TripChatTab";
import TripBoard from "./TripBoard";
import {
  ArrivalSummaryCard,
  BudgetSummaryCard,
  HeroSummaryCard,
  PackingSummaryCard,
  SpotsSummaryCard,
  StaySummaryCard,
  TravelersSummaryCard,
  TripNotesSummaryCard,
} from "./TripDashboardCards";
import {
  AvailabilityStudio,
  BudgetStudio,
  GalleryStudio,
  MapStudio,
  ProposalStudio,
  TasksStudio,
} from "./TripOverview";
import WeatherCard from "./WeatherCard";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "../ui/drawer";
import UserAvatar from "../UserAvatar";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { cn } from "../../lib/utils";

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

type DashboardCardKind = DashboardCardRecord["kind"];

type TripMarker = {
  id: string;
  name: string;
  locationName?: string;
  lat: number;
  lng: number;
  category: "general" | "accommodation" | "food" | "activity" | "favorite";
  selected?: boolean;
};

type BoardRenderContext = {
  currentViewerRole?: "owner" | "member";
  expenses: ExpenseCard[] | undefined;
  gallery: string[];
  heroImage: string;
  markers: TripMarker[];
  onOpenNoteEditor: (card: DashboardCardRecord) => void;
  onOpenView: (view: "search" | "people") => void;
  photos: PhotoCard[] | undefined;
  scheduleItems: Doc<"tripScheduleItems">[] | undefined;
  sortedProposals: ProposalCard[] | undefined;
  tasks: TaskCard[] | undefined;
  totalBudget: number;
  totalTravelers: number;
  travelers: AvailabilityMember[] | undefined;
  trip: Doc<"trips">;
  tripDates: Date[];
  tripId: Id<"trips">;
};

type DashboardCardDefinition = {
  addable?: boolean;
  defaultContent?: (cards: DashboardCardRecord[]) => string | undefined;
  defaultTitle?: (cards: DashboardCardRecord[]) => string | undefined;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  render: (card: DashboardCardRecord, context: BoardRenderContext) => React.ReactNode;
  singleton?: boolean;
  span: string;
  title: string;
};

const fallbackGallery = [
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?auto=format&fit=crop&w=1200&q=80",
];

function surface(extra = "") {
  return `rounded-[30px] border border-[#23362d] bg-[linear-gradient(180deg,#10211b,#0b1713)] text-[#f7f4ea] shadow-[0_24px_60px_rgba(0,0,0,0.22)] ${extra}`;
}

function dedupeUrls(urls: Array<string | undefined>) {
  return [...new Set(urls.filter((url): url is string => Boolean(url)))];
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

const dashboardCardDefinitions: Record<DashboardCardKind, DashboardCardDefinition> = {
  hero: {
    singleton: true,
    span: "lg:col-span-4 lg:row-span-4",
    title: "Hero",
    render: (_card, context) => (
      <HeroSummaryCard
        trip={context.trip}
        heroImage={context.heroImage}
        travelerCount={context.totalTravelers}
      />
    ),
  },
  arrival: {
    singleton: true,
    span: "lg:col-span-4 lg:row-span-2",
    title: "Arrival",
    render: (_card, context) => (
      <ArrivalSummaryCard
        tripId={context.tripId}
        arrivalDate={format(parseISO(context.trip.startDate), "d MMM yyyy")}
        items={context.scheduleItems}
      />
    ),
  },
  stay: {
    singleton: true,
    span: "lg:col-span-4 lg:row-span-3",
    title: "Stay",
    render: (_card, context) => (
      <StaySummaryCard
        proposal={context.sortedProposals?.[0]}
        image={context.gallery[1] || context.heroImage}
        onOpenSearch={() => context.onOpenView("search")}
      />
    ),
  },
  weather: {
    addable: true,
    description: "Live forecast tied to the trip destination.",
    icon: CloudSun,
    singleton: true,
    span: "lg:col-span-4 lg:row-span-2",
    title: "Weather",
    render: (_card, context) => (
      <WeatherCard
        lat={context.trip.lat}
        lng={context.trip.lng}
        location={context.trip.locationName || context.trip.destination}
      />
    ),
  },
  map: {
    addable: true,
    description: "Live map with destination and proposal markers.",
    icon: MapPin,
    singleton: true,
    span: "lg:col-span-12",
    title: "Map",
    render: (_card, context) => (
      <MapStudio
        trip={context.trip}
        markers={context.markers}
        proposalCount={context.sortedProposals?.length || 0}
      />
    ),
  },
  travelers: {
    singleton: true,
    span: "lg:col-span-4 lg:row-span-2",
    title: "Travelers",
    render: (_card, context) => (
      <TravelersSummaryCard
        travelers={context.travelers}
        onOpenPeople={() => context.onOpenView("people")}
      />
    ),
  },
  tripNotes: {
    singleton: true,
    span: "lg:col-span-4 lg:row-span-2",
    title: "Trip Notes",
    render: (card) => <TripNotesSummaryCard card={card} />,
  },
  budgetSummary: {
    singleton: true,
    span: "lg:col-span-4 lg:row-span-3",
    title: "Budget Summary",
    render: (_card, context) => (
      <BudgetSummaryCard
        tripId={context.tripId}
        expenses={context.expenses}
        totalBudget={context.totalBudget}
      />
    ),
  },
  spots: {
    singleton: true,
    span: "lg:col-span-4 lg:row-span-3",
    title: "Spots",
    render: (_card, context) => (
      <SpotsSummaryCard
        proposals={context.sortedProposals || []}
        destination={context.trip.destination}
        images={context.gallery.slice(1)}
        onOpenSearch={() => context.onOpenView("search")}
      />
    ),
  },
  packingSummary: {
    singleton: true,
    span: "lg:col-span-4 lg:row-span-3",
    title: "Packing Summary",
    render: (_card, context) => (
      <PackingSummaryCard tripId={context.tripId} tasks={context.tasks} />
    ),
  },
  budget: {
    addable: true,
    description: "Expanded expense editor and breakdown.",
    icon: Wallet,
    singleton: true,
    span: "lg:col-span-6",
    title: "Budget",
    render: (_card, context) => (
      <BudgetStudio
        tripId={context.tripId}
        expenses={context.expenses}
        totalBudget={context.totalBudget}
      />
    ),
  },
  packing: {
    addable: true,
    description: "Expanded checklist editor.",
    icon: CheckSquare,
    singleton: true,
    span: "lg:col-span-6",
    title: "Packing",
    render: (_card, context) => (
      <TasksStudio tripId={context.tripId} tasks={context.tasks} />
    ),
  },
  gallery: {
    addable: true,
    description: "Upload and remove trip photos.",
    icon: ImageIcon,
    singleton: true,
    span: "lg:col-span-6",
    title: "Gallery",
    render: (_card, context) => (
      <GalleryStudio tripId={context.tripId} photos={context.photos} />
    ),
  },
  proposals: {
    addable: true,
    description: "Add, edit, vote and pin the group picks.",
    icon: Search,
    singleton: true,
    span: "lg:col-span-12",
    title: "Proposals",
    render: (_card, context) => (
      <ProposalStudio
        trip={context.trip}
        tripId={context.tripId}
        proposals={context.sortedProposals}
        canManageSelections={context.currentViewerRole === "owner"}
      />
    ),
  },
  availability: {
    addable: true,
    description: "Yes / no / maybe calendar for every traveler.",
    icon: CalendarDays,
    singleton: true,
    span: "lg:col-span-12",
    title: "Availability",
    render: (_card, context) => (
      <AvailabilityStudio
        tripId={context.tripId}
        dates={context.tripDates}
        members={context.travelers}
      />
    ),
  },
  chat: {
    addable: true,
    description: "Keep the trip conversation on the board.",
    icon: UsersRound,
    singleton: true,
    span: "lg:col-span-12",
    title: "Chat",
    render: (_card, context) => <TripChatTab tripId={context.tripId} />,
  },
  note: {
    addable: true,
    defaultContent: () =>
      "Add transport details, booking references, meeting points, or local reminders here.",
    defaultTitle: (cards) =>
      `Note ${(cards.filter((card) => card.kind === "note").length || 0) + 1}`,
    description: "Custom planning note card.",
    icon: FileText,
    singleton: false,
    span: "lg:col-span-6",
    title: "Note",
    render: (card, context) => (
      <section className={surface("p-5")}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-[#9fb0a3]">
              {card.title || "Note"}
            </p>
            <p className="mt-4 max-w-2xl whitespace-pre-wrap text-[1.05rem] leading-8 text-[#a8b8ad]">
              {card.content ||
                "Empty note. Open edit to add transport details, bookings or reminders."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => context.onOpenNoteEditor(card)}
            className="trip-glass-icon-button"
            aria-label="Edit note card"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
      </section>
    ),
  },
};

const addableCardKinds = (
  Object.entries(dashboardCardDefinitions) as Array<
    [DashboardCardKind, DashboardCardDefinition]
  >
).filter(([, definition]) => definition.addable);

export function TripBoardView({
  currentViewerRole,
  isAddCardOpen,
  normalizedSearchQuery,
  onAddCardOpenChange,
  onOpenView,
  sortedProposals,
  travelers,
  trip,
  tripId,
}: {
  currentViewerRole?: "owner" | "member";
  isAddCardOpen: boolean;
  normalizedSearchQuery: string;
  onAddCardOpenChange: (open: boolean) => void;
  onOpenView: (view: "board" | "search" | "people" | "calendar" | "list") => void;
  sortedProposals: ProposalCard[] | undefined;
  travelers: AvailabilityMember[] | undefined;
  trip: Doc<"trips">;
  tripId: Id<"trips">;
}) {
  const photos = useQuery(api.photos.list, { tripId }) as PhotoCard[] | undefined;
  const expenses = useQuery(api.expenses.list, { tripId }) as ExpenseCard[] | undefined;
  const tasks = useQuery(api.tasks.list, { tripId }) as TaskCard[] | undefined;
  const dashboardCards = useQuery(api.dashboardCards.list, { tripId }) as
    | DashboardCardRecord[]
    | undefined;
  const scheduleItems = useQuery(api.tripScheduleItems.list, { tripId }) as
    | Doc<"tripScheduleItems">[]
    | undefined;

  const ensureDefaultCards = useMutation(api.dashboardCards.ensureDefaults);
  const addDashboardCard = useMutation(api.dashboardCards.add);
  const updateDashboardCard = useMutation(api.dashboardCards.update);
  const removeDashboardCard = useMutation(api.dashboardCards.remove);
  const reorderDashboardCards = useMutation(api.dashboardCards.reorder);

  const [editingNoteCard, setEditingNoteCard] = useState<DashboardCardRecord | null>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");

  useEffect(() => {
    if (dashboardCards !== undefined && dashboardCards.length === 0) {
      void ensureDefaultCards({ tripId });
    }
  }, [dashboardCards, ensureDefaultCards, tripId]);

  const tripDates = useMemo(
    () => buildTripDates(trip.startDate, trip.endDate),
    [trip.endDate, trip.startDate]
  );

  const gallery = useMemo(
    () =>
      dedupeUrls([
        trip.coverUrl,
        ...(photos || []).map((photo) => photo.url),
        ...((sortedProposals || []).map((proposal) => proposal.imageUrl)),
        ...fallbackGallery,
      ]),
    [photos, sortedProposals, trip.coverUrl]
  );

  const heroImage = gallery[0] || fallbackGallery[0];
  const totalTravelers = travelers?.length || 0;
  const totalBudget = expenses?.reduce((sum, item) => sum + item.amount, 0) || 0;
  const markers = useMemo(
    () => buildMarkers(trip, sortedProposals),
    [sortedProposals, trip]
  );

  const boardContext = useMemo<BoardRenderContext>(
    () => ({
      currentViewerRole,
      expenses,
      gallery,
      heroImage,
      markers,
      onOpenNoteEditor: (card) => {
        setEditingNoteCard(card);
        setNoteTitle(card.title || "");
        setNoteContent(card.content || "");
      },
      onOpenView,
      photos,
      scheduleItems,
      sortedProposals,
      tasks,
      totalBudget,
      totalTravelers,
      travelers,
      trip,
      tripDates,
      tripId,
    }),
    [
      currentViewerRole,
      expenses,
      gallery,
      heroImage,
      markers,
      onOpenView,
      photos,
      scheduleItems,
      sortedProposals,
      tasks,
      totalBudget,
      totalTravelers,
      travelers,
      trip,
      tripDates,
      tripId,
    ]
  );

  const visibleCards = useMemo(
    () =>
      normalizedSearchQuery
        ? dashboardCards?.filter((card) =>
            matchesSearch(
              normalizedSearchQuery,
              card.title,
              card.content,
              card.kind.replace(/([A-Z])/g, " $1")
            )
          )
        : dashboardCards,
    [dashboardCards, normalizedSearchQuery]
  );

  const handleAddCard = async (kind: DashboardCardKind) => {
    const definition = dashboardCardDefinitions[kind];

    await addDashboardCard({
      tripId,
      kind,
      title: definition.defaultTitle?.(dashboardCards || []) || definition.title,
      content: definition.defaultContent?.(dashboardCards || []),
    });

    onAddCardOpenChange(false);
    onOpenView("board");
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

  return (
    <>
      {visibleCards === undefined ? (
        <TripBoard
          cards={dashboardCards}
          getSpan={(kind) => dashboardCardDefinitions[kind].span}
          renderCard={(card) => dashboardCardDefinitions[card.kind].render(card, boardContext)}
          onRemove={handleRemoveCard}
          onReorder={handleReorderCards}
        />
      ) : visibleCards.length > 0 ? (
        <TripBoard
          cards={visibleCards}
          getSpan={(kind) => dashboardCardDefinitions[kind].span}
          renderCard={(card) => dashboardCardDefinitions[card.kind].render(card, boardContext)}
          onRemove={handleRemoveCard}
          onReorder={handleReorderCards}
        />
      ) : (
        <section className={surface("p-8 text-center")}>
          <p className="text-sm uppercase tracking-[0.18em] text-[#9fb0a3]">No matches</p>
          <p className="mt-3 text-lg text-[#a8b8ad]">
            No dashboard cards match this search.
          </p>
        </section>
      )}

      {isAddCardOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#07110e]/72 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-notes-title"
          onClick={() => onAddCardOpenChange(false)}
        >
          <div
            className="w-full max-w-4xl rounded-[32px] border border-[#2a3e34] bg-[#10211b]/96 p-5 shadow-[0_32px_90px_rgba(0,0,0,0.34)] backdrop-blur-2xl sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-[#9fb0a3]">
                  Dashboard Library
                </p>
                <h2
                  id="add-notes-title"
                  className="mt-3 text-[1.9rem] font-semibold tracking-[-0.06em] text-white"
                >
                  Insert a dashboard component
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#a8b8ad]">
                  Choose a live component to add to the board. Singleton tiles can
                  only exist once.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onAddCardOpenChange(false)}
                className="trip-glass-icon-button"
                aria-label="Close add notes dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {addableCardKinds.map(([kind, definition]) => {
                const alreadyAdded =
                  definition.singleton &&
                  dashboardCards?.some((card) => card.kind === kind);
                const Icon = definition.icon;

                if (!Icon || !definition.description) return null;

                return (
                  <button
                    key={kind}
                    type="button"
                    disabled={alreadyAdded}
                    onClick={() => void handleAddCard(kind)}
                    className={cn(
                      "rounded-[24px] border p-4 text-left transition",
                      alreadyAdded
                        ? "border-[#23372e] bg-[#12231d] text-[#627168]"
                        : "border-[#2a3e34] bg-[#14251e] text-white hover:border-[#42584d] hover:bg-[#182c23]"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="trip-glass-icon-button h-11 w-11 shrink-0">
                        <Icon className="h-4 w-4" />
                      </span>
                      {alreadyAdded ? (
                        <span className="rounded-full border border-[#2b4035] bg-[#152720] px-2.5 py-1 text-[0.68rem] text-[#9fb0a3]">
                          Added
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-4 text-lg font-medium tracking-[-0.03em]">
                      {definition.title}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#a8b8ad]">
                      {definition.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      <Drawer
        open={Boolean(editingNoteCard)}
        onOpenChange={(open) => !open && setEditingNoteCard(null)}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Edit Note</DrawerTitle>
            <DrawerDescription>
              Update the card title and the planning details inside it.
            </DrawerDescription>
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
              <button
                type="button"
                onClick={() => void handleSaveNote()}
                className="trip-glass-button px-5 py-3 text-sm"
              >
                Save note
              </button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
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
  tripId,
}: {
  travelers: AvailabilityMember[] | undefined;
  tripId: Id<"trips">;
}) {
  return (
    <div className="grid min-w-0 gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
      <section className={surface("p-5")}>
        <p className="text-sm uppercase tracking-[0.18em] text-white/42">People</p>
        <div className="mt-4 space-y-3">
          {(travelers || []).map((traveler) => (
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
