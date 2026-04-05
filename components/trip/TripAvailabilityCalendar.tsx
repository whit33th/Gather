"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { useMutation } from "convex/react";
import {
  addDays,
  addMonths,
  format,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleSlash,
  HelpCircle,
  List,
  Users,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import UserAvatar from "../UserAvatar";

type AvailabilityStatus = "yes" | "no" | "maybe";

type AvailabilityEntry = {
  date: string;
  status: AvailabilityStatus;
};

type AvailabilityMember = {
  userId: string;
  memberId: string;
  name: string;
  image?: string;
  role: "owner" | "member";
  isCurrentUser: boolean;
  availabilities: AvailabilityEntry[];
};

type TripAvailabilityCalendarProps = {
  tripId: Id<"trips">;
  travelers: AvailabilityMember[] | undefined;
  tripStartDate?: string;
  tripEndDate?: string;
};

type ViewMode = "calendar" | "list";
type DayAvailabilityBuckets = {
  yes: AvailabilityMember[];
  no: AvailabilityMember[];
  maybe: AvailabilityMember[];
};
type DayAvatarEntry = {
  member: AvailabilityMember;
  status: AvailabilityStatus;
};

const statusConfig = {
  yes: {
    icon: Check,
    bgClass: "bg-emerald-500/20",
    borderClass: "border-emerald-500/30",
    textClass: "text-emerald-400",
    avatarRingClass: "ring-emerald-300/55",
    label: "Available",
  },
  no: {
    icon: CircleSlash,
    bgClass: "bg-rose-500/20",
    borderClass: "border-rose-500/30",
    textClass: "text-rose-400",
    avatarRingClass: "ring-rose-300/55",
    label: "Unavailable",
  },
  maybe: {
    icon: HelpCircle,
    bgClass: "bg-amber-500/20",
    borderClass: "border-amber-500/30",
    textClass: "text-amber-400",
    avatarRingClass: "ring-amber-300/55",
    label: "Maybe",
  },
} as const;

function sortAvailabilityMembers(members: AvailabilityMember[]) {
  return [...members].sort(
    (left, right) =>
      Number(right.isCurrentUser) - Number(left.isCurrentUser) ||
      left.name.localeCompare(right.name),
  );
}

function getDayAvailability(dateKey: string, travelers: AvailabilityMember[] | undefined): DayAvailabilityBuckets {
  if (!travelers) {
    return { yes: [], no: [], maybe: [] };
  }

  const result: DayAvailabilityBuckets = {
    yes: [],
    no: [],
    maybe: [],
  };

  for (const traveler of travelers) {
    const entry = traveler.availabilities.find((availability) => availability.date === dateKey);
    if (entry) {
      result[entry.status].push(traveler);
    }
  }

  return result;
}

function getAvatarEntries(dayAvailability: DayAvailabilityBuckets): DayAvatarEntry[] {
  return [
    ...sortAvailabilityMembers(dayAvailability.yes).map((member) => ({
      member,
      status: "yes" as const,
    })),
    ...sortAvailabilityMembers(dayAvailability.maybe).map((member) => ({
      member,
      status: "maybe" as const,
    })),
    ...sortAvailabilityMembers(dayAvailability.no).map((member) => ({
      member,
      status: "no" as const,
    })),
  ];
}

function getDominantStatus(dayAvailability: DayAvailabilityBuckets): AvailabilityStatus | null {
  const totalResponses =
    dayAvailability.yes.length + dayAvailability.no.length + dayAvailability.maybe.length;

  if (totalResponses === 0) {
    return null;
  }

  if (
    dayAvailability.yes.length >= dayAvailability.no.length &&
    dayAvailability.yes.length >= dayAvailability.maybe.length
  ) {
    return "yes";
  }

  if (dayAvailability.no.length >= dayAvailability.maybe.length) {
    return "no";
  }

  return "maybe";
}

function DayAvatarStack({ entries }: { entries: DayAvatarEntry[] }) {
  const visibleEntries = entries.slice(0, 3);
  const overflowCount = Math.max(entries.length - visibleEntries.length, 0);

  if (!entries.length) {
    return null;
  }

  return (
    <div className="flex min-h-7 items-end">
      {visibleEntries.map(({ member, status }, index) => (
        <span
          key={`${member.memberId}-${status}`}
          className={`
            inline-flex rounded-full ring-2 ring-[#08110e] shadow-[0_12px_24px_rgba(0,0,0,0.28)]
            ${statusConfig[status].avatarRingClass}
            ${index === 0 ? "" : "-ml-2.5"}
          `}
          title={`${member.name} - ${statusConfig[status].label}`}
        >
          <UserAvatar
            name={member.name}
            image={member.image}
            seed={member.userId}
            size={24}
          />
        </span>
      ))}

      {overflowCount > 0 ? (
        <span className="-ml-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-white/10 bg-[#0e1512]/92 px-1.5 text-[0.58rem] font-semibold text-white/78 shadow-[0_10px_24px_rgba(0,0,0,0.24)]">
          +{overflowCount}
        </span>
      ) : null}
    </div>
  );
}

function getWeeksInMonth(date: Date) {
  const start = startOfWeek(startOfMonth(date), { weekStartsOn: 1 });
  const weeks: Date[][] = [];
  let current = start;

  for (let weekIdx = 0; weekIdx < 6; weekIdx++) {
    const week: Date[] = [];
    for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
      week.push(current);
      current = addDays(current, 1);
    }
    weeks.push(week);
    if (!isSameMonth(weeks[weekIdx][6], date) && weekIdx >= 3) break;
  }

  return weeks;
}

