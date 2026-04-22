"use client";

import Link from "next/link";
import type { Preloaded } from "convex/react";
import { usePreloadedQuery } from "convex/react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { format, parseISO } from "date-fns";
import { motion } from "motion/react";
import Image from "next/image";
import {
  ArrowLeft,
  Camera,
  Coins,
  Globe2,
  MapPinned,
  Music4,
  Sparkles,
} from "lucide-react";

import AppState from "@/components/AppState";
import UserAvatar from "@/components/UserAvatar";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import type { TripMemberProfile } from "../types";
import { getTripViewHref } from "../view";

const availabilityTone = {
  yes: "border-emerald-400/30 bg-emerald-400/16 text-emerald-100",
  maybe: "border-amber-400/30 bg-amber-400/16 text-amber-100",
  no: "border-rose-400/30 bg-rose-400/16 text-rose-100",
  none: "border-[color:var(--trip-card-border)] bg-[color:var(--trip-card-subsurface-solid)] text-[color:var(--trip-card-muted-text)]",
} as const;

function toPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value * 100)));
}

function getProfileSignal(profile: TripMemberProfile) {
  if (profile.contributionCount > 0 && profile.countryCount > 1) {
    return `${profile.name} keeps this trip moving and already has a broader travel footprint across ${profile.countryCount} countries.`;
  }

  if (profile.contributionCount > 0) {
    return `${profile.name} is actively contributing to this trip with shared places, photos, music, or expenses.`;
  }

  return `${profile.name} is part of the crew. This page keeps the useful trip signals in one place without turning it into a bio page.`;
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

  return (
    <div className="space-y-5">
      <Link
        href={getTripViewHref(tripId, "people")}
        className="editorial-button-ghost inline-flex px-0 py-0 text-[0.66rem]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to people
      </Link>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="trip-theme-card relative overflow-hidden rounded-[2rem] px-5 py-8 sm:px-6 sm:py-10"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(219,232,135,0.18),transparent_20rem),radial-gradient(circle_at_20%_25%,rgba(255,255,255,0.07),transparent_18rem),radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.06),transparent_18rem)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent)]" />

        <div className="relative flex flex-col items-center text-center">
          <p className="section-kicker">Traveler profile</p>

          <div className="relative mt-8">
            <div className="absolute inset-0 scale-[1.9] rounded-full bg-[radial-gradient(circle,rgba(219,232,135,0.34),rgba(219,232,135,0.08)_42%,transparent_70%)] blur-2xl" />
            <div className="absolute inset-[-18px] rounded-full border border-white/10" />
            <div className="absolute inset-[-34px] rounded-full border border-white/6" />
            <div className="relative rounded-full border border-white/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-3 shadow-[0_28px_80px_rgba(0,0,0,0.34)]">
              <UserAvatar
                name={profile.name}
                image={profile.image}
                seed={profile.userId}
                size={126}
                className="ring-1 ring-white/10"
              />
            </div>
          </div>

          <h1 className="mt-8 max-w-4xl text-[2.6rem] font-semibold tracking-[-0.08em] text-white sm:text-[4rem]">
            {profile.name}
          </h1>

          <p className="mt-4 text-sm text-[color:var(--trip-card-muted-text)]">
            {profile.isCurrentUser ? "You" : profile.role} / joined {format(profile.joinedAt, "MMM yyyy")}
          </p>

          <p className="mt-5 max-w-3xl text-sm leading-6 text-[color:var(--trip-card-muted-text)] sm:text-base">
            {getProfileSignal(profile)}
          </p>

          <div className="mt-8 w-full max-w-3xl rounded-[1.5rem] border border-[color:var(--trip-card-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-4 py-4 text-left sm:px-5">
            <p className="text-[0.58rem] uppercase tracking-[0.16em] text-white/42">
              Current trip
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <p className="truncate text-xl font-semibold tracking-[-0.04em] text-white">
                  {profile.currentTrip.title}
                </p>
                <p className="mt-1 truncate text-sm text-[color:var(--trip-card-muted-text)]">
                  {profile.currentTrip.destination}
                </p>
              </div>
              <p className="text-[0.68rem] uppercase tracking-[0.16em] text-[color:var(--trip-card-muted-text)]">
                {profile.currentTrip.startDate} to {profile.currentTrip.endDate}
              </p>
            </div>
          </div>

          <div className="mt-8 grid w-full gap-3 md:grid-cols-2 xl:grid-cols-4">
            <article className="trip-theme-muted rounded-[1.35rem] px-4 py-4">
              <p className="text-[0.58rem] uppercase tracking-[0.16em] text-white/42">Coverage</p>
              <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">
                {toPercent(profile.availabilityCoverage)}%
              </p>
              <p className="mt-2 text-sm text-[color:var(--trip-card-muted-text)]">
                {profile.availabilityCount} of {profile.currentTrip.totalDates} dates marked
              </p>
            </article>
            <article className="trip-theme-muted rounded-[1.35rem] px-4 py-4">
              <p className="text-[0.58rem] uppercase tracking-[0.16em] text-white/42">Shared</p>
              <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">
                {profile.contributionCount}
              </p>
              <p className="mt-2 text-sm text-[color:var(--trip-card-muted-text)]">
                proposals, photos, tracks, and expenses
              </p>
            </article>
            <article className="trip-theme-muted rounded-[1.35rem] px-4 py-4">
              <p className="text-[0.58rem] uppercase tracking-[0.16em] text-white/42">Trips</p>
              <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">
                {profile.tripCount}
              </p>
              <p className="mt-2 text-sm text-[color:var(--trip-card-muted-text)]">
                joined with this account
              </p>
            </article>
            <article className="trip-theme-muted rounded-[1.35rem] px-4 py-4">
              <p className="text-[0.58rem] uppercase tracking-[0.16em] text-white/42">
                Countries
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">
                {profile.countryCount}
              </p>
              <p className="mt-2 text-sm text-[color:var(--trip-card-muted-text)]">
                inferred from trip destinations
              </p>
            </article>
          </div>
        </div>
      </motion.section>

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
        <section className="trip-theme-subsurface rounded-[1.8rem] border border-[color:var(--trip-card-border)] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="section-kicker">Contribution</p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.05em] text-white">
                Current trip output
              </h2>
            </div>
            <span className="trip-theme-chip inline-flex h-10 w-10 items-center justify-center rounded-full">
              <Sparkles className="h-4 w-4" />
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <article className="trip-theme-muted rounded-[1.25rem] px-4 py-4">
              <div className="flex items-center gap-3">
                <MapPinned className="h-4 w-4 text-[color:var(--accent)]" />
                <p className="text-sm font-medium text-white">Places added</p>
              </div>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-white">
                {profile.proposalCount}
              </p>
            </article>
            <article className="trip-theme-muted rounded-[1.25rem] px-4 py-4">
              <div className="flex items-center gap-3">
                <Camera className="h-4 w-4 text-[color:var(--accent)]" />
                <p className="text-sm font-medium text-white">Photos shared</p>
              </div>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-white">
                {profile.photoCount}
              </p>
            </article>
            <article className="trip-theme-muted rounded-[1.25rem] px-4 py-4">
              <div className="flex items-center gap-3">
                <Music4 className="h-4 w-4 text-[color:var(--accent)]" />
                <p className="text-sm font-medium text-white">Tracks added</p>
              </div>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-white">
                {profile.songCount}
              </p>
            </article>
            <article className="trip-theme-muted rounded-[1.25rem] px-4 py-4">
              <div className="flex items-center gap-3">
                <Coins className="h-4 w-4 text-[color:var(--accent)]" />
                <p className="text-sm font-medium text-white">Expenses covered</p>
              </div>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-white">
                {profile.expenseCount}
              </p>
              <p className="mt-2 text-sm text-[color:var(--trip-card-muted-text)]">
                EUR {profile.expenseTotal.toFixed(0)}
              </p>
            </article>
          </div>

          {profile.gallery.length > 0 ? (
            <div className="mt-5">
              <p className="text-[0.58rem] uppercase tracking-[0.16em] text-white/42">
                Recent uploads
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {profile.gallery.map((item) => (
                  <div
                    key={item.id}
                    className="relative aspect-[4/5] overflow-hidden rounded-[1.2rem] bg-[color:var(--trip-card-subsurface-solid)]"
                  >
                    <Image
                      src={item.url}
                      alt={profile.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section className="trip-theme-subsurface rounded-[1.8rem] border border-[color:var(--trip-card-border)] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="section-kicker">Availability</p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.05em] text-white">
                Current trip rhythm
              </h2>
            </div>
            <span className="trip-theme-chip inline-flex h-10 w-10 items-center justify-center rounded-full">
              <Globe2 className="h-4 w-4" />
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {profile.availability.map((entry) => {
              const tone =
                entry.status === null ? availabilityTone.none : availabilityTone[entry.status];

              return (
                <article
                  key={entry.date}
                  className={`rounded-[1.15rem] border px-3 py-3 ${tone}`}
                >
                  <p className="text-[0.58rem] uppercase tracking-[0.16em] opacity-70">
                    {format(parseISO(entry.date), "EEE")}
                  </p>
                  <p className="mt-2 text-base font-semibold">
                    {format(parseISO(entry.date), "d MMM")}
                  </p>
                  <p className="mt-2 text-[0.62rem] uppercase tracking-[0.14em]">
                    {entry.status ?? "open"}
                  </p>
                </article>
              );
            })}
          </div>
        </section>
      </div>

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <section className="trip-theme-subsurface rounded-[1.8rem] border border-[color:var(--trip-card-border)] p-5 sm:p-6">
          <p className="section-kicker">Countries</p>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.05em] text-white">
            Travel footprint
          </h2>

          <div className="mt-5 flex flex-wrap gap-2">
            {profile.visitedCountries.length > 0 ? (
              profile.visitedCountries.map((country) => (
                <span
                  key={country}
                  className="trip-theme-chip rounded-full px-3 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em]"
                >
                  {country}
                </span>
              ))
            ) : (
              <p className="text-sm text-[color:var(--trip-card-muted-text)]">
                No country-level data yet. It appears automatically as trips get destinations.
              </p>
            )}
          </div>
        </section>

        <section className="trip-theme-subsurface rounded-[1.8rem] border border-[color:var(--trip-card-border)] p-5 sm:p-6">
          <p className="section-kicker">Trip history</p>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.05em] text-white">
            Joined trips
          </h2>

          <div className="mt-5 space-y-3">
            {profile.visitedTrips.map((trip) => (
              <article
                key={trip.tripId}
                className="trip-theme-muted rounded-[1.25rem] px-4 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{trip.title}</p>
                    <p className="mt-1 truncate text-sm text-[color:var(--trip-card-muted-text)]">
                      {trip.destination}
                    </p>
                  </div>
                  <span className="trip-theme-chip rounded-full px-2.5 py-1.5 text-[0.54rem] font-semibold uppercase tracking-[0.14em]">
                    {trip.role}
                  </span>
                </div>
                <p className="mt-3 text-[0.68rem] uppercase tracking-[0.16em] text-[color:var(--trip-card-muted-text)]">
                  {trip.startDate} to {trip.endDate}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
