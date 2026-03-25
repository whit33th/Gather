"use client";

import { useMemo } from "react";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import {
  CalendarDays,
  Check,
  ChevronRight,
  FileText,
  Hotel,
  MapPin,
  MoreHorizontal,
  Plane,
  Plus,
  Sparkles,
  Ticket,
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
  return `trip-theme-card trip-dashboard-surface h-full rounded-[30px] ${extra}`;
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
    <p className="text-[0.78rem] font-medium uppercase tracking-[0.22em] text-[color:var(--trip-card-muted-text)]">
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
    <div className="trip-theme-subsurface-solid trip-dashboard-subsurface rounded-[22px] border border-dashed px-4 py-4 sm:rounded-[24px] sm:py-5">
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
            <div className="max-w-3xl rounded-[30px] border border-white/10 bg-background/20 p-5 shadow backdrop-blur-xl sm:p-6">

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
              {/* <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(12,20,17,0.76),rgba(12,20,17,0.48))] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.22)] backdrop-blur-xl">
              
               

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
      <div className="grid h-full gap-4 md:grid-cols-[minmax(10rem,14rem)_minmax(0,1fr)]">
        <div className="relative h-full w-full">
          <Image
            src={proposal?.imageUrl || image}
            alt={proposal?.name || "Choose your stay"}
            fill
            sizes="(min-width: 768px) 14rem, 100vw"
            className="rounded-[22px] object-cover object-center h-full w-full min-h-[10rem] md:min-h-[14rem]"
            style={{ backgroundColor: "#232" }}
            priority={true}
          />
        </div>
        <div className="flex flex-col h-full min-h-[10rem]">
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
      <div className="flex items-start justify-between gap-3">
        <div>
          <SummaryEyebrow>People</SummaryEyebrow>
          <h2 className="mt-3 text-[1.65rem] font-semibold tracking-[-0.05em] sm:text-[1.9rem]">
            {travelers?.length || 0} travelers
          </h2>
        </div>
        <SummaryActionButton label="Open people details" onClick={onOpenPeople} />
      </div>

      <div className="mt-5 space-y-3">
        {visibleTravelers.length > 0 ? (
          visibleTravelers.map((traveler) => (
            <article
              key={traveler.memberId}
              className="people-card-row trip-theme-subsurface-solid flex items-center gap-3 rounded-[22px] px-4 py-3"
            >
              <UserAvatar
                name={traveler.name}
                image={traveler.image}
                seed={traveler.userId}
                size={38}
              />
              <div className="min-w-0">
                <p className="truncate text-base font-medium">{traveler.name}</p>
                <p className="text-sm text-[color:var(--trip-card-muted-text)]">
                  {traveler.isCurrentUser ? "You" : traveler.role}
                </p>
              </div>
            </article>
          ))
        ) : (
          <SummaryEmpty
            title="No travelers synced yet"
            description="Once people join the trip, this card will show the shared crew."
          />
        )}
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
        <div className="trip-theme-subsurface-solid mt-5 rounded-[24px] border border-dashed px-4 py-5">
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
                className="relative min-h-[10.5rem] overflow-hidden rounded-[24px] bg-cover bg-center"
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

export function ArrivalSummaryCard({
  arrivalDate,
  items,
  onManage,
}: {
  arrivalDate: string;
  items: ScheduleItem[] | undefined;
  onManage: () => void;
}) {
  const visibleItems = items?.slice(0, 3) || [];

  return (
    <section className={surface("flex flex-col p-5")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <SummaryEyebrow>Arrival</SummaryEyebrow>
          <p className="mt-3 text-[1.7rem] font-semibold tracking-[-0.06em] sm:text-[2rem]">
            {arrivalDate}
          </p>
        </div>
        <SummaryActionButton label="Manage arrival plan" onClick={onManage} />
      </div>

      {visibleItems.length > 0 ? (
        <div className="mt-6 flex-1 space-y-3">
          {visibleItems.map((item, index) => (
            <article
              key={item._id}
              className="rounded-[22px] border border-[#23372e] bg-[#14251e] px-4 py-4"
            >
              <div className="flex items-start gap-3">
                <span className="trip-theme-chip rounded-full px-2.5 py-1 text-[0.68rem] uppercase tracking-[0.14em]">
                  Day {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-base font-medium">{item.title}</p>
                  <p className="mt-2 text-sm text-[color:var(--trip-card-muted-text)]">
                    {item.startsAt} - {item.endsAt}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <SummaryEmpty
            title="No arrival blocks yet"
            description="Keep this card clean and summary-only. Add check-in, transfer, and first-day anchors from the planner drawer."
          />
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
    <section className={surface("p-4")}>
      <div className="grid gap-3 xl:grid-cols-[11rem_minmax(0,1fr)]">
        <div className="trip-theme-subsurface rounded-[24px] px-4 py-5 text-center">
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

        <div className="trip-theme-subsurface rounded-[24px] px-4 py-4">
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
      </div>
    </section>
  );
}

export function ExpensesSummaryCard({
  expenses,
  onOpenDetails,
}: {
  expenses: ExpenseCard[] | undefined;
  onOpenDetails: () => void;
}) {
  const visibleExpenses = expenses?.slice(0, 4) || [];

  return (
    <section className={surface("flex flex-col p-5")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <SummaryEyebrow>Expenses</SummaryEyebrow>
          <h2 className="mt-3 text-[1.45rem] font-semibold tracking-[-0.05em] sm:text-[1.6rem]">
            Recent log
          </h2>
        </div>
        <SummaryActionButton label="Open expenses details" onClick={onOpenDetails} />
      </div>

      {visibleExpenses.length > 0 ? (
        <div className="mt-5 flex-1 space-y-3">
          {visibleExpenses.map((expense) => (
            <div key={expense._id} className="trip-theme-subsurface-solid flex items-center justify-between gap-3 rounded-[18px] px-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{expense.title}</p>
                <p className="mt-1 truncate text-xs text-[color:var(--trip-card-muted-text)]">{expense.payerName}</p>
              </div>
              <span className="shrink-0 text-sm font-medium text-white">
                {currencyFormatter.format(expense.amount)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-5 flex-1">
          <SummaryEmpty
            title="No expenses yet"
            description="The first recorded spend will appear here as a compact summary list."
          />
        </div>
      )}

      <div className="mt-auto pt-4">
        <button
          type="button"
          onClick={onOpenDetails}
          className="trip-theme-chip inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm text-[#f7f4ea] transition-[background-color,border-color,color]"
        >
          <Plus className="h-4 w-4" />
          <span>Record</span>
        </button>
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

      <div className="packing-progress-shell trip-theme-subsurface-solid mt-5 rounded-[24px] p-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm text-[color:var(--trip-card-muted-text)]">Checklist progress</p>
            <p className="mt-2 text-[1.75rem] font-semibold tracking-[-0.05em]">
              {completedTasks}/{totalTasks}
            </p>
          </div>
          <span className="packing-progress-badge trip-theme-chip rounded-full px-3 py-2 text-[0.7rem] uppercase tracking-[0.16em]">
            {progress}% ready
          </span>
        </div>
        <div className="packing-progress-track trip-theme-track mt-4 h-2 rounded-full">
          <div
            className="packing-progress-fill trip-theme-fill h-full rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {visibleTasks.length > 0 ? (
        <ul className="mt-5 flex-1 space-y-3">
          {visibleTasks.map((task) => (
            <li key={task._id} className="trip-theme-subsurface-solid flex items-start gap-3 rounded-[20px] px-4 py-3">
              <span
                className={`mt-1 flex h-5 w-5 items-center justify-center rounded-full border ${task.isChecked
                  ? "border-[color:var(--accent)] bg-[color:var(--accent)] text-[color:var(--accent-contrast)]"
                  : "border-[color:var(--trip-card-border-strong)] bg-transparent text-transparent"
                  }`}
              >
                <Check className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <p
                  className={`text-sm font-medium ${task.isChecked ? "text-[color:var(--trip-card-muted-text)] line-through" : "text-white"
                    }`}
                >
                  {task.name}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[color:var(--trip-card-muted-text)]">
                  {task.category}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-5 flex-1">
          <SummaryEmpty
            title="Checklist not started"
            description="Open the planner drawer or detail view to add the first pre-trip tasks."
          />
        </div>
      )}
    </section>
  );
}

export function ReadinessSummaryCard({
  daysLeft,
  readinessScore,
  checklistLabel,
  scheduleLabel,
  peopleLabel,
  onOpenDetails,
}: {
  daysLeft: number;
  readinessScore: number;
  checklistLabel: string;
  scheduleLabel: string;
  peopleLabel: string;
  onOpenDetails: () => void;
}) {
  const circleRadius = 54;
  const circumference = 2 * Math.PI * circleRadius;
  const progress = Math.max(0, Math.min(100, readinessScore));
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <section className="trip-theme-card trip-dashboard-surface readiness-card-shell relative flex h-full flex-col overflow-hidden rounded-[30px] px-5 py-5 text-[#f7f4ea]">
      <div className="readiness-card-overlay absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,color-mix(in_srgb,var(--accent)_12%,transparent),transparent_20%),radial-gradient(circle_at_18%_0%,color-mix(in_srgb,var(--foreground)_5%,transparent),transparent_24%)]" />
      <div className="flex items-start justify-between gap-3">
        <div className="relative z-10">
          <p className="text-[0.82rem] font-semibold uppercase tracking-[0.2em] text-[color:var(--trip-card-muted-text)]">
            Readiness
          </p>
          <p className="mt-3 text-[1.7rem] font-semibold tracking-[-0.05em] sm:text-[1.9rem]">
            {progress}% set
          </p>
          <p className="mt-2 text-sm text-[color:var(--trip-card-muted-text)]">
            Shared trip readiness across checklists, planning blocks, and team sync.
          </p>
        </div>
        <div className="relative z-10">
          <SummaryActionButton label="Open readiness details" onClick={onOpenDetails} />
        </div>
      </div>

      <div className="relative z-10 mx-auto mt-6 h-[11rem] w-[11rem] sm:h-[13rem] sm:w-[13rem]">
        <div className="readiness-card-orb absolute inset-0 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--accent)_22%,transparent),transparent_62%)] blur-xl" />
        <div className="readiness-card-core absolute inset-[0.9rem] rounded-full border border-[color:var(--trip-card-border)] bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--paper)_92%,transparent),color-mix(in_srgb,var(--paper-strong)_96%,transparent)_72%)] backdrop-blur-sm" />
        <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 140 140">
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
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-sm font-medium text-[color:var(--trip-card-muted-text)]">Days left</p>
          <p className="mt-1 text-[2.45rem] font-semibold leading-none tracking-[-0.08em] sm:text-[3rem]">
            {daysLeft}
          </p>

        </div>
      </div>

      <div className="relative z-10 mt-5 grid grid-cols-3 gap-2">
        <div className="trip-theme-muted rounded-[20px] px-3 py-3">
          <p className="text-[0.62rem] uppercase tracking-[0.16em] text-[color:var(--trip-card-muted-text)]">
            Checklist
          </p>
          <p className="mt-2 text-sm font-medium text-white">{checklistLabel}</p>
        </div>
        <div className="trip-theme-muted rounded-[20px] px-3 py-3">
          <p className="text-[0.62rem] uppercase tracking-[0.16em] text-[color:var(--trip-card-muted-text)]">
            Plan
          </p>
          <p className="mt-2 text-sm font-medium text-white">{scheduleLabel}</p>
        </div>
        <div className="trip-theme-muted rounded-[20px] px-3 py-3">
          <p className="text-[0.62rem] uppercase tracking-[0.16em] text-[color:var(--trip-card-muted-text)]">
            People
          </p>
          <p className="mt-2 text-sm font-medium text-white">{peopleLabel}</p>
        </div>
      </div>
    </section>
  );
}
