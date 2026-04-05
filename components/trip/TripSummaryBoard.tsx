"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { TripSearchView } from "./TripPageViews";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "../ui/drawer";
import {
  BudgetOverviewCard,
  HeroSummaryCard,
  MapSummaryCard,
  PackingSummaryCard,
  PeopleSummaryCard,
  ProposalsSummaryCard,
  ReadinessSummaryCard,
  SpotsSummaryCard,
  StaySummaryCard,
  TripNotesSummaryCard,
} from "./TripDashboardCards";
import WeatherCard from "./WeatherCard";

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

type PhotoCard = {
  _id: string;
  url: string;
};

type ExpenseCard = {
  _id: string;
  title: string;
  amount: number;
  payerName: string;
};

type TaskCard = {
  _id: Id<"packingItems">;
  tripId: Id<"trips">;
  name: string;
  category: string;
  isChecked: boolean;
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
type DashboardView = "board" | "people" | "calendar" | "list";
type NoteEditorState =
  | { mode: "create-note" }
  | { mode: "edit-trip-notes"; card: DashboardCardRecord | null }
  | { mode: "edit-note"; card: DashboardCardRecord };

type TripMarker = {
  id: string;
  name: string;
  locationName?: string;
  lat: number;
  lng: number;
  category: "general" | "accommodation" | "food" | "activity" | "favorite";
  selected?: boolean;
};

const fallbackGallery = [
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?auto=format&fit=crop&w=1200&q=80",
];

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

function buildMarkers(trip: Doc<"trips">, proposals: ProposalCard[] | undefined): TripMarker[] {
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

export default function TripSummaryBoard({
  currentViewerRole,
  initialDashboardCards,
  initialExpenses,
  initialPhotos,
  initialScheduleItems,
  initialTasks,
  noteComposerOpen,
  onNoteComposerOpenChange,
  onOpenSearch,
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
  onOpenSearch: () => void;
  onOpenView: (view: DashboardView) => void;
  sortedProposals: ProposalCard[] | undefined;
  travelers: AvailabilityMember[] | undefined;
  trip: Doc<"trips">;
  tripId: Id<"trips">;
}) {
  const livePhotos = useQuery(api.photos.list, { tripId }) as PhotoCard[] | undefined;
  const liveExpenses = useQuery(api.expenses.list, { tripId }) as ExpenseCard[] | undefined;
  const liveTasks = useQuery(api.tasks.list, { tripId }) as TaskCard[] | undefined;
  const liveDashboardCards = useQuery(api.dashboardCards.list, { tripId }) as
    | DashboardCardRecord[]
    | undefined;
  const liveScheduleItems = useQuery(api.tripScheduleItems.list, { tripId }) as
    | ScheduleItem[]
    | undefined;
  const photos = livePhotos ?? initialPhotos;
  const expenses = liveExpenses ?? initialExpenses;
  const tasks = liveTasks ?? initialTasks;
  const dashboardCards = liveDashboardCards ?? initialDashboardCards;
  const scheduleItems = liveScheduleItems ?? initialScheduleItems;

  const ensureDefaultCards = useMutation(api.dashboardCards.ensureDefaults);
  const addDashboardCard = useMutation(api.dashboardCards.add);
  const updateDashboardCard = useMutation(api.dashboardCards.update);

  const [noteEditor, setNoteEditor] = useState<NoteEditorState | null>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");

  useEffect(() => {
    if (dashboardCards.length === 0) {
      void ensureDefaultCards({ tripId });
    }
  }, [dashboardCards, ensureDefaultCards, tripId]);

  const customNotes = useMemo(
    () => dashboardCards.filter((card) => card.kind === "note"),
    [dashboardCards]
  );
  const tripNotesCard = useMemo(
    () => dashboardCards.find((card) => card.kind === "tripNotes") || null,
    [dashboardCards]
  );

  const gallery = useMemo(
    () =>
      dedupeUrls([
        trip.coverUrl,
        ...photos.map((photo) => photo.url),
        ...((sortedProposals || []).map((proposal) => proposal.imageUrl)),
        ...fallbackGallery,
      ]),
    [photos, sortedProposals, trip.coverUrl]
  );

  const markers = useMemo(() => buildMarkers(trip, sortedProposals), [trip, sortedProposals]);

  const heroImage = gallery[0] || fallbackGallery[0];
  const totalBudget = expenses.reduce((sum, item) => sum + item.amount, 0);
  const budgetTarget = useMemo(() => {
    if (totalBudget > 0) {
      return Math.max(Math.ceil((totalBudget / 0.7) / 50) * 50, totalBudget);
    }

    return 1800;
  }, [totalBudget]);
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.isChecked).length;
  const tripDates = useMemo(
    () => buildTripDates(trip.startDate, trip.endDate),
    [trip.endDate, trip.startDate]
  );
  const daysLeft = Math.max(differenceInCalendarDays(parseISO(trip.startDate), new Date()), 0);

  const availabilityCompletion = useMemo(() => {
    if (!travelers || travelers.length === 0 || tripDates.length === 0) return 0;

    const totalSlots = travelers.length * tripDates.length;
    const filledSlots = travelers.reduce(
      (sum, traveler) => sum + traveler.availabilities.length,
      0
    );

    return Math.min(filledSlots / totalSlots, 1);
  }, [travelers, tripDates]);

  const readinessScore = useMemo(() => {
    const checklistRatio = totalTasks === 0 ? 0 : completedTasks / totalTasks;
    const planningRatio = scheduleItems.length ? Math.min(scheduleItems.length / 3, 1) : 0;
    const stayRatio = sortedProposals?.[0] ? 1 : 0;
    const peopleRatio = availabilityCompletion;

    return Math.round(
      checklistRatio * 40 + planningRatio * 25 + stayRatio * 20 + peopleRatio * 15
    );
  }, [
    availabilityCompletion,
    completedTasks,
    scheduleItems,
    sortedProposals,
    totalTasks,
  ]);

  useEffect(() => {
    if (!noteComposerOpen) return;

    setNoteEditor({ mode: "create-note" });
    setNoteTitle(`Note ${customNotes.length + 1}`);
    setNoteContent("");
    onNoteComposerOpenChange(false);
  }, [customNotes.length, noteComposerOpen, onNoteComposerOpenChange]);

  const openTripNotesEditor = () => {
    setNoteEditor({ mode: "edit-trip-notes", card: tripNotesCard });
    setNoteTitle(tripNotesCard?.title || "Trip Notes");
    setNoteContent(tripNotesCard?.content || "");
  };

  const closeNoteEditor = () => {
    setNoteEditor(null);
    setNoteTitle("");
    setNoteContent("");
  };

  const handleSaveNote = async () => {
    if (!noteEditor) return;

    const trimmedTitle =
      noteTitle.trim() ||
      (noteEditor.mode === "edit-trip-notes" ? "Trip Notes" : `Note ${customNotes.length + 1}`);
    const trimmedContent = noteContent.trim();

    if (noteEditor.mode === "create-note") {
      await addDashboardCard({
        tripId,
        kind: "note",
        title: trimmedTitle,
        content: trimmedContent,
      });
      closeNoteEditor();
      return;
    }

    if (noteEditor.mode === "edit-trip-notes" && !noteEditor.card) {
      await addDashboardCard({
        tripId,
        kind: "tripNotes",
        title: trimmedTitle,
        content: trimmedContent,
      });
      closeNoteEditor();
      return;
    }

    const cardId =
      noteEditor.mode === "edit-trip-notes"
        ? noteEditor.card?._id
        : noteEditor.card._id;

    if (!cardId) return;

    await updateDashboardCard({
      cardId,
      title: trimmedTitle,
      content: trimmedContent,
    });

    closeNoteEditor();
  };

  return (
    <>
      {/* 
        Unified Dashboard Grid
        - Uses CSS Grid with consistent column spans
        - Cards use h-full to fill their grid cell
      */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6">
        {/* Hero - spans most of the row */}
        <div className="md:col-span-2 xl:col-span-2 2xl:col-span-2">
          <HeroSummaryCard
            trip={trip}
            heroImage={heroImage}
            travelerCount={travelers?.length || 0}
          />
        </div>

        {/* Readiness - compact on all screens */}
        <div className="md:col-span-1 xl:col-span-1 2xl:col-span-1">
          <ReadinessSummaryCard
            daysLeft={daysLeft}
            readinessScore={readinessScore}
            onOpenDetails={() => onOpenView("list")}
          />
        </div>

        {/* Map - compact summary card */}
        <div className="md:col-span-1 xl:col-span-1 2xl:col-span-1">
          <MapSummaryCard
            trip={trip}
            markers={markers}
            onOpenSearch={onOpenSearch}
          />
        </div>

        {/* Budget - wider on larger screens */}
        <div className="md:col-span-2 xl:col-span-2 2xl:col-span-2">
          <BudgetOverviewCard
            expenses={expenses}
            totalBudget={totalBudget}
            expenseCount={expenses.length}
            budgetTarget={budgetTarget}
            onOpenDetails={() => onOpenView("list")}
          />
        </div>

        {/* Stay - accommodation card */}
        <div className="md:col-span-2 xl:col-span-2 2xl:col-span-2">
          <StaySummaryCard
            proposal={sortedProposals?.[0]}
            image={gallery[1] || heroImage}
            onOpenSearch={onOpenSearch}
          />
        </div>

        {/* Weather */}
        <div className="md:col-span-2 xl:col-span-2 2xl:col-span-2">
          <WeatherCard
            lat={trip.lat}
            lng={trip.lng}
            location={trip.locationName || trip.destination}
          />
        </div>

        {/* People - new compact summary */}
        <div className="md:col-span-1 xl:col-span-2 2xl:col-span-2">
          <PeopleSummaryCard
            travelers={travelers}
            onOpenPeople={() => onOpenView("people")}
          />
        </div>

        {/* Proposals - new summary card */}
        <div className="md:col-span-1 xl:col-span-2 2xl:col-span-2">
          <ProposalsSummaryCard
            proposals={sortedProposals}
            trip={trip}
            onOpenSearch={onOpenSearch}
          />
        </div>

        {/* Trip Notes */}
        <div className="md:col-span-1 xl:col-span-2 2xl:col-span-2">
          <TripNotesSummaryCard
            card={tripNotesCard}
            extraNotesCount={customNotes.length}
            onEdit={openTripNotesEditor}
          />
        </div>

        {/* Packing */}
        <div className="md:col-span-1 xl:col-span-2 2xl:col-span-2">
          <PackingSummaryCard tasks={tasks} onOpenDetails={() => onOpenView("list")} />
        </div>

        {/* Spots - larger showcase */}
        <div className="md:col-span-2 xl:col-span-4 2xl:col-span-4">
          <SpotsSummaryCard
            proposals={sortedProposals || []}
            destination={trip.destination}
            images={gallery.slice(1)}
            onOpenSearch={onOpenSearch}
          />
        </div>
      </div>

      <div className="mt-4">
        <TripSearchView
          currentViewerRole={currentViewerRole}
          proposals={sortedProposals}
          trip={trip}
          tripId={tripId}
        />
      </div>

      {/* Note Editor Drawer */}
      <Drawer
        open={Boolean(noteEditor)}
        onOpenChange={(open) => {
          if (!open) {
            closeNoteEditor();
          }
        }}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {noteEditor?.mode === "edit-trip-notes"
                ? "Edit trip notes"
                : noteEditor?.mode === "edit-note"
                  ? "Edit note"
                  : "Add note"}
            </DrawerTitle>
            <DrawerDescription>
              Main trip page stays summary-first. Use this drawer to update the note
              without turning the board into an editor.
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
              rows={9}
              value={noteContent}
              onChange={(event) => setNoteContent(event.target.value)}
              placeholder="Write the summary note here"
              className="editorial-input editorial-textarea"
            />
          </div>
          <DrawerFooter>
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={closeNoteEditor}
                className="trip-glass-button bg-[color:var(--control-bg)] px-4 py-3 text-sm hover:bg-[color:var(--control-bg-hover)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSaveNote()}
                className="trip-glass-button bg-[color:var(--control-bg)] px-5 py-3 text-sm hover:bg-[color:var(--control-bg-hover)]"
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