function CalendarDateCell({
  date,
  currentMonth,
  travelers,
  tripStartDate,
  tripEndDate,
  onDateClick,
  canEdit,
}: {
  date: Date;
  currentMonth: Date;
  travelers: AvailabilityMember[] | undefined;
  tripStartDate?: string;
  tripEndDate?: string;
  onDateClick?: (date: Date) => void;
  canEdit: boolean;
}) {
  const dateKey = format(date, "yyyy-MM-dd");
  const isCurrentMonth = isSameMonth(date, currentMonth);
  const isCurrentDay = isToday(date);

  const isInTripRange = useMemo(() => {
    if (!tripStartDate || !tripEndDate) return false;
    const tripStart = parseISO(tripStartDate);
    const tripEnd = parseISO(tripEndDate);
    return date >= tripStart && date <= tripEnd;
  }, [date, tripStartDate, tripEndDate]);

  const dayAvailability = useMemo(() => {
    return getDayAvailability(dateKey, travelers);
  }, [travelers, dateKey]);

  const totalResponses = dayAvailability.yes.length + dayAvailability.no.length + dayAvailability.maybe.length;
  const hasAvailability = totalResponses > 0;

  const avatarEntries = useMemo<DayAvatarEntry[]>(
    () => getAvatarEntries(dayAvailability),
    [dayAvailability],
  );

  const dominantStatus: AvailabilityStatus | null = useMemo(() => {
    return getDominantStatus(dayAvailability);
  }, [dayAvailability, hasAvailability]);

  const config = dominantStatus ? statusConfig[dominantStatus] : null;
  const isClickable = isCurrentMonth && isInTripRange && canEdit;

  return (
    <button
      type="button"
      onClick={() => {
        if (!isClickable) return;
        onDateClick?.(date);
      }}
      className={`
        group relative isolate flex aspect-square min-h-[4.8rem] overflow-hidden rounded-[1.4rem] border bg-white/[0.025] transition-all duration-200
        ${isCurrentMonth ? "opacity-100" : "opacity-22"}
        ${isInTripRange ? "border-white/[0.08]" : "border-transparent bg-white/[0.015]"}
        ${hasAvailability && config ? `${config.borderClass}` : isClickable ? "hover:border-white/[0.14] hover:bg-white/[0.05]" : ""}
        ${isClickable ? "cursor-pointer" : "cursor-default"}
        ${isCurrentDay ? "ring-2 ring-accent/40 ring-offset-2 ring-offset-background" : ""}
      `}
      disabled={!isClickable}
    >
      {hasAvailability && config ? (
        <div className={`absolute inset-[1px] rounded-[calc(1.4rem-1px)] ${config.bgClass} opacity-58`} />
      ) : null}

      <div className="relative z-10 flex h-full flex-col justify-between p-2.5 sm:p-3">
        <div className="flex items-start justify-between gap-2">
          <span
            className={`
              inline-flex min-w-7 items-center justify-center rounded-full px-2 py-1 text-[0.72rem] font-semibold tabular-nums shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]
              ${isCurrentDay
                ? "bg-accent text-accent-contrast"
                : isCurrentMonth
                  ? "bg-black/18 text-white/86"
                  : "bg-black/12 text-white/42"}
            `}
          >
            {format(date, "d")}
          </span>

          {hasAvailability ? (
            <span className="inline-flex min-w-6 items-center justify-center rounded-full border border-white/10 bg-black/16 px-1.5 py-1 text-[0.58rem] font-semibold text-white/62">
              {totalResponses}
            </span>
          ) : null}
        </div>

        <div className="mt-auto flex min-h-7 items-end">
          {hasAvailability ? (
            <DayAvatarStack entries={avatarEntries} />
          ) : isInTripRange ? (
            <div className="h-6 w-10 rounded-full border border-dashed border-white/[0.08] bg-white/[0.02]" />
          ) : null}
        </div>
      </div>
    </button>
  );
}

