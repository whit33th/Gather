"use client";

import { usePreloadedQuery } from "convex/react";
import { useQuery } from "convex-helpers/react/cache/hooks";

import UserAvatar from "@/components/UserAvatar";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import type { TripPagePreloadedData } from "../preloaded";
import type { AvailabilityMember } from "../types";

export default function TripPeopleView({
  preloaded,
  tripId,
}: {
  preloaded: TripPagePreloadedData;
  tripId: Id<"trips">;
}) {
  const initialTravelers = usePreloadedQuery(preloaded.travelers) as AvailabilityMember[];
  const liveTravelers = useQuery(api.availabilities.list, { tripId }) as
    | AvailabilityMember[]
    | undefined;
  const travelers = liveTravelers ?? initialTravelers;
  const ownerCount = travelers.filter((traveler) => traveler.role === "owner").length;

  return (
    <section className="trip-theme-card rounded-4xl p-6 sm:p-7">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm uppercase tracking-[0.18em] text-white/42">People</p>
          <h1 className="mt-3 text-[2rem] font-semibold tracking-[-0.06em] text-white sm:text-[2.7rem]">
            Everyone on this trip
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#9fb0a3] sm:text-base">
            Full-screen roster for the shared notebook. Keep this view focused on members,
            roles, and sync status instead of splitting the page with chat.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <article className="trip-theme-muted rounded-3xl px-4 py-4">
            <p className="text-[0.65rem] uppercase tracking-[0.18em] text-white/42">
              Travelers
            </p>
            <p className="mt-3 text-[1.8rem] font-semibold tracking-[-0.06em] text-white">
              {travelers.length}
            </p>
          </article>
          <article className="trip-theme-muted rounded-3xl px-4 py-4">
            <p className="text-[0.65rem] uppercase tracking-[0.18em] text-white/42">Owners</p>
            <p className="mt-3 text-[1.8rem] font-semibold tracking-[-0.06em] text-white">
              {ownerCount}
            </p>
          </article>
          <article className="trip-theme-muted col-span-2 rounded-3xl px-4 py-4 sm:col-span-1">
            <p className="text-[0.65rem] uppercase tracking-[0.18em] text-white/42">
              Synced
            </p>
            <p className="mt-3 text-[1.8rem] font-semibold tracking-[-0.06em] text-white">
              {travelers.length > 0 ? "Live" : "Pending"}
            </p>
          </article>
        </div>
      </div>

      {travelers.length > 0 ? (
        <div className="mt-8 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {travelers.map((traveler) => (
            <article key={traveler.memberId} className="trip-theme-card rounded-[28px] p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                  <UserAvatar
                    name={traveler.name}
                    image={traveler.image}
                    seed={traveler.userId}
                    size={52}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-lg font-medium text-white">{traveler.name}</p>
                    <p className="mt-1 text-sm text-white/46">
                      {traveler.isCurrentUser ? "You" : traveler.role || "member"}
                    </p>
                  </div>
                </div>

                <span className="trip-theme-chip rounded-full px-3 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em]">
                  {traveler.role}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="trip-theme-muted rounded-[20px] px-4 py-3">
                  <p className="text-[0.62rem] uppercase tracking-[0.16em] text-white/42">
                    Availability
                  </p>
                  <p className="mt-2 text-sm font-medium text-white">
                    {traveler.availabilities.length} days marked
                  </p>
                </div>
                <div className="trip-theme-muted rounded-[20px] px-4 py-3">
                  <p className="text-[0.62rem] uppercase tracking-[0.16em] text-white/42">
                    Presence
                  </p>
                  <p className="mt-2 text-sm font-medium text-white">
                    {traveler.isCurrentUser ? "Current account" : "Shared member"}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="trip-theme-subsurface-solid mt-8 rounded-[28px] border border-dashed px-5 py-6">
          <p className="text-base font-medium text-white">No people synced yet</p>
          <p className="mt-2 text-sm leading-6 text-[#9fb0a3]">
            Once members join this trip, the roster will fill the whole view instead of
            opening chat.
          </p>
        </div>
      )}
    </section>
  );
}
