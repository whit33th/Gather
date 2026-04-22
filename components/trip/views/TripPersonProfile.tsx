"use client";

import Link from "next/link";
import type { Preloaded } from "convex/react";
import { usePreloadedQuery } from "convex/react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { motion } from "motion/react";
import { ArrowLeft, MapPinHouse, Plane, Sparkles, TentTree } from "lucide-react";

import AppState from "@/components/AppState";
import UserAvatar from "@/components/UserAvatar";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import type { TripMemberProfile } from "../types";
import { getTripViewHref } from "../view";

const cityPalette = [
  {
    border: "border-[#ff5a5f]/35",
    background: "bg-[#ff5a5f]/10",
    text: "text-[#ffb1b4]",
    icon: MapPinHouse,
  },
  {
    border: "border-[#ff7a59]/35",
    background: "bg-[#ff7a59]/10",
    text: "text-[#ffc2b2]",
    icon: Plane,
  },
  {
    border: "border-[#00a699]/35",
    background: "bg-[#00a699]/10",
    text: "text-[#9aefe8]",
    icon: TentTree,
  },
  {
    border: "border-[#6c8cff]/35",
    background: "bg-[#6c8cff]/10",
    text: "text-[#c3d0ff]",
    icon: Sparkles,
  },
];

function getCityLabel(destination: string) {
  const [firstSegment] = destination.split(",");
  const firstWord = firstSegment?.trim().split(/\s+/)[0];
  return firstWord || destination.trim() || "Trip";
}

export default function TripPersonProfile({
  preloadedProfile,
  tripId,
  memberId,
}: {
  preloadedProfile: Preloaded<typeof api.members.profile>;
  tripId: Id<"trips">;
  memberId: Id<"members">;
}) {
  const initialProfile = usePreloadedQuery(preloadedProfile) as TripMemberProfile | null;
  const liveProfile = useQuery(api.members.profile, { tripId, memberId }) as
    | TripMemberProfile
    | null
    | undefined;
  const profile = liveProfile ?? initialProfile;

  if (profile === null) {
    return (
      <AppState
        eyebrow="Profile unavailable"
        title="This traveler is not available in the current trip."
        description="They may have left the trip, or the link points to an old member record."
        className="min-h-[70vh]"
      />
    );
  }

  const trips = profile.visitedTrips;

  return (
    <div className="space-y-6">
      <Link
        href={getTripViewHref(tripId, "people")}
        className="editorial-button-ghost inline-flex px-0 py-0 text-[0.66rem]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] px-5 py-10 text-center backdrop-blur-2xl sm:px-6 sm:py-12"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_16rem),radial-gradient(circle_at_center,rgba(255,90,95,0.08),transparent_26rem)]" />

        <div className="relative flex flex-col items-center">
          <div className="relative">
            <div className="absolute inset-0 scale-[1.9] rounded-full bg-[radial-gradient(circle,rgba(255,90,95,0.28),rgba(255,90,95,0.08)_44%,transparent_72%)] blur-2xl" />
            <div className="absolute inset-[-18px] rounded-full border border-white/10" />
            <div className="absolute inset-[-34px] rounded-full border border-white/6" />
            <div className="relative rounded-full border border-white/12 bg-white/[0.04] p-3 shadow-[0_24px_70px_rgba(0,0,0,0.3)]">
              <UserAvatar
                name={profile.name}
                image={profile.image}
                seed={profile.userId}
                size={130}
                className="ring-1 ring-white/10"
              />
            </div>
          </div>

          <h1 className="mt-8 text-[2.7rem] font-semibold tracking-[-0.08em] text-white sm:text-[4.2rem]">
            {profile.name}
          </h1>
        </div>
      </motion.section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {trips.map((trip, index) => {
          const palette = cityPalette[index % cityPalette.length];
          const Icon = palette.icon;

          return (
            <div
              key={trip.tripId}
              className={`flex min-h-[10rem] flex-col items-center justify-center rounded-[1.8rem] border px-5 py-5 text-center ${palette.border} ${palette.background}`}
            >
              <span className={`inline-flex h-11 w-11 items-center justify-center rounded-full border ${palette.border} ${palette.text}`}>
                <Icon className="h-4.5 w-4.5" />
              </span>
              <p className={`mt-5 text-[1.7rem] font-semibold tracking-[-0.06em] ${palette.text}`}>
                {getCityLabel(trip.destination)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