function MobileCalendarCard({
  date,
  currentMonth,
  travelers,
  tripStartDate,
  tripEndDate,
  onDateClick,
  canEdit,
}: {
  date: Date;
  currentMonth: Date;
  travelers: AvailabilityMember[] | undefined;
  tripStartDate?: string;
  tripEndDate?: string;
  onDateClick?: (date: Date) => void;
  canEdit: boolean;
}) {
  const dateKey = format(date, "yyyy-MM-dd");
  const isCurrentMonth = isSameMonth(date, currentMonth);
  const isCurrentDay = isToday(date);

  const isInTripRange = useMemo(() => {
    if (!tripStartDate || !tripEndDate) return false;
    const tripStart = parseISO(tripStartDate);
    const tripEnd = parseISO(tripEndDate);
    return date >= tripStart && date <= tripEnd;
  }, [date, tripStartDate, tripEndDate]);

  const dayAvailability = useMemo(() => getDayAvailability(dateKey, travelers), [dateKey, travelers]);
  const avatarEntries = useMemo(() => getAvatarEntries(dayAvailability), [dayAvailability]);
  const totalResponses = avatarEntries.length;
  const dominantStatus = useMemo(() => getDominantStatus(dayAvailability), [dayAvailability]);
  const config = dominantStatus ? statusConfig[dominantStatus] : null;
  const isClickable = isCurrentMonth && isInTripRange && canEdit;

  return (
    <button
      type="button"
      onClick={() => {
        if (!isClickable) return;
        onDateClick?.(date);
      }}
      className={`
        relative isolate flex min-h-[5.5rem] items-center justify-between overflow-hidden rounded-[1.45rem] border px-4 py-3 text-left transition-all duration-200
        ${isCurrentMonth ? "opacity-100" : "opacity-26"}
        ${isInTripRange ? "border-white/[0.08] bg-white/[0.03]" : "border-transparent bg-white/[0.015]"}
        ${config ? `${config.borderClass}` : ""}
        ${isClickable ? "cursor-pointer active:scale-[0.995]" : "cursor-default"}
        ${isCurrentDay ? "ring-2 ring-accent/36 ring-offset-2 ring-offset-background" : ""}
      `}
      disabled={!isClickable}
    >
      {config ? (
        <div className={`absolute inset-[1px] rounded-[calc(1.45rem-1px)] ${config.bgClass} opacity-50`} />
      ) : null}

      <div className="relative z-10 min-w-0">
        <div className="flex items-baseline gap-2">
          <p className="truncate text-sm font-semibold text-white/88">
            {format(date, "EEEE")}
          </p>
          <p
            className={`
              shrink-0 text-[0.76rem] font-medium tabular-nums
              ${isCurrentDay ? "text-accent" : "text-white/56"}
            `}
          >
            - {format(date, "d MMM")}
          </p>
        </div>
      </div>

      <div className="relative z-10 ml-4 flex min-w-0 items-center gap-3">
        {totalResponses > 0 ? (
          <>
            <DayAvatarStack entries={avatarEntries} />
            <span className="inline-flex min-w-7 items-center justify-center rounded-full border border-white/10 bg-black/16 px-2 py-1 text-[0.62rem] font-semibold text-white/64">
              {totalResponses}
            </span>
          </>
        ) : (
          <div className="h-7 w-14 rounded-full border border-dashed border-white/[0.08] bg-white/[0.02]" />
        )}
      </div>
    </button>
  );
}

