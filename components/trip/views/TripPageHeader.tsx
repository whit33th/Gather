import Link from "next/link";
import { CalendarDays, LayoutGrid, Settings2, Users } from "lucide-react";

import UserAvatar from "@/components/UserAvatar";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

import type { AvailabilityMember } from "../types";
import type { TripView } from "../view";
import { getTripViewHref } from "../view";
import TripShareButton from "./TripShareButton";

const navItems = [
  {
    view: "board" as const,
    label: "Board",
    icon: LayoutGrid,
  },
  {
    view: "people" as const,
    label: "People",
    icon: Users,
  },
  {
    view: "calendar" as const,
    label: "Calendar",
    icon: CalendarDays,
  },
  {
    view: "settings" as const,
    label: "Settings",
    icon: Settings2,
  },
];

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
    <header className="sticky top-4 z-30">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <nav aria-label="Trip sections" className="flex flex-wrap gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentView === item.view;

            return (
              <Link
                key={item.view}
                href={getTripViewHref(tripId, item.view)}
                className={cn(
                  "inline-flex min-h-11 trip-glass-button items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition",
                  active
                    ? "border-white/28 bg-white/[0.14] text-white"
                    : "border-white/10 bg-white/[0.04] text-white/68 hover:border-white/18 hover:bg-white/[0.08] hover:text-white",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex min-h-11 items-center gap-3 trip-glass-button rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/72">
            <div className="flex items-center">
              {headerTravelers.map((traveler, index) => (
                <span
                  key={traveler.memberId}
                  className={index === 0 ? "" : "-ml-2"}
                >
                  <UserAvatar
                    name={traveler.name}
                    image={traveler.image}
                    seed={traveler.userId}
                    size={30}
                  />
                </span>
              ))}
            </div>
            <span>
              {travelers.length} traveler{travelers.length === 1 ? "" : "s"}
              {hiddenTravelerCount > 0 ? ` (+${hiddenTravelerCount})` : ""}
            </span>
          </div>

          <TripShareButton
            tripId={tripId}
            label="Invite friends"
            copiedLabel="Invite link copied"
          />
        </div>
      </div>
    </header>
  );
}
