"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { CalendarDays, FileText, Plus, Trash2 } from "lucide-react";
import {
  ArrivalSummaryCard,
  BudgetOverviewCard,
  ExpensesSummaryCard,
  HeroSummaryCard,
  PackingSummaryCard,
  ReadinessSummaryCard,
  SpotsSummaryCard,
  StaySummaryCard,
  TravelersSummaryCard,
  TripNotesSummaryCard,
} from "./TripDashboardCards";
import WeatherCard from "./WeatherCard";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "../ui/drawer";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";

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
type DashboardView = "board" | "search" | "people" | "calendar" | "list";
type ScheduleTone = "purple" | "green" | "neutral";
type NoteEditorState =
  | { mode: "create-note" }
  | { mode: "edit-trip-notes"; card: DashboardCardRecord | null }
  | { mode: "edit-note"; card: DashboardCardRecord };

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

function getScheduleToneClasses(tone: ScheduleTone) {
  if (tone === "purple") {
    return "border-[#4f3b68] bg-[#211a2a] text-[#f2e7ff]";
  }

  if (tone === "green") {
    return "border-[#47614a] bg-[#15261d] text-[#d4e8cf]";
  }

  return "border-[#2b3c34] bg-[#13211c] text-[#f7f4ea]";
}

function surface(extra = "") {
  return `rounded-[30px] border border-[#23362d] bg-[linear-gradient(180deg,#10211b,#0b1713)] text-[#f7f4ea] shadow-[0_24px_60px_rgba(0,0,0,0.22)] ${extra}`;
}

