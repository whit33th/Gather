"use client";

import { useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { format, parseISO } from "date-fns";
import Image from "next/image";
import {
  CalendarDays,
  Check,
  ChevronRight,
  Pencil,
  Plus,
  Trash2,
  UsersRound,
} from "lucide-react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import UserAvatar from "../UserAvatar";

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
  tripId: Id<"trips">;
  name: string;
  category: string;
  isChecked: boolean;
};

type ProposalCard = {
  _id: string;
  name: string;
  locationName?: string;
  imageUrl?: string;
  votes: number;
  category?: "accommodation" | "food" | "activity" | "favorite";
};

type AvailabilityMember = {
  userId: string;
  memberId: string;
  name: string;
  image?: string;
  role: "owner" | "member";
  isCurrentUser: boolean;
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

function surface(extra = "") {
  return `rounded-[30px] border border-[#23362d] bg-[linear-gradient(180deg,#10211b,#0b1713)] text-[#f7f4ea] shadow-[0_24px_60px_rgba(0,0,0,0.22)] ${extra}`;
}

function EmptyAddState({
  label,
  description,
  onClick,
}: {
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-4 flex min-h-[8rem] w-full flex-col items-center justify-center rounded-[24px] border border-dashed border-[#31463c] bg-[#12241d] px-4 text-center transition hover:border-[#42584d] hover:bg-[#162a22]"
    >
      <span className="trip-glass-icon-button">
        <Plus className="h-4 w-4" />
      </span>
      <span className="mt-3 text-sm font-medium">{label}</span>
      <span className="mt-1 max-w-xs text-sm text-[#9fb0a3]">{description}</span>
    </button>
  );
}

function CardAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="trip-glass-icon-button border-[#2b4035] bg-[#152720] text-[#f7f4ea]"
      aria-label={label}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

export function HeroSummaryCard({
  trip,
  heroImage,
  travelerCount,
}: {
  trip: Doc<"trips">;
  heroImage: string;
  travelerCount: number;
}) {
  const duration = useMemo(() => {
    const start = parseISO(trip.startDate);
    const end = parseISO(trip.endDate);
    const nights = Math.max(Math.round((end.getTime() - start.getTime()) / 86400000), 1);
    return `${nights + 1}D / ${nights}N`;
  }, [trip.endDate, trip.startDate]);

  return (
    <section className={surface("overflow-hidden p-3")}>
      <div
        className="relative h-[19rem] overflow-hidden rounded-[24px] bg-cover bg-center sm:h-[21rem]"
        style={{ backgroundImage: `url("${heroImage}")` }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(0,0,0,0.18)_50%,rgba(0,0,0,0.58)_100%)]" />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <p className="text-sm uppercase tracking-[0.18em] text-[#dbe6cf]">{trip.destination}</p>
          <h1 className="mt-2 text-[2.35rem] font-semibold tracking-[-0.07em]">{trip.title}</h1>
          <div className="mt-4 flex flex-wrap gap-2 text-sm text-white/82">
            {[duration, `${Math.max(travelerCount, 1)} travelers`, "Shared dashboard"].map((item) => (
              <span key={item} className="trip-glass-button px-3.5 py-2 text-[0.8rem]">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function StaySummaryCard({
  proposal,
  image,
  onOpenSearch,
}: {
  proposal?: ProposalCard;
  image: string;
  onOpenSearch: () => void;
}) {
  return (
    <section className={surface("p-3")}>
      <article className="grid h-full gap-4 md:grid-cols-[190px_minmax(0,1fr)]">
        <div
          className="min-h-[14rem] rounded-[22px] bg-cover bg-center"
          style={{ backgroundImage: `url("${image}")` }}
        />
        <div className="flex flex-col justify-between py-2 pr-2">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-[#9fb0a3]">Stay</p>
            <h2 className="mt-3 text-[1.85rem] font-semibold tracking-[-0.05em]">
              {proposal?.name || "Choose your stay"}
            </h2>
            <p className="mt-3 text-[1.02rem] leading-7 text-[#9fb0a3]">
              {proposal?.locationName || "Select the shared stay and keep the group aligned on one place."}
            </p>
          </div>

          <button type="button" onClick={onOpenSearch} className="trip-glass-button mt-5 w-fit px-5 py-3">
            <span>Open proposals</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </article>
    </section>
  );
}

export function TravelersSummaryCard({
  travelers,
  onOpenPeople,
}: {
  travelers: AvailabilityMember[] | undefined;
  onOpenPeople: () => void;
}) {
  const visibleTravelers = travelers?.slice(0, 4) || [];

  return (
    <section className={surface("p-5")}>
      <div className="flex h-full flex-col justify-between gap-6">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-[#9fb0a3]">People</p>
          <h2 className="mt-3 text-[1.85rem] font-semibold tracking-[-0.05em]">
            {travelers?.length || 0} travelers
          </h2>
        </div>

        <div className="space-y-3">
          {visibleTravelers.map((traveler) => (
            <div
              key={traveler.memberId}
              className="flex items-center gap-3 rounded-[22px] border border-[#22372e] bg-[#14251e] px-4 py-3"
            >
              <UserAvatar
                name={traveler.name}
                image={traveler.image}
                seed={traveler.userId}
                size={40}
              />
              <div className="min-w-0">
                <p className="truncate text-base font-medium">{traveler.name}</p>
                <p className="text-sm text-[#9fb0a3]">{traveler.isCurrentUser ? "You" : traveler.role}</p>
              </div>
            </div>
          ))}
        </div>

        <button type="button" onClick={onOpenPeople} className="trip-glass-button w-fit px-5 py-3">
          <UsersRound className="h-4 w-4" />
          <span>Open people</span>
        </button>
      </div>
    </section>
  );
}

export function TripNotesSummaryCard({
  card,
}: {
  card: DashboardCardRecord;
}) {
  const updateCard = useMutation(api.dashboardCards.update);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(card.title || "Trip Notes");
  const [content, setContent] = useState(card.content || "");

  const handleSave = async () => {
    await updateCard({
      cardId: card._id,
      title: title.trim() || "Trip Notes",
      content: content.trim(),
    });
    setIsEditing(false);
  };

  return (
    <section className={surface("p-6")}>
      <div className="flex h-full flex-col justify-between gap-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm uppercase tracking-[0.18em] text-[#9fb0a3]">Trip Notes</p>
            <h2 className="mt-3 truncate text-[1.85rem] font-semibold tracking-[-0.05em]">
              {title}
            </h2>
          </div>
          <CardAction icon={Pencil} label="Edit trip notes" onClick={() => setIsEditing((value) => !value)} />
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="editorial-input"
              placeholder="Trip Notes"
            />
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={6}
              className="editorial-input editorial-textarea"
              placeholder="Write the shared notes here"
            />
            <div className="flex gap-2">
              <button type="button" onClick={handleSave} className="trip-glass-button px-4 py-3">
                Save
              </button>
              <button type="button" onClick={() => setIsEditing(false)} className="trip-glass-button px-4 py-3">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="whitespace-pre-wrap text-[1.02rem] leading-8 text-[#a8b8ad]">
            {content || "Add the high-level itinerary, meeting point, and any shared reminders here."}
          </p>
        )}
      </div>
    </section>
  );
}

export function SpotsSummaryCard({
  proposals,
  destination,
  images,
  onOpenSearch,
}: {
  proposals: ProposalCard[];
  destination: string;
  images: string[];
  onOpenSearch: () => void;
}) {
  const featured = proposals.slice(0, 3);

  return (
    <section className={surface("overflow-hidden p-4")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-[#9fb0a3]">Spots</p>
          <h2 className="mt-3 text-[1.85rem] font-semibold tracking-[-0.05em]">Saved highlights</h2>
        </div>
        <button type="button" onClick={onOpenSearch} className="trip-glass-icon-button" aria-label="Add spot">
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {featured.length === 0 ? (
        <EmptyAddState
          label="Add first spot"
          description="Open proposals and start adding places the group likes."
          onClick={onOpenSearch}
        />
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-[0.9fr_1.1fr]">
          <div className="flex flex-col gap-3">
            {featured.slice(0, 2).map((spot, index) => (
              <article
                key={spot._id}
                className={`relative overflow-hidden rounded-[24px] bg-cover bg-center ${
                  index === 0 ? "min-h-[11rem]" : "min-h-[10rem]"
                }`}
                style={{ backgroundImage: `url("${spot.imageUrl || images[index] || images[0]}")` }}
              >
                <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.82))] p-4">
                  <p className="text-[1.55rem] font-medium tracking-[-0.04em]">{spot.name}</p>
                  <p className="mt-1 text-sm text-white/60">{spot.locationName || destination}</p>
                </div>
              </article>
            ))}
          </div>
          <article
            className="relative min-h-[21rem] overflow-hidden rounded-[26px] bg-cover bg-center"
            style={{ backgroundImage: `url("${featured[2]?.imageUrl || images[2] || images[0]}")` }}
          >
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08),rgba(0,0,0,0.44)_60%,rgba(0,0,0,0.86))]" />
            <div className="absolute bottom-5 left-5 right-5">
              <p className="text-[2rem] font-medium tracking-[-0.05em]">
                {featured[2]?.name || destination}
              </p>
              <p className="mt-2 text-white/62">
                {featured[2]?.locationName || "Selected stops and saved places stay grouped together here."}
              </p>
            </div>
          </article>
        </div>
      )}
    </section>
  );
}

export function ArrivalSummaryCard({
  tripId,
  arrivalDate,
  items,
}: {
  tripId: Id<"trips">;
  arrivalDate: string;
  items: ScheduleItem[] | undefined;
}) {
  const addItem = useMutation(api.tripScheduleItems.add);
  const updateItem = useMutation(api.tripScheduleItems.update);
  const removeItem = useMutation(api.tripScheduleItems.remove);
  const [draft, setDraft] = useState({
    title: "",
    startsAt: "10:00",
    endsAt: "11:00",
    tone: "purple" as "purple" | "green" | "neutral",
  });
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<Id<"tripScheduleItems"> | null>(null);

  const editingItem = items?.find((item) => item._id === editingId);

  const toneClasses = {
    purple: "border border-[#3e4a44] bg-[#18231f] text-[#f0eadc]",
    green: "border border-[#47614a] bg-[#15261d] text-[#d4e8cf]",
    neutral: "border border-[#2b3c34] bg-[#13211c] text-[#f7f4ea]",
  };

  const resetDraft = () => {
    setDraft({
      title: "",
      startsAt: "10:00",
      endsAt: "11:00",
      tone: "purple",
    });
    setEditingId(null);
    setIsAdding(false);
  };

  const handleSubmit = async () => {
    if (!draft.title.trim()) return;

    if (editingId) {
      await updateItem({
        itemId: editingId,
        title: draft.title.trim(),
        startsAt: draft.startsAt,
        endsAt: draft.endsAt,
        tone: draft.tone,
      });
    } else {
      await addItem({
        tripId,
        title: draft.title.trim(),
        startsAt: draft.startsAt,
        endsAt: draft.endsAt,
        tone: draft.tone,
      });
    }

    resetDraft();
  };

  return (
    <section className={surface("p-5")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg text-[#9fb0a3]">Arrival</p>
          <p className="mt-2 text-[2rem] font-semibold tracking-[-0.06em]">{arrivalDate}</p>
        </div>
        <CardAction
          icon={Plus}
          label="Add schedule item"
          onClick={() => {
            setIsAdding(true);
            setEditingId(null);
          }}
        />
      </div>

      {items && items.length > 0 ? (
        <div className="mt-6 space-y-3">
          {items.map((item) => (
            <article key={item._id} className={`rounded-[18px] px-4 py-3 ${toneClasses[item.tone || "neutral"]}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg">{item.title}</p>
                  <p className="mt-1 text-lg text-[#b9c5bb]">
                    {item.startsAt} - {item.endsAt}
                  </p>
                </div>
                <div className="flex gap-2">
                  <CardAction
                    icon={Pencil}
                    label="Edit schedule item"
                    onClick={() => {
                      setEditingId(item._id);
                      setDraft({
                        title: item.title,
                        startsAt: item.startsAt,
                        endsAt: item.endsAt,
                        tone: item.tone || "neutral",
                      });
                      setIsAdding(false);
                    }}
                  />
                  <CardAction
                    icon={Trash2}
                    label="Remove schedule item"
                    onClick={() => void removeItem({ itemId: item._id })}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyAddState
          label="Add arrival plan"
          description="Create check-in, transfer, and first-stop rows for the group."
          onClick={() => setIsAdding(true)}
        />
      )}

      {isAdding || editingItem ? (
        <div className="mt-4 grid gap-3 rounded-[24px] border border-[#23372e] bg-[#13231d] p-4">
          <input
            value={draft.title}
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
            placeholder="Check in at villa"
            className="editorial-input"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={draft.startsAt}
              onChange={(event) => setDraft((current) => ({ ...current, startsAt: event.target.value }))}
              type="time"
              className="editorial-input [color-scheme:dark]"
            />
            <input
              value={draft.endsAt}
              onChange={(event) => setDraft((current) => ({ ...current, endsAt: event.target.value }))}
              type="time"
              className="editorial-input [color-scheme:dark]"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(["purple", "green", "neutral"] as const).map((tone) => (
              <button
                key={tone}
                type="button"
                onClick={() => setDraft((current) => ({ ...current, tone }))}
                className={`trip-glass-button px-4 py-2 capitalize ${draft.tone === tone ? "border-[#dbe887]/40 bg-[#213229]" : ""}`}
              >
                {tone}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={handleSubmit} className="trip-glass-button px-4 py-3">
              Save
            </button>
            <button type="button" onClick={resetDraft} className="trip-glass-button px-4 py-3">
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function BudgetSummaryCard({
  tripId,
  expenses,
  totalBudget,
}: {
  tripId: Id<"trips">;
  expenses: ExpenseCard[] | undefined;
  totalBudget: number;
}) {
  const addExpense = useMutation(api.expenses.add);
  const updateExpense = useMutation(api.expenses.update);
  const removeExpense = useMutation(api.expenses.remove);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleSave = async () => {
    const parsedAmount = Number(amount);
    if (!title.trim() || Number.isNaN(parsedAmount)) return;

    if (editingId) {
      await updateExpense({
        expenseId: editingId as Id<"expenses">,
        title: title.trim(),
        amount: parsedAmount,
      });
    } else {
      await addExpense({ tripId, title: title.trim(), amount: parsedAmount });
    }

    setTitle("");
    setAmount("");
    setEditingId(null);
    setIsAdding(false);
  };

  return (
    <section className={surface("p-5")}>
      <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)]">
        <div className="rounded-[24px] border border-[#23372e] bg-[#13241d] px-5 py-6 text-center">
          <p className="text-[2.35rem] font-semibold tracking-[-0.06em]">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "EUR",
              maximumFractionDigits: 0,
            }).format(totalBudget)}
          </p>
          <p className="mt-2 text-[#9fb0a3]">Total</p>
          <button type="button" onClick={() => setIsAdding(true)} className="trip-glass-button mt-5 px-4 py-3">
            <Plus className="h-4 w-4" />
            <span>Add expense</span>
          </button>
        </div>

        <div className="space-y-3">
          {expenses && expenses.length > 0 ? (
            expenses.slice(0, 4).map((expense) => (
              <article
                key={expense._id}
                className="rounded-[22px] border border-[#23372e] bg-[#14251e] px-4 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-lg font-medium">{expense.title}</p>
                    <p className="mt-1 text-sm text-[#9fb0a3]">{expense.payerName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-medium">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "EUR",
                        maximumFractionDigits: 0,
                      }).format(expense.amount)}
                    </span>
                    <CardAction
                      icon={Pencil}
                      label="Edit expense"
                      onClick={() => {
                        setEditingId(expense._id);
                        setTitle(expense.title);
                        setAmount(String(expense.amount));
                        setIsAdding(true);
                      }}
                    />
                    <CardAction
                      icon={Trash2}
                      label="Remove expense"
                      onClick={() => void removeExpense({ expenseId: expense._id as Id<"expenses"> })}
                    />
                  </div>
                </div>
              </article>
            ))
          ) : (
            <EmptyAddState
              label="Add first expense"
              description="Track the first shared cost directly from the summary card."
              onClick={() => setIsAdding(true)}
            />
          )}
        </div>
      </div>

      {isAdding ? (
        <div className="mt-4 grid gap-3 rounded-[24px] border border-[#23372e] bg-[#13231d] p-4 md:grid-cols-[1fr_180px_auto_auto]">
          <input value={title} onChange={(event) => setTitle(event.target.value)} className="editorial-input" placeholder="Flights" />
          <input value={amount} onChange={(event) => setAmount(event.target.value)} className="editorial-input" placeholder="920" inputMode="decimal" />
          <button type="button" onClick={handleSave} className="trip-glass-button justify-center px-4 py-3">
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAdding(false);
              setEditingId(null);
              setTitle("");
              setAmount("");
            }}
            className="trip-glass-button justify-center px-4 py-3"
          >
            Cancel
          </button>
        </div>
      ) : null}
    </section>
  );
}

export function PackingSummaryCard({
  tripId,
  tasks,
}: {
  tripId: Id<"trips">;
  tasks: TaskCard[] | undefined;
}) {
  const addTask = useMutation(api.tasks.add);
  const updateTask = useMutation(api.tasks.update);
  const removeTask = useMutation(api.tasks.remove);
  const toggleTask = useMutation(api.tasks.toggle);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Packing");
  const [editingId, setEditingId] = useState<Id<"packingItems"> | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;

    if (editingId) {
      await updateTask({ taskId: editingId, name: name.trim(), category });
    } else {
      await addTask({ tripId, name: name.trim(), category });
    }

    setName("");
    setCategory("Packing");
    setEditingId(null);
    setIsAdding(false);
  };

  return (
    <section className={surface("p-6")}>
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-[#9fb0a3]">Packing</p>
          <h2 className="mt-3 text-[1.85rem] font-medium tracking-[-0.04em]">Mandatory essentials</h2>
        </div>
        <CardAction icon={Plus} label="Add packing item" onClick={() => setIsAdding(true)} />
      </header>

      {tasks && tasks.length > 0 ? (
        <ul className="mt-6 space-y-3">
          {tasks.slice(0, 5).map((task) => (
            <li key={task._id}>
              <article
                className={`flex items-start gap-4 rounded-[22px] border px-4 py-4 ${
                  task.isChecked
                    ? "border-[#31453b] bg-[#11211b]"
                    : "border-[#23372e] bg-[#14251e]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => void toggleTask({ taskId: task._id })}
                  className={`mt-1 flex h-5 w-5 items-center justify-center rounded-full border ${
                    task.isChecked
                      ? "border-[#dbe887] bg-[#dbe887] text-[#0f1b16]"
                      : "border-[#506257] bg-transparent text-transparent"
                  }`}
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`text-[1.12rem] font-medium tracking-[-0.03em] ${task.isChecked ? "text-[#6f7d74] line-through" : "text-white"}`}>
                    {task.name}
                  </p>
                  <p className={`mt-1 text-sm ${task.isChecked ? "text-[#5f6d65] line-through" : "text-[#9fb0a3]"}`}>
                    {task.category}
                  </p>
                </div>
                <div className="flex gap-2">
                  <CardAction
                    icon={Pencil}
                    label="Edit packing item"
                    onClick={() => {
                      setEditingId(task._id);
                      setName(task.name);
                      setCategory(task.category);
                      setIsAdding(true);
                    }}
                  />
                  <CardAction
                    icon={Trash2}
                    label="Remove packing item"
                    onClick={() => void removeTask({ taskId: task._id })}
                  />
                </div>
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyAddState
          label="Add first packing item"
          description="Start the list right from the summary card."
          onClick={() => setIsAdding(true)}
        />
      )}

      {isAdding ? (
        <div className="mt-4 grid gap-3 rounded-[24px] border border-[#23372e] bg-[#13231d] p-4">
          <input value={name} onChange={(event) => setName(event.target.value)} className="editorial-input" placeholder="Passport" />
          <input value={category} onChange={(event) => setCategory(event.target.value)} className="editorial-input" placeholder="Documents" />
          <div className="flex gap-2">
            <button type="button" onClick={handleSave} className="trip-glass-button px-4 py-3">Save</button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setEditingId(null);
                setName("");
                setCategory("Packing");
              }}
              className="trip-glass-button px-4 py-3"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
