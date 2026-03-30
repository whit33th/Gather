"use client";

import { useMemo } from "react";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import {
  CalendarDays,
  Check,
  ChevronRight,
  FileText,
  Flag,
  Heart,
  Hotel,
  Map,
  MapPin,
  MoreHorizontal,
  Plane,
  Plus,
  Sparkles,
  ThumbsUp,
  Ticket,
  Utensils,
  UtensilsCrossed,
  Users,
} from "lucide-react";
import Image from "next/image";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import UserAvatar from "../UserAvatar";

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

type TripMarker = {
  id: string;
  name: string;
  locationName?: string;
  lat: number;
  lng: number;
  category: "general" | "accommodation" | "food" | "activity" | "favorite";
  selected?: boolean;
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

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const budgetBuckets = [
  {
    id: "flights",
    label: "Flights",
    icon: Plane,
    keywords: ["flight", "plane", "air", "airport", "train", "rail", "bus", "transport"],
    barClass: "bg-[linear-gradient(90deg,#dbe887,#b7d56a)]",
  },
  {
    id: "stay",
    label: "Resort",
    icon: Hotel,
    keywords: [
      "hotel",
      "resort",
      "villa",
      "stay",
      "room",
      "hostel",
      "booking",
      "airbnb",
      "apartment",
      "accommodation",
    ],
    barClass: "bg-[linear-gradient(90deg,#8fd0c0,#5ab8a3)]",
  },
  {
    id: "food",
    label: "Food & Drinks",
    icon: UtensilsCrossed,
    keywords: [
      "food",
      "drink",
      "dinner",
      "lunch",
      "breakfast",
      "restaurant",
      "cafe",
      "bar",
      "coffee",
      "brunch",
    ],
    barClass: "bg-[linear-gradient(90deg,#c7b0ff,#9d84ec)]",
  },
  {
    id: "entertainment",
    label: "Entertainment",
    icon: Ticket,
    keywords: [],
    barClass: "bg-[linear-gradient(90deg,#f2c98b,#e0a765)]",
  },
] as const;

function getBudgetBucket(title: string) {
  const normalized = title.toLowerCase();
  return (
    budgetBuckets.find(
      (bucket) =>
        bucket.id !== "entertainment" &&
        bucket.keywords.some((keyword) => normalized.includes(keyword))
    )?.id || "entertainment"
  );
}

function surface(extra = "") {
  return `trip-theme-card trip-dashboard-surface h-full rounded-4xl ${extra}`;
}

function SummaryActionButton({
  label,
  onClick,
  variant = "more",
  contrast = "dark",
}: {
  label: string;
  onClick: () => void;
  variant?: "more" | "plus";
  contrast?: "dark" | "light";
}) {
  const Icon = variant === "plus" ? Plus : MoreHorizontal;

  return (
    <button
      type="button"
      onClick={onClick}
      className={
        contrast === "light"
          ? "summary-action-button summary-action-button-light trip-theme-chip flex h-10 w-10 items-center justify-center rounded-full bg-white/36 text-[#0f5d50] transition-[background-color,border-color,color] hover:bg-white/54 sm:h-11 sm:w-11"
          : "summary-action-button trip-theme-chip flex h-10 w-10 items-center justify-center rounded-full transition-[background-color,border-color,color] hover:text-white sm:h-11 sm:w-11"
      }
      aria-label={label}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function SummaryEyebrow({ children }: { children: string }) {
  return (
    <p className=" font-semibold text-[color:var(--trip-card-muted-text)]">
      {children}
    </p>
  );
}

function SummaryEmpty({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="trip-theme-subsurface-solid trip-dashboard-subsurface h-full rounded-[22px] border border-dashed px-4 py-4 sm:rounded-3xl sm:py-5">
      <p className="text-sm font-medium text-[#f7f4ea]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[color:var(--trip-card-muted-text)]">{description}</p>
    </div>
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
    const nights = Math.max(differenceInCalendarDays(end, start), 1);
    return `${nights + 1} Days Trip`;
  }, [trip.endDate, trip.startDate]);
  const tripWindow = useMemo(() => {
    const start = parseISO(trip.startDate);
    const end = parseISO(trip.endDate);
    return `${format(start, "MMM d")} - ${format(end, "MMM d")}`;
  }, [trip.endDate, trip.startDate]);
  const tripYear = useMemo(() => format(parseISO(trip.startDate), "yyyy"), [trip.startDate]);

  return (
    <section className={surface("overflow-hidden p-3 h-full")}>
      <div
        className="group relative h-full min-h-76 overflow-hidden rounded-[28px] bg-cover bg-center sm:min-h-92"
      >
        <Image
          src={heroImage}
          alt={trip.title}
          fill
          className="absolute inset-0 bg-cover bg-center object-cover "
        />


        <div className="relative flex h-full min-h-76 flex-col justify-between p-5 sm:min-h-92 sm:p-7">
          <div className="flex mb-4 items-start justify-between gap-4">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/14 bg-black/26 px-3.5 py-2 text-[0.68rem] font-semibold tracking-[0.18em] text-white/88 backdrop-blur-md">
              <MapPin className="h-3.5 w-3.5 text-[#dbe887]" />
              <span>{trip.destination}</span>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-end">
            <div className="max-w-3xl rounded-4xl border border-white/10 bg-background/20 p-5 shadow backdrop-blur-xl sm:p-6">

              <h2 className="mt-4 max-w-2xl text-[2.7rem] font-semibold leading-[0.9] tracking-[-0.09em] text-white sm:text-[4.15rem]">
                {trip.title}
              </h2>
              <p className="mt-2 text-[1.45rem] font-semibold tracking-[-0.06em] text-white">
                {tripWindow} // {tripYear}
              </p>
              {/* <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72 sm:text-[1rem]">
                The place everyone returns to for the chosen stay, live weather, budget,
                trip notes, and the readiness pulse before departure.
              </p> */}

              <div className="mt-4 flex flex-wrap gap-2.5 text-sm text-white/88">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/9 px-3.5 py-2.5 backdrop-blur-md">
                  <CalendarDays className="h-4 w-4 text-[#dbe887]" />
                  <span>{duration}</span>
                </span>


              </div>
            </div>

            <div className="grid gap-3 h-full">
              {/* <div className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(12,20,17,0.76),rgba(12,20,17,0.48))] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.22)] backdrop-blur-xl">
              
               

              </div> */}

              <div className="rounded-[26px] border border-white/10 bg-background/20 p-4 shadow backdrop-blur-xl">



                <div className="grid grid-cols-2 gap-2.5">
                  <div className="rounded-[18px] border border-white/10 bg-white/[0.05] px-3 py-3">
                    <p className="text-[0.58rem] uppercase tracking-[0.16em] text-white/40">
                      People
                    </p>
                    <p className="mt-2 text-sm font-medium text-white">
                      {Math.max(travelerCount, 1)} travelers
                    </p>
                  </div>
                  <div className="rounded-[18px] border border-white/10 bg-white/[0.05] px-3 py-3">
                    <p className="text-[0.58rem] uppercase tracking-[0.16em] text-white/40">
                      Mode
                    </p>
                    <p className="mt-2 text-sm font-medium text-white">Lit</p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-[0.68rem] uppercase tracking-[0.16em] text-white/46">
                      <span>Trip mood</span>
                      <span>Curated</span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-white/10">
                      <div className="h-full w-[82%] rounded-full bg-[linear-gradient(90deg,#dbe887,#8cc8ba)]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-[0.68rem] uppercase tracking-[0.16em] text-white/46">
                      <span>Overview fit</span>
                      <span>Strong</span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-white/10">
                      <div className="h-full w-[91%] rounded-full bg-[linear-gradient(90deg,#c7b0ff,#dbe887)]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
    <section className={surface("overflow-hidden p-4 h-full")}>
      <div className="grid gap-4 md:h-full md:grid-cols-[minmax(10rem,14rem)_minmax(0,1fr)]">
        <div className="relative h-44 w-full md:h-full">
          <Image
            src={proposal?.imageUrl || image}
            alt={proposal?.name || "Choose your stay"}
            fill
            sizes="(min-width: 768px) 14rem, 100vw"
            className="rounded-[22px] object-cover object-center"
            style={{ backgroundColor: "#232" }}
            priority={true}
          />
        </div>
        <div className="flex flex-col md:h-full">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <SummaryEyebrow>Stay</SummaryEyebrow>
              <h2 className="mt-3 text-[1.7rem] font-semibold tracking-[-0.05em] sm:text-[1.95rem]">
                {proposal?.name || "Choose your stay"}
              </h2>
            </div>
            <SummaryActionButton label="Open stay details" onClick={onOpenSearch} />
          </div>
          <p className="mt-4 text-[1rem] leading-7 text-[color:var(--trip-card-muted-text)]">
            {proposal?.locationName ||
              "Open the proposals panel to choose the shared stay and lock the group on one place."}
          </p>
          {/* Optional: add spacer so description never hugs bottom, but ensure stretch */}
          <div className="flex-1" />
        </div>
      </div>
    </section>
  );
}



export function TripNotesSummaryCard({
  card,
  extraNotesCount,
  onEdit,
}: {
  card?: DashboardCardRecord | null;
  extraNotesCount?: number;
  onEdit: () => void;
}) {
  return (
    <section className={surface("flex flex-col p-6")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <SummaryEyebrow>Trip Notes</SummaryEyebrow>
          <h2 className="mt-3 truncate text-[1.65rem] font-semibold tracking-[-0.05em] sm:text-[1.85rem]">
            {card?.title || "Shared notes"}
          </h2>
        </div>
        <SummaryActionButton label="Edit trip notes" onClick={onEdit} />
      </div>

      <p className="mt-5 line-clamp-4 whitespace-pre-wrap text-[1rem] leading-7 text-[color:var(--trip-card-muted-text)]">
        {card?.content ||
          "Use one shared note for itinerary anchors, meeting point, booking references, and reminders everyone needs."}
      </p>

      <div className="mt-auto pt-5">
        <div className="trip-theme-chip inline-flex items-center gap-2 rounded-full px-3 py-2 text-[0.72rem] uppercase tracking-[0.16em]">
          <FileText className="h-3.5 w-3.5" />
          <span>{extraNotesCount || 0} extra note{extraNotesCount === 1 ? "" : "s"}</span>
        </div>
      </div>
    </section>
  );
}

export function CustomNoteSummaryCard({
  card,
  noteCount,
  onCreate,
  onEdit,
}: {
  card?: DashboardCardRecord | null;
  noteCount: number;
  onCreate: () => void;
  onEdit: () => void;
}) {
  const hasNote = Boolean(card);

  return (
    <section className={surface("p-6")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <SummaryEyebrow>{hasNote ? "Saved Note" : "Add Note"}</SummaryEyebrow>
          <h2 className="mt-3 truncate text-[1.85rem] font-semibold tracking-[-0.05em]">
            {card?.title || "Capture an extra note"}
          </h2>
        </div>
        <SummaryActionButton
          label={hasNote ? "Edit note" : "Create note"}
          onClick={hasNote ? onEdit : onCreate}
          variant={hasNote ? "more" : "plus"}
        />
      </div>

      {hasNote ? (
        <>
          <p className="mt-5 whitespace-pre-wrap text-[1rem] leading-7 text-[color:var(--trip-card-muted-text)]">
            {card?.content}
          </p>
          <div className="trip-theme-chip mt-5 inline-flex items-center gap-2 rounded-full px-3 py-2 text-[0.72rem] uppercase tracking-[0.16em]">
            <FileText className="h-3.5 w-3.5" />
            <span>{noteCount} saved note{noteCount === 1 ? "" : "s"}</span>
          </div>
        </>
      ) : (
        <div className="trip-theme-subsurface-solid mt-5 rounded-3xl border border-dashed px-4 py-5">
          <p className="text-sm font-medium text-[#f7f4ea]">No quick note yet</p>
          <p className="mt-2 text-sm leading-6 text-[color:var(--trip-card-muted-text)]">
            Add transport details, booking references, emergency contacts, or any small
            detail that should stay visible from the main trip page.
          </p>
        </div>
      )}
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
          <SummaryEyebrow>Spots</SummaryEyebrow>
          <h2 className="mt-3 text-[1.7rem] font-semibold tracking-[-0.05em] sm:text-[1.95rem]">
            Saved highlights
          </h2>
        </div>
        <SummaryActionButton label="Open places and proposals" onClick={onOpenSearch} />
      </div>

      {featured.length === 0 ? (
        <div className="mt-5">
          <SummaryEmpty
            title="No saved highlights yet"
            description="Use the proposals view to collect places the group wants to keep on the shortlist."
          />
        </div>
      ) : (
        <div className="mt-5 grid gap-3 md:grid-cols-[0.95fr_1.05fr]">
          <div className="grid gap-3">
            {featured.slice(0, 2).map((spot, index) => (
              <article
                key={spot._id}
                className="relative min-h-[10.5rem] overflow-hidden rounded-3xl bg-cover bg-center"
                style={{
                  backgroundImage: `url("${spot.imageUrl || images[index] || images[0]}")`,
                }}
              >
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.06),rgba(0,0,0,0.78))]" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="text-[1.25rem] font-medium tracking-[-0.03em]">{spot.name}</p>
                  <p className="mt-1 text-sm text-white/62">
                    {spot.locationName || destination}
                  </p>
                </div>
              </article>
            ))}
          </div>

          <article
            className="relative min-h-[22rem] overflow-hidden rounded-[28px] bg-cover bg-center"
            style={{
              backgroundImage: `url("${featured[2]?.imageUrl || images[2] || images[0]}")`,
            }}
          >
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02),rgba(0,0,0,0.44)_54%,rgba(0,0,0,0.88))]" />
            <div className="absolute bottom-5 left-5 right-5">
              <p className="text-[1.9rem] font-medium tracking-[-0.05em]">
                {featured[2]?.name || destination}
              </p>
              <p className="mt-2 text-sm leading-6 text-white/64">
                {featured[2]?.locationName ||
                  "Open the proposals workspace to pin the best stops, food spots, and must-do activities."}
              </p>
            </div>
          </article>
        </div>
      )}
    </section>
  );
}