export default function TripSummaryBoard({
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
  onOpenView: (view: DashboardView) => void;
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
    | ScheduleItem[]
    | undefined;

  const ensureDefaultCards = useMutation(api.dashboardCards.ensureDefaults);
  const addDashboardCard = useMutation(api.dashboardCards.add);
  const updateDashboardCard = useMutation(api.dashboardCards.update);
  const addScheduleItem = useMutation(api.tripScheduleItems.add);
  const updateScheduleItem = useMutation(api.tripScheduleItems.update);
  const removeScheduleItem = useMutation(api.tripScheduleItems.remove);

  const [noteEditor, setNoteEditor] = useState<NoteEditorState | null>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [arrivalEditorOpen, setArrivalEditorOpen] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<Id<"tripScheduleItems"> | null>(
    null
  );
  const [scheduleDraft, setScheduleDraft] = useState<{
    title: string;
    startsAt: string;
    endsAt: string;
    tone: ScheduleTone;
  }>({
    title: "",
    startsAt: "10:00",
    endsAt: "11:00",
    tone: "neutral",
  });

  useEffect(() => {
    if (dashboardCards !== undefined && dashboardCards.length === 0) {
      void ensureDefaultCards({ tripId });
    }
  }, [dashboardCards, ensureDefaultCards, tripId]);

  const customNotes = useMemo(
    () => (dashboardCards || []).filter((card) => card.kind === "note"),
    [dashboardCards]
  );
  const tripNotesCard = useMemo(
    () => (dashboardCards || []).find((card) => card.kind === "tripNotes") || null,
    [dashboardCards]
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
  const totalBudget = expenses?.reduce((sum, item) => sum + item.amount, 0) || 0;
  const budgetTarget = useMemo(() => {
    if (totalBudget > 0) {
      return Math.max(Math.ceil((totalBudget / 0.7) / 50) * 50, totalBudget);
    }

    return 1800;
  }, [totalBudget]);
  const totalTasks = tasks?.length || 0;
  const completedTasks = tasks?.filter((task) => task.isChecked).length || 0;
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
    const planningRatio = scheduleItems?.length
      ? Math.min(scheduleItems.length / 3, 1)
      : 0;
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

  const resetScheduleDraft = () => {
    setEditingScheduleId(null);
    setScheduleDraft({
      title: "",
      startsAt: "10:00",
      endsAt: "11:00",
      tone: "neutral",
    });
  };

  const handleSaveSchedule = async () => {
    if (!scheduleDraft.title.trim()) return;

    if (editingScheduleId) {
      await updateScheduleItem({
        itemId: editingScheduleId,
        title: scheduleDraft.title.trim(),
        startsAt: scheduleDraft.startsAt,
        endsAt: scheduleDraft.endsAt,
        tone: scheduleDraft.tone,
      });
    } else {
      await addScheduleItem({
        tripId,
        title: scheduleDraft.title.trim(),
        startsAt: scheduleDraft.startsAt,
        endsAt: scheduleDraft.endsAt,
        tone: scheduleDraft.tone,
      });
    }

    resetScheduleDraft();
  };

  const arrivalDateLabel = format(parseISO(trip.startDate), "d MMM yyyy");

  return (
    <>
      <div className="grid min-w-0 gap-4 md:grid-cols-6 xl:grid-cols-12">
        <div className="md:col-span-6 xl:col-span-7">
          <HeroSummaryCard
            trip={trip}
            heroImage={heroImage}
            travelerCount={travelers?.length || 0}
          />
        </div>

        <div className="md:col-span-6 xl:col-span-5">
          <ReadinessSummaryCard
            daysLeft={daysLeft}
            readinessScore={readinessScore}
            checklistLabel={`${completedTasks}/${totalTasks || 0}`}
            scheduleLabel={`${scheduleItems?.length || 0} blocks`}
            peopleLabel={`${travelers?.length || 0} synced`}
            onOpenDetails={() => onOpenView("list")}
          />
        </div>

        <div className="md:col-span-3 xl:col-span-4">
          <ArrivalSummaryCard
            arrivalDate={arrivalDateLabel}
            items={scheduleItems}
            onManage={() => setArrivalEditorOpen(true)}
          />
        </div>

        <div className="md:col-span-3 xl:col-span-3">
          <StaySummaryCard
            proposal={sortedProposals?.[0]}
            image={gallery[1] || heroImage}
            onOpenSearch={() => onOpenView("search")}
          />
        </div>

        <div className="md:col-span-6 xl:col-span-5">
          <WeatherCard
            lat={trip.lat}
            lng={trip.lng}
            location={trip.locationName || trip.destination}
          />
        </div>

        <div className="md:col-span-6 xl:col-span-5">
          <SpotsSummaryCard
            proposals={sortedProposals || []}
            destination={trip.destination}
            images={gallery.slice(1)}
            onOpenSearch={() => onOpenView("search")}
          />
        </div>

        <div className="md:col-span-3 xl:col-span-4">
          <TripNotesSummaryCard
            card={tripNotesCard}
            extraNotesCount={customNotes.length}
            onEdit={openTripNotesEditor}
          />
        </div>

        <div className="md:col-span-3 xl:col-span-3">
          <TravelersSummaryCard
            travelers={travelers}
            onOpenPeople={() => onOpenView("people")}
          />
        </div>

        <div className="md:col-span-3 xl:col-span-3">
          <BudgetOverviewCard
            totalBudget={totalBudget}
            expenseCount={expenses?.length || 0}
            budgetTarget={budgetTarget}
            onOpenDetails={() => onOpenView("list")}
          />
        </div>

        <div className="md:col-span-3 xl:col-span-4">
          <ExpensesSummaryCard
            expenses={expenses}
            onOpenDetails={() => onOpenView("list")}
          />
        </div>

        <div className="md:col-span-6 xl:col-span-5">
          <PackingSummaryCard tasks={tasks} onOpenDetails={() => onOpenView("list")} />
        </div>
      </div>

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

      <Drawer
        open={arrivalEditorOpen}
        onOpenChange={(open) => {
          setArrivalEditorOpen(open);
          if (!open) {
            resetScheduleDraft();
          }
        }}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Arrival planner</DrawerTitle>
            <DrawerDescription>
              Keep arrival editing off the main board. Add, update, and remove timeline
              blocks here.
            </DrawerDescription>
          </DrawerHeader>

          <div className="grid gap-5 px-5 pb-4 sm:px-6">
            <div className={surface("p-4")}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] text-[#9fb0a3]">
                    Arrival day
                  </p>
                  <p className="mt-2 text-xl font-semibold tracking-[-0.04em]">
                    {arrivalDateLabel}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetScheduleDraft}
                  className="trip-glass-button px-4 py-3 text-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>New block</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {(scheduleItems || []).length > 0 ? (
                scheduleItems?.map((item) => (
                  <article
                    key={item._id}
                    className={`rounded-[24px] border px-4 py-4 ${getScheduleToneClasses(
                      (item.tone as ScheduleTone | undefined) || "neutral"
                    )}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-medium">{item.title}</p>
                        <p className="mt-2 text-sm opacity-80">
                          {item.startsAt} - {item.endsAt}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingScheduleId(item._id);
                            setScheduleDraft({
                              title: item.title,
                              startsAt: item.startsAt,
                              endsAt: item.endsAt,
                              tone: (item.tone as ScheduleTone | undefined) || "neutral",
                            });
                          }}
                          className="trip-glass-icon-button h-10 w-10"
                          aria-label="Edit arrival block"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void removeScheduleItem({ itemId: item._id })}
                          className="trip-glass-icon-button h-10 w-10 text-[#f3b4a3] hover:text-[#ffd2c8]"
                          aria-label="Delete arrival block"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className={surface("border-dashed p-5")}>
                  <p className="text-sm font-medium">No arrival blocks yet</p>
                  <p className="mt-2 text-sm leading-6 text-[#9fb0a3]">
                    Add check-in, transfer, pickup, or first-stop timing here.
                  </p>
                </div>
              )}
            </div>

            <div className={surface("p-5")}>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-[#9fb0a3]" />
                <p className="text-sm uppercase tracking-[0.18em] text-[#9fb0a3]">
                  {editingScheduleId ? "Edit block" : "Add block"}
                </p>
              </div>

              <div className="mt-4 grid gap-3">
                <input
                  value={scheduleDraft.title}
                  onChange={(event) =>
                    setScheduleDraft((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Check in at villa"
                  className="editorial-input"
                />

                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    value={scheduleDraft.startsAt}
                    onChange={(event) =>
                      setScheduleDraft((current) => ({
                        ...current,
                        startsAt: event.target.value,
                      }))
                    }
                    type="time"
                    className="editorial-input [color-scheme:dark]"
                  />
                  <input
                    value={scheduleDraft.endsAt}
                    onChange={(event) =>
                      setScheduleDraft((current) => ({
                        ...current,
                        endsAt: event.target.value,
                      }))
                    }
                    type="time"
                    className="editorial-input [color-scheme:dark]"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {(["purple", "green", "neutral"] as const).map((tone) => (
                    <button
                      key={tone}
                      type="button"
                      onClick={() =>
                        setScheduleDraft((current) => ({
                          ...current,
                          tone,
                        }))
                      }
                      className={`trip-glass-button px-4 py-2 capitalize ${
                        scheduleDraft.tone === tone
                          ? "border-[#dbe887]/40 bg-[#213229]"
                          : ""
                      }`}
                    >
                      {tone}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <DrawerFooter>
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={resetScheduleDraft}
                className="trip-glass-button px-4 py-3 text-sm"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => void handleSaveSchedule()}
                className="trip-glass-button px-5 py-3 text-sm"
              >
                Save block
              </button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