function CalendarView({
  travelers,
  currentMonth,
  tripStartDate,
  tripEndDate,
  onDateClick,
}: {
  travelers: AvailabilityMember[] | undefined;
  currentMonth: Date;
  tripStartDate?: string;
  tripEndDate?: string;
  onDateClick?: (date: Date) => void;
}) {
  const weeks = useMemo(() => getWeeksInMonth(currentMonth), [currentMonth]);
  const monthDates = useMemo(
    () => weeks.flat().filter((date) => isSameMonth(date, currentMonth)),
    [currentMonth, weeks],
  );

  const weekdayLabels = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-col gap-2.5 md:hidden">
        {monthDates.map((date) => (
          <MobileCalendarCard
            key={date.toISOString()}
            date={date}
            currentMonth={currentMonth}
            travelers={travelers}
            tripStartDate={tripStartDate}
            tripEndDate={tripEndDate}
            onDateClick={onDateClick}
            canEdit={Boolean(onDateClick)}
          />
        ))}
      </div>

      <div className="hidden min-h-0 flex-1 md:flex md:flex-col">
        <div className="sticky top-0 z-10 mb-2 grid shrink-0 grid-cols-7 gap-2  px-1 py-1 backdrop-blur-sm">
          {weekdayLabels.map((label, idx) => (
            <div
              key={idx}
              className="py-1.5 text-center text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-foreground-muted"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-7 gap-2 px-1">
            {weeks.flat().map((date, idx) => (
              <CalendarDateCell
                key={idx}
                date={date}
                currentMonth={currentMonth}
                travelers={travelers}
                tripStartDate={tripStartDate}
                tripEndDate={tripEndDate}
                onDateClick={onDateClick}
                canEdit={Boolean(onDateClick)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ListView({ travelers }: { travelers: AvailabilityMember[] | undefined }) {
  const sortedTravelers = useMemo(() => {
    if (!travelers) return [];

    return [...travelers].sort((a, b) => {
      const aYesDays = a.availabilities.filter((av) => av.status === "yes").length;
      const bYesDays = b.availabilities.filter((av) => av.status === "yes").length;
      return bYesDays - aYesDays;
    });
  }, [travelers]);

  if (!sortedTravelers.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Users className="mb-3 h-10 w-10 text-foreground-muted/50" />
        <p className="text-sm font-medium text-white">No travelers yet</p>
        <p className="mt-1 text-xs text-foreground-muted">
          Invite friends to see their availability
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="mb-4 flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-white">
          Sorted by availability
        </h3>
        <span className="text-xs text-foreground-muted">
          {sortedTravelers.length} traveler{sortedTravelers.length !== 1 ? "s" : ""}
        </span>
      </div>

      {sortedTravelers.map((traveler) => {
        const yesDays = traveler.availabilities.filter((av) => av.status === "yes").length;
        const maybeDays = traveler.availabilities.filter((av) => av.status === "maybe").length;
        const noDays = traveler.availabilities.filter((av) => av.status === "no").length;
        const totalDays = traveler.availabilities.length;

        const availabilityPercent = totalDays > 0 ? Math.round((yesDays / totalDays) * 100) : 0;

        return (
          <div
            key={traveler.memberId}
            className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 transition-colors hover:bg-white/[0.05]"
          >
            <UserAvatar
              name={traveler.name}
              image={traveler.image}
              seed={traveler.userId}
              size={40}
            />

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium text-white">
                  {traveler.name}
                </p>
                {traveler.isCurrentUser && (
                  <span className="text-xs text-foreground-muted">(you)</span>
                )}
              </div>

              <div className="mt-1.5 flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="text-xs tabular-nums text-foreground-muted">
                    {yesDays}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-amber-400" />
                  <span className="text-xs tabular-nums text-foreground-muted">
                    {maybeDays}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-rose-400" />
                  <span className="text-xs tabular-nums text-foreground-muted">
                    {noDays}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-lg font-bold tabular-nums text-white">
                {yesDays}
              </span>
              <span className="text-[0.65rem] uppercase tracking-wider text-foreground-muted">
                days
              </span>
            </div>

            <div className="ml-2 h-10 w-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="w-full rounded-full bg-gradient-to-t from-emerald-500 to-emerald-400 transition-all duration-500"
                style={{ height: `${availabilityPercent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function TripAvailabilityCalendar({
  tripId,
  travelers,
  tripStartDate,
  tripEndDate,
}: TripAvailabilityCalendarProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [selectedStatus, setSelectedStatus] = useState<AvailabilityStatus>("yes");
  const [pendingStatuses, setPendingStatuses] = useState<Record<string, AvailabilityStatus | null>>({});
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (tripStartDate) {
      return startOfMonth(parseISO(tripStartDate));
    }
    return startOfMonth(new Date());
  });
  const updateAvailability = useMutation(api.availabilities.update);

  const currentTraveler = useMemo(
    () => travelers?.find((traveler) => traveler.isCurrentUser),
    [travelers],
  );
  const isShowingCurrentMonth = isSameMonth(currentMonth, startOfMonth(new Date()));

  useEffect(() => {
    if (!currentTraveler || Object.keys(pendingStatuses).length === 0) {
      return;
    }

    setPendingStatuses((current) => {
      let hasChanges = false;
      const next = { ...current };

      for (const [date, status] of Object.entries(current)) {
        const persistedStatus = currentTraveler.availabilities.find((entry) => entry.date === date)?.status;
        if ((persistedStatus ?? null) === status) {
          delete next[date];
          hasChanges = true;
        }
      }

      return hasChanges ? next : current;
    });
  }, [currentTraveler, pendingStatuses]);

  const travelersWithPendingStatuses = useMemo(() => {
    if (!travelers || !currentTraveler || Object.keys(pendingStatuses).length === 0) {
      return travelers;
    }

    const currentTravelerAvailability = new Map(
      currentTraveler.availabilities.map((entry) => [entry.date, entry.status]),
    );

    for (const [date, status] of Object.entries(pendingStatuses)) {
      if (status === null) {
        currentTravelerAvailability.delete(date);
        continue;
      }

      currentTravelerAvailability.set(date, status);
    }

    return travelers.map((traveler) =>
      traveler.isCurrentUser
        ? {
          ...traveler,
          availabilities: Array.from(currentTravelerAvailability, ([date, status]) => ({ date, status })),
        }
        : traveler,
    );
  }, [currentTraveler, pendingStatuses, travelers]);

  const handleDateClick = async (date: Date) => {
    if (!currentTraveler) {
      return;
    }

    const dateKey = format(date, "yyyy-MM-dd");
    const currentStatus =
      pendingStatuses[dateKey] ??
      currentTraveler.availabilities.find((entry) => entry.date === dateKey)?.status;
    const nextStatus = currentStatus === selectedStatus ? null : selectedStatus;

    startTransition(() => {
      setPendingStatuses((current) => ({
        ...current,
        [dateKey]: nextStatus,
      }));
    });

    try {
      await updateAvailability({ tripId, date: dateKey, status: selectedStatus });
    } catch (error) {
      console.error(error);
      startTransition(() => {
        setPendingStatuses((current) => {
          const next = { ...current };
          if (currentStatus) {
            next[dateKey] = currentStatus;
          } else {
            delete next[dateKey];
          }
          return next;
        });
      });
    }
  };

  const toggleViewMode = () => {
    setViewMode((current) => (current === "calendar" ? "list" : "calendar"));
  };

  return (
    <section className="trip-theme-card relative max-h-[calc(100vh-48px-16px-16px-16px)] lg:max-h-[calc(100vh-48px-16px-24px-24px)] flex h-full min-h-0 flex-col overflow-hidden rounded-4xl p-5 ">
      <div className="grid grid-cols-[1fr_auto] items-center gap-3 sm:gap-4">
        <div className="min-w-0 justify-self-start">
          <div className="flex items-center gap-2">
            {Object.entries(statusConfig).map(([status, config]) => {
              const Icon = config.icon;
              const isSelected = status === selectedStatus;

              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setSelectedStatus(status as AvailabilityStatus)}
                  aria-pressed={isSelected}
                  aria-label={config.label}
                  className={`
                    flex h-10 w-10 items-center justify-center rounded-full border transition-colors sm:h-auto sm:w-auto sm:px-3 sm:py-2
                    ${isSelected
                      ? `${config.bgClass} ${config.borderClass} ${config.textClass}`
                      : "border-white/[0.08] bg-white/[0.04] text-foreground-muted hover:border-white/[0.14] hover:text-white"}
                  `}
                >
                  <Icon className={`h-3.5 w-3.5 ${isSelected ? "opacity-85" : "opacity-58"}`} />
                  <span className="hidden sm:inline sm:pl-2 sm:text-xs sm:font-medium">
                    {config.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-w-0 justify-self-end">
          <button
            type="button"
            onClick={toggleViewMode}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-foreground-muted transition-colors hover:border-white/[0.14] hover:text-white sm:hidden"
            aria-label={viewMode === "calendar" ? "Switch to list view" : "Switch to calendar view"}
          >
            {viewMode === "calendar" ? <List className="h-4 w-4" /> : <CalendarDays className="h-4 w-4" />}
          </button>

          <div className="hidden items-center gap-1 rounded-full bg-white/[0.06] p-1 sm:flex">
            <button
              type="button"
              onClick={() => setViewMode("calendar")}
              className={`
                flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all
                ${viewMode === "calendar" ? "bg-white/[0.12] text-white" : "text-foreground-muted hover:text-white"}
              `}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Calendar
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`
                flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all
                ${viewMode === "list" ? "bg-white/[0.12] text-white" : "text-foreground-muted hover:text-white"}
              `}
            >
              <List className="h-3.5 w-3.5" />
              List
            </button>
          </div>
        </div>
      </div>

      <div className="mb-5 mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => setCurrentMonth((prev) => subMonths(prev, 1))}
          className="justify-self-start flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-foreground-muted transition-colors hover:border-white/[0.14] hover:text-white"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="min-w-36 justify-self-center text-center sm:min-w-48">
          <p className="truncate text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-white/42 sm:text-[0.78rem]">
            Availability
          </p>
          <p className="mt-1 truncate text-lg font-semibold tracking-[-0.05em] text-white sm:text-[1.55rem]">
            {format(currentMonth, "MMMM, yyyy")}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
          className="justify-self-end flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-foreground-muted transition-colors hover:border-white/[0.14] hover:text-white"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 overflow-y-auto pb-24 md:pb-28">
          {viewMode === "calendar" ? (
            <CalendarView
              travelers={travelersWithPendingStatuses}
              currentMonth={currentMonth}
              tripStartDate={tripStartDate}
              tripEndDate={tripEndDate}
              onDateClick={currentTraveler ? handleDateClick : undefined}
            />
          ) : (
            <ListView travelers={travelersWithPendingStatuses} />
          )}
        </div>

        {viewMode === "calendar" ? (
          <div className="pointer-events-none fixed inset-x-0 z-40 flex justify-center px-4" style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}>
            <button
              type="button"
              onClick={() => setCurrentMonth(startOfMonth(new Date()))}
              aria-pressed={isShowingCurrentMonth}
              className={`
                trip-glass-button trip-control-surface pointer-events-auto h-11 px-3.5 text-sm font-semibold shadow-[0_16px_36px_rgba(0,0,0,0.22)]
                ${isShowingCurrentMonth ? "border-white/20 bg-white/[0.08] text-white" : ""}
              `}
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[linear-gradient(180deg,#ffc86c,#ff9648)] text-[#2f1808] shadow-[0_8px_18px_rgba(255,150,72,0.34)]">
                <CalendarDays className="h-3.5 w-3.5" />
              </span>
              Current
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
