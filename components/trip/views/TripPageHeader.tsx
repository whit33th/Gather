import Link from "next/link";
import { CalendarDays, Home, Settings2 } from "lucide-react";

import UserAvatar from "@/components/UserAvatar";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

import type { AvailabilityMember } from "../types";
import type { TripView } from "../view";
import { getTripViewHref } from "../view";
import TripShareButton from "./TripShareButton";

export default function TripPageHeader({
  currentView,
  travelers,
  tripId,
}: {
  currentView: TripView;
  travelers: AvailabilityMember[];
  tripId: Id<"trips">;
}) {
  const headerTravelers = travelers.slice(0, 3);
  const hiddenTravelerCount = Math.max(travelers.length - headerTravelers.length, 0);

  return (
    <header className="sticky top-4 z-30 flex flex-wrap items-center justify-between gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
        <Link
          href={getTripViewHref(tripId, "board")}
          className={cn(
            "trip-glass-button trip-control-surface flex h-12 w-12 items-center justify-center px-0 text-sm",
            currentView === "board" &&
            "trip-header-button-active border-white/24 bg-white/[0.14] text-white",
          )}
          aria-label="Open trip dashboard"
        >
          <Home className="h-4 w-4" />
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <Link
          href={getTripViewHref(tripId, "people")}
          className={cn(
            "trip-glass-button trip-control-surface h-11 p-2 text-sm",
            currentView === "people" &&
            "trip-header-button-active border-white/24 bg-white/[0.14] text-white",
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
        </Link>

        <Link
          href={getTripViewHref(tripId, "calendar")}
          className={cn(
            "trip-glass-icon-button trip-control-surface",
            currentView === "calendar" &&
            "trip-header-button-active border-white/24 bg-white/[0.14] text-white",
          )}
          aria-label="Open calendar"
        >
          <CalendarDays className="h-4 w-4" />
        </Link>

        <Link
          href={getTripViewHref(tripId, "settings")}
          className={cn(
            "trip-glass-icon-button trip-control-surface",
            currentView === "settings" &&
            "trip-header-button-active border-white/24 bg-white/[0.14] text-white",
          )}
          aria-label="Open trip settings"
        >
          <Settings2 className="h-4 w-4" />
        </Link>

        <TripShareButton tripId={tripId} />
      </div>
    </header>
  );
}