export function BudgetSummaryCard({
  expenses,
  totalBudget,
  onOpenDetails,
}: {
  expenses: ExpenseCard[] | undefined;
  totalBudget: number;
  onOpenDetails: () => void;
}) {
  const visibleExpenses = expenses?.slice(0, 4) || [];

  return (
    <section className={surface("p-5")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <SummaryEyebrow>Budget</SummaryEyebrow>
          <p className="mt-3 text-[2.2rem] font-semibold tracking-[-0.06em]">
            {currencyFormatter.format(totalBudget)}
          </p>
        </div>
        <SummaryActionButton label="Open budget details" onClick={onOpenDetails} />
      </div>

      {visibleExpenses.length > 0 ? (
        <div className="mt-6 space-y-3">
          {visibleExpenses.map((expense) => (
            <div key={expense._id} className="trip-theme-subsurface-solid flex items-center justify-between gap-4 rounded-[20px] px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{expense.title}</p>
                <p className="mt-1 truncate text-xs uppercase tracking-[0.14em] text-[color:var(--trip-card-muted-text)]">
                  {expense.payerName}
                </p>
              </div>
              <span className="shrink-0 text-sm font-medium text-white">
                {currencyFormatter.format(expense.amount)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <SummaryEmpty
            title="No shared spend yet"
            description="Track the detailed budget in the planner tab. The board will stay focused on totals and recent items."
          />
        </div>
      )}
    </section>
  );
}

export function BudgetOverviewCard({
  expenses,
  totalBudget,
  expenseCount,
  budgetTarget,
  onOpenDetails,
}: {
  expenses: ExpenseCard[] | undefined;
  totalBudget: number;
  expenseCount: number;
  budgetTarget: number;
  onOpenDetails: () => void;
}) {
  const bucketSummary = useMemo(() => {
    const totals = new Map<string, number>(budgetBuckets.map((bucket) => [bucket.id, 0]));

    (expenses || []).forEach((expense) => {
      const bucketId = getBudgetBucket(expense.title);
      totals.set(bucketId, (totals.get(bucketId) || 0) + expense.amount);
    });

    const safeTotal = totalBudget || 1;

    return budgetBuckets.map((bucket) => {
      const amount = totals.get(bucket.id) || 0;
      const percent = totalBudget > 0 ? Math.round((amount / safeTotal) * 100) : 0;

      return {
        ...bucket,
        amount,
        percent,
      };
    });
  }, [expenses, totalBudget]);

  return (
    <section className={surface("p-4 grid grid-cols-2 gap-3 xl:grid-cols-[11rem_minmax(0,1fr)]")}>
      <div className="trip-theme-subsurface rounded-3xl px-4 py-5 text-center flex flex-col justify-center items-center">
        <p className="mt-3 text-[2.35rem] font-semibold tracking-[-0.08em] text-white">
          {currencyFormatter.format(totalBudget)}
        </p>
        <p className="mt-2 text-sm text-[color:var(--trip-card-muted-text)]">Total</p>

        <button
          type="button"
          onClick={onOpenDetails}
          className="trip-theme-chip mt-6 inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm text-white transition-[background-color,border-color,color]"
        >
          Details
        </button>
      </div>

      <div className="trip-theme-subsurface rounded-3xl px-4 py-4 ">
        <div className="space-y-2.5">
          {bucketSummary.map((bucket) => {
            const Icon = bucket.icon;
            const width =
              totalBudget > 0 ? Math.max(bucket.percent, bucket.amount > 0 ? 10 : 0) : 0;

            return (
              <div key={bucket.id}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[color:var(--trip-card-muted-text)]">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="truncate text-[#e9eee5]">{bucket.label}</span>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="font-medium text-white">
                      {currencyFormatter.format(bucket.amount)}
                    </span>
                    <span className="ml-1 text-[color:var(--trip-card-muted-text)]">({bucket.percent}%)</span>
                  </div>
                </div>
                <div className="trip-theme-track mt-2 h-1.5 rounded-full">
                  <div
                    className={`h-full rounded-full ${bucket.barClass}`}
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="trip-theme-divider mt-4 flex items-center justify-between border-t pt-3 text-sm">
          <span className="text-[color:var(--trip-card-muted-text)]">Target</span>
          <div className="text-right">
            <span className="font-medium text-white">
              {currencyFormatter.format(budgetTarget)}
            </span>
            <span className="ml-2 text-[color:var(--trip-card-muted-text)]">/ {expenseCount} records</span>
          </div>
        </div>
      </div>
    </section>
  );
}



export function PackingSummaryCard({
  tasks,
  onOpenDetails,
}: {
  tasks: TaskCard[] | undefined;
  onOpenDetails: () => void;
}) {
  const totalTasks = tasks?.length || 0;
  const completedTasks = tasks?.filter((task) => task.isChecked).length || 0;
  const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  const visibleTasks = tasks?.slice(0, 4) || [];

  return (
    <section className={surface("flex flex-col p-5")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <SummaryEyebrow>Packing</SummaryEyebrow>
          <h2 className="mt-3 text-[1.65rem] font-semibold tracking-[-0.05em] sm:text-[1.9rem]">
            Mandatory essentials
          </h2>
        </div>
        <SummaryActionButton label="Open packing details" onClick={onOpenDetails} />
      </div>

      <div className="packing-progress-shell h-full flex flex-col justify-between trip-theme-subsurface-solid mt-5 rounded-3xl p-4">
        <div className="flex flex-col justify-between">
          <p className="text-sm text-[color:var(--trip-card-muted-text)]">Checklist progress</p>

          <div className="flex items-end justify-between gap-3">

            <p className="mt-2 text-[1.75rem] font-semibold tracking-[-0.05em]">
              {completedTasks}/{totalTasks}
            </p>
            <span className="packing-progress-badge trip-theme-chip rounded-full px-3 py-2 text-[0.7rem] uppercase tracking-[0.16em]">
              {progress}% ready
            </span>
          </div>


        </div>
        <div className="packing-progress-track trip-theme-track mt-4 h-2 rounded-full">
          <div
            className="packing-progress-fill trip-theme-fill h-full rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>


    </section>
  );
}

export function ReadinessSummaryCard({
  daysLeft,
  readinessScore,
  onOpenDetails,
}: {
  daysLeft: number;
  readinessScore: number;
  onOpenDetails: () => void;
}) {
  const circleRadius = 54;
  const circumference = 2 * Math.PI * circleRadius;
  const progress = Math.max(0, Math.min(100, readinessScore));
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <section className="trip-theme-card trip-dashboard-surface readiness-card-shell relative flex h-full flex-col overflow-hidden rounded-4xl px-5 py-5 text-[#f7f4ea]">
      <div className="flex items-start justify-between gap-3">
        <div className="relative z-10">
          <p className="font-semibold text-[color:var(--trip-card-muted-text)]">
            Readiness
          </p>
        </div>
        <div className="relative z-10">
          <SummaryActionButton label="Open readiness details" onClick={onOpenDetails} />
        </div>
      </div>

      <div className="relative z-10 mx-auto mt-6 h-40 w-40 sm:h-48 sm:w-48 xl:h-full xl:w-full">
        <svg className="absolute inset-0 h-full w-full -rotate-90 drop-shadow-lg " viewBox="0 0 140 140">
          <circle
            cx="70"
            cy="70"
            r={circleRadius}
            fill="none"
            stroke="color-mix(in srgb, var(--accent) 16%, transparent)"
            strokeWidth="12"
          />
          <circle
            cx="70"
            cy="70"
            r={circleRadius}
            fill="none"
            stroke="var(--accent)"
            strokeLinecap="round"
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center ">
          <p className="text-sm font-medium text-[color:var(--trip-card-muted-text)]">Days left</p>
          <p className="mt-1 text-[2.45rem] font-semibold leading-none tracking-[-0.08em] sm:text-[3rem]">
            {daysLeft}
          </p>
        </div>
      </div>

    
    </section>
  );
}

const categoryIcons = {
  accommodation: Hotel,
  food: Utensils,
  activity: Flag,
  favorite: Heart,
} as const;

const categoryColors = {
  accommodation: "text-sky-400",
  food: "text-amber-400",
  activity: "text-emerald-400",
  favorite: "text-rose-400",
} as const;

export function PeopleSummaryCard({
  travelers,
  onOpenPeople,
}: {
  travelers: AvailabilityMember[] | undefined;
  onOpenPeople: () => void;
}) {
  const visibleTravelers = travelers?.slice(0, 5) || [];
  const hiddenCount = Math.max((travelers?.length || 0) - 5, 0);
  const ownerCount = travelers?.filter((t) => t.role === "owner").length || 0;

  return (
    <section className={surface("flex flex-col p-5")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <SummaryEyebrow>People</SummaryEyebrow>
          <h2 className="mt-3 text-[1.65rem] font-semibold tracking-[-0.05em] sm:text-[1.9rem]">
            {travelers?.length || 0} travelers
          </h2>
        </div>
        <SummaryActionButton label="View all people" onClick={onOpenPeople} />
      </div>

      <div className="mt-5 flex-1">
        {visibleTravelers.length > 0 ? (
          <div className="space-y-2">
            {visibleTravelers.map((traveler) => (
              <div
                key={traveler.memberId}
                className="people-card-row trip-theme-subsurface-solid flex items-center gap-3 rounded-2xl px-3 py-2.5"
              >
                <UserAvatar
                  name={traveler.name}
                  image={traveler.image}
                  seed={traveler.userId}
                  size={32}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {traveler.name}
                    {traveler.isCurrentUser && (
                      <span className="ml-1.5 text-[color:var(--trip-card-muted-text)]">(you)</span>
                    )}
                  </p>
                </div>
                <span className="shrink-0 text-[0.65rem] uppercase tracking-[0.12em] text-[color:var(--trip-card-muted-text)]">
                  {traveler.role}
                </span>
              </div>
            ))}
            {hiddenCount > 0 && (
              <button
                type="button"
                onClick={onOpenPeople}
                className="trip-theme-chip w-full rounded-2xl px-3 py-2.5 text-center text-sm transition-colors hover:bg-white/[0.06]"
              >
                +{hiddenCount} more
              </button>
            )}
          </div>
        ) : (
          <SummaryEmpty
            title="No travelers yet"
            description="Share the trip link to invite friends and family to join the planning."
          />
        )}
      </div>

      <div className="mt-4 flex items-center gap-2 pt-2">
        <span className="trip-theme-chip inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[0.68rem] uppercase tracking-[0.14em]">
          <Users className="h-3 w-3" />
          {ownerCount} owner{ownerCount !== 1 ? "s" : ""}
        </span>
      </div>
    </section>
  );
}

export function ProposalsSummaryCard({
  proposals,
  trip,
  onOpenSearch,
}: {
  proposals: ProposalCard[] | undefined;
  trip: Doc<"trips">;
  onOpenSearch: () => void;
}) {
  const topProposals = useMemo(() => {
    if (!proposals) return [];
    return [...proposals]
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 4);
  }, [proposals]);

  const categoryCounts = useMemo(() => {
    if (!proposals) return { accommodation: 0, food: 0, activity: 0, favorite: 0 };
    return proposals.reduce(
      (acc, p) => {
        const cat = p.category || "accommodation";
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      },
      { accommodation: 0, food: 0, activity: 0, favorite: 0 } as Record<string, number>
    );
  }, [proposals]);

  return (
    <section className={surface("flex flex-col p-5")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <SummaryEyebrow>Proposals</SummaryEyebrow>
          <h2 className="mt-3 text-[1.65rem] font-semibold tracking-[-0.05em] sm:text-[1.9rem]">
            {proposals?.length || 0} saved places
          </h2>
        </div>
        <SummaryActionButton label="View all proposals" onClick={onOpenSearch} />
      </div>

      <div className="mt-5 flex-1">
        {topProposals.length > 0 ? (
          <div className="space-y-2">
            {topProposals.map((proposal) => {
              const CategoryIcon = categoryIcons[proposal.category || "accommodation"];
              const colorClass = categoryColors[proposal.category || "accommodation"];
              
              return (
                <div
                  key={proposal._id}
                  className="trip-theme-subsurface-solid flex items-center gap-3 rounded-2xl px-3 py-2.5"
                >
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl">
                    {proposal.imageUrl ? (
                      <Image
                        src={proposal.imageUrl}
                        alt={proposal.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-white/[0.06]">
                        <CategoryIcon className={`h-4 w-4 ${colorClass}`} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{proposal.name}</p>
                    <p className="truncate text-xs text-[color:var(--trip-card-muted-text)]">
                      {proposal.locationName || trip.destination}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5 text-sm text-[color:var(--trip-card-muted-text)]">
                    <ThumbsUp className="h-3.5 w-3.5" />
                    <span>{proposal.votes}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <SummaryEmpty
            title="No proposals yet"
            description="Add places the group wants to visit, stay at, or eat at."
          />
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 pt-2">
        {Object.entries(categoryCounts).map(([cat, count]) => {
          if (count === 0) return null;
          const Icon = categoryIcons[cat as keyof typeof categoryIcons];
          const colorClass = categoryColors[cat as keyof typeof categoryColors];
          return (
            <span
              key={cat}
              className="trip-theme-chip inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[0.68rem] uppercase tracking-[0.14em]"
            >
              <Icon className={`h-3 w-3 ${colorClass}`} />
              {count}
            </span>
          );
        })}
      </div>
    </section>
  );
}

export function MapSummaryCard({
  trip,
  markers,
  onOpenSearch,
}: {
  trip: Doc<"trips">;
  markers: TripMarker[];
  onOpenSearch: () => void;
}) {
  const markerCount = markers.length;
  const hasCoordinates = trip.lat != null && trip.lng != null;

  return (
    <section className={surface("relative flex flex-col overflow-hidden p-0")}>
      {hasCoordinates ? (
        <div className="relative h-44 w-full">
          <Image
            src={`https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${trip.lng},${trip.lat},10,0/600x300@2x?access_token=pk.eyJ1Ijoid2hpdGUzM3RoIiwiYSI6ImNsdm1mY3ZreDB0OG0ycWsydGR0NHdxdmwifQ.7aQNbMMMhR8d3mj_yD8cvA`}
            alt={`Map of ${trip.destination}`}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </div>
      ) : (
        <div className="flex h-44 w-full items-center justify-center bg-white/[0.03]">
          <Map className="h-12 w-12 text-white/20" />
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 p-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white/60">
              Map
            </p>
            <h2 className="mt-1 text-[1.4rem] font-semibold tracking-[-0.04em] text-white">
              {trip.destination}
            </h2>
            <p className="mt-1 text-sm text-white/60">
              {markerCount} pinned location{markerCount !== 1 ? "s" : ""}
            </p>
          </div>
          <SummaryActionButton
            label="Open map"
            onClick={onOpenSearch}
            contrast="light"
          />
        </div>
      </div>
    </section>
  );
}
