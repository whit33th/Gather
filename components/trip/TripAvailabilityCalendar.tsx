"use client";

import { useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  format,
  getDay,
  isSameDay,
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
  travelers: AvailabilityMember[] | undefined;
  tripStartDate?: string;
  tripEndDate?: string;
  onDateClick?: (date: Date) => void;
};

type ViewMode = "calendar" | "list";

const statusConfig = {
  yes: {
    icon: Check,
    bgClass: "bg-emerald-500/20",
    borderClass: "border-emerald-500/30",
    textClass: "text-emerald-400",
    label: "Available",
  },
  no: {
    icon: CircleSlash,
    bgClass: "bg-rose-500/20",
    borderClass: "border-rose-500/30",
    textClass: "text-rose-400",
    label: "Unavailable",
  },
  maybe: {
    icon: HelpCircle,
    bgClass: "bg-amber-500/20",
    borderClass: "border-amber-500/30",
    textClass: "text-amber-400",
    label: "Maybe",
  },
} as const;

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
}: {
  date: Date;
  currentMonth: Date;
  travelers: AvailabilityMember[] | undefined;
  tripStartDate?: string;
  tripEndDate?: string;
  onDateClick?: (date: Date) => void;
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
    if (!travelers) return { yes: [], no: [], maybe: [] };

    const result: { yes: AvailabilityMember[]; no: AvailabilityMember[]; maybe: AvailabilityMember[] } = {
      yes: [],
      no: [],
      maybe: [],
    };

    for (const traveler of travelers) {
      const entry = traveler.availabilities.find((a) => a.date === dateKey);
      if (entry) {
        result[entry.status].push(traveler);
      }
    }

    return result;
  }, [travelers, dateKey]);

  const totalResponses = dayAvailability.yes.length + dayAvailability.no.length + dayAvailability.maybe.length;
  const hasAvailability = totalResponses > 0;

  const dominantStatus: AvailabilityStatus | null = useMemo(() => {
    if (!hasAvailability) return null;
    if (dayAvailability.yes.length >= dayAvailability.no.length && dayAvailability.yes.length >= dayAvailability.maybe.length) {
      return "yes";
    }
    if (dayAvailability.no.length >= dayAvailability.maybe.length) {
      return "no";
    }
    return "maybe";
  }, [dayAvailability, hasAvailability]);

  const config = dominantStatus ? statusConfig[dominantStatus] : null;
  const StatusIcon = config?.icon;

  return (
    <button
      type="button"
      onClick={() => onDateClick?.(date)}
      className={`
        group relative flex aspect-square flex-col items-center justify-center rounded-2xl border transition-all duration-200
        ${isCurrentMonth ? "opacity-100" : "opacity-30"}
        ${isInTripRange ? "border-accent/20 bg-accent/[0.06]" : "border-transparent"}
        ${hasAvailability && config ? `${config.bgClass} ${config.borderClass}` : "hover:bg-white/[0.04]"}
        ${isCurrentDay ? "ring-2 ring-accent/40 ring-offset-1 ring-offset-background" : ""}
      `}
      disabled={!isCurrentMonth}
    >
      {hasAvailability && StatusIcon && (
        <div className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full ${config?.bgClass}`}>
          <StatusIcon className={`h-3.5 w-3.5 ${config?.textClass}`} />
        </div>
      )}

      <span
        className={`
          text-sm font-medium tabular-nums
          ${isCurrentDay ? "text-accent" : isCurrentMonth ? "text-white" : "text-white/40"}
        `}
      >
        {format(date, "d")}
      </span>

      {hasAvailability && (
        <div className="absolute -bottom-0.5 left-1/2 flex -translate-x-1/2 gap-0.5">
          {dayAvailability.yes.slice(0, 3).map((member) => (
            <div
              key={member.userId}
              className="h-1.5 w-1.5 rounded-full bg-emerald-400"
              title={member.name}
            />
          ))}
          {dayAvailability.maybe.slice(0, 2).map((member) => (
            <div
              key={member.userId}
              className="h-1.5 w-1.5 rounded-full bg-amber-400"
              title={member.name}
            />
          ))}
        </div>
      )}
    </button>
  );
}

function CalendarView({
  travelers,
  tripStartDate,
  tripEndDate,
  onDateClick,
}: {
  travelers: AvailabilityMember[] | undefined;
  tripStartDate?: string;
  tripEndDate?: string;
  onDateClick?: (date: Date) => void;
}) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (tripStartDate) {
      return startOfMonth(parseISO(tripStartDate));
    }
    return startOfMonth(new Date());
  });

  const weeks = useMemo(() => getWeeksInMonth(currentMonth), [currentMonth]);

  const totalAvailable = useMemo(() => {
    if (!travelers) return 0;
    return travelers.filter((t) => t.availabilities.some((a) => a.status === "yes")).length;
  }, [travelers]);

  const weekdayLabels = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="mb-6 flex flex-col items-center">
        <p className="text-sm font-medium text-foreground-muted">
          {format(currentMonth, "MMMM, yyyy")}
        </p>
        <h2 className="mt-1 text-4xl font-bold tracking-tight text-white">
          {totalAvailable} available
        </h2>
        <div className="mt-2 flex items-center gap-2 rounded-full bg-white/[0.06] px-3 py-1.5">
          <Users className="h-3.5 w-3.5 text-foreground-muted" />
          <span className="text-sm text-foreground-muted">
            {travelers?.length || 0} travelers
          </span>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="mb-4 flex items-center justify-between px-2">
        <button
          type="button"
          onClick={() => setCurrentMonth((prev) => subMonths(prev, 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full text-foreground-muted transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setCurrentMonth(startOfMonth(new Date()))}
          className="flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-foreground-muted transition-colors hover:bg-white/[0.08] hover:text-white"
        >
          <CalendarDays className="h-3 w-3" />
          Current
        </button>
        <button
          type="button"
          onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full text-foreground-muted transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="mb-2 grid grid-cols-7 gap-1 px-1">
        {weekdayLabels.map((label, idx) => (
          <div
            key={idx}
            className="py-2 text-center text-xs font-semibold uppercase tracking-wider text-foreground-muted"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 px-1">
        {weeks.flat().map((date, idx) => (
          <CalendarDateCell
            key={idx}
            date={date}
            currentMonth={currentMonth}
            travelers={travelers}
            tripStartDate={tripStartDate}
            tripEndDate={tripEndDate}
            onDateClick={onDateClick}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
        {Object.entries(statusConfig).map(([status, config]) => {
          const Icon = config.icon;
          return (
            <div key={status} className="flex items-center gap-1.5">
              <div className={`flex h-5 w-5 items-center justify-center rounded-full ${config.bgClass}`}>
                <Icon className={`h-3 w-3 ${config.textClass}`} />
              </div>
              <span className="text-xs text-foreground-muted">{config.label}</span>
            </div>
          );
        })}
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
  travelers,
  tripStartDate,
  tripEndDate,
  onDateClick,
}: TripAvailabilityCalendarProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");

  return (
    <section className="trip-theme-card flex h-full flex-col rounded-4xl p-5">
      {/* View Toggle */}
      <div className="mb-5 flex items-center justify-center">
        <div className="flex items-center gap-1 rounded-full bg-white/[0.06] p-1">
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {viewMode === "calendar" ? (
          <CalendarView
            travelers={travelers}
            tripStartDate={tripStartDate}
            tripEndDate={tripEndDate}
            onDateClick={onDateClick}
          />
        ) : (
          <ListView travelers={travelers} />
        )}
      </div>
    </section>
  );
}
