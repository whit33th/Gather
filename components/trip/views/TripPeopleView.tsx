"use client";

import Link from "next/link";
import { useMutation, usePreloadedQuery } from "convex/react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { format } from "date-fns";
import { ChevronDown, LogOut, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import UserAvatar from "@/components/UserAvatar";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import type { TripPagePreloadedData } from "../preloaded";
import type { TripMemberRosterItem } from "../types";
import { getTripPersonHref } from "../view";

const sortOptions = [
  { id: "name", label: "Name" },
  { id: "availability", label: "Availability" },
  { id: "contributions", label: "Contributions" },
  { id: "countries", label: "Countries" },
  { id: "joined", label: "Recently joined" },
] as const;

type SortKey = (typeof sortOptions)[number]["id"];

function toPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value * 100)));
}

function getSortedRoster(roster: TripMemberRosterItem[], sortBy: SortKey) {
  const collator = new Intl.Collator("en", { sensitivity: "base" });

  return [...roster].sort((left, right) => {
    if (left.isCurrentUser !== right.isCurrentUser) {
      return left.isCurrentUser ? -1 : 1;
    }

    if (sortBy === "availability") {
      return (
        right.availabilityCoverage - left.availabilityCoverage ||
        collator.compare(left.name, right.name)
      );
    }

    if (sortBy === "contributions") {
      return (
        right.contributionCount - left.contributionCount ||
        collator.compare(left.name, right.name)
      );
    }

    if (sortBy === "countries") {
      return right.countryCount - left.countryCount || collator.compare(left.name, right.name);
    }

    if (sortBy === "joined") {
      return right.joinedAt - left.joinedAt || collator.compare(left.name, right.name);
    }

    if (left.role !== right.role) {
      return left.role === "owner" ? -1 : 1;
    }

    return collator.compare(left.name, right.name);
  });
}

function buildSecondaryLine(member: TripMemberRosterItem) {
  if (member.contributionCount > 0) {
    return `${toPercent(member.availabilityCoverage)}% availability filled / ${member.proposalCount} spots / ${member.photoCount} photos / ${member.songCount} tracks`;
  }

  return `${toPercent(member.availabilityCoverage)}% availability filled / joined ${format(member.joinedAt, "MMM yyyy")}`;
}

export default function TripPeopleView({
  preloaded,
  tripId,
}: {
  preloaded: TripPagePreloadedData;
  tripId: Id<"trips">;
}) {
  const initialRoster = usePreloadedQuery(preloaded.memberRoster) as TripMemberRosterItem[];
  const liveRoster = useQuery(api.members.roster, { tripId }) as TripMemberRosterItem[] | undefined;
  const roster = liveRoster ?? initialRoster;
  const removeFromTrip = useMutation(api.members.removeFromTrip);

  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [pendingMemberId, setPendingMemberId] = useState<string | null>(null);

  const currentViewer = roster.find((member) => member.isCurrentUser) ?? null;
  const sortedRoster = useMemo(() => getSortedRoster(roster, sortBy), [roster, sortBy]);

  const handleRemove = async (member: TripMemberRosterItem) => {
    const actionLabel = member.isCurrentUser
      ? "leave this trip"
      : `remove ${member.name} from this trip`;
    const confirmed =
      typeof window === "undefined" ? false : window.confirm(`Do you want to ${actionLabel}?`);

    if (!confirmed) {
      return;
    }

    try {
      setPendingMemberId(member.memberId);
      await removeFromTrip({
        tripId,
        memberId: member.memberId as Id<"members">,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setPendingMemberId(null);
    }
  };

  return (
    <section className="trip-theme-card rounded-[2rem] p-4 sm:p-5 xl:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-kicker">People</p>
          <h1 className="mt-3 text-[2rem] font-semibold tracking-[-0.06em] text-white sm:text-[2.6rem]">
            Trip roster
          </h1>
        </div>

        <label className="inline-flex w-full items-center gap-3 rounded-full border border-[color:var(--trip-card-border)] bg-[color:var(--trip-card-subsurface-solid)] px-4 py-3 text-sm text-white sm:w-auto">
          <span className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[color:var(--trip-card-muted-text)]">
            Sort
          </span>
          <div className="relative min-w-[11rem]">
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortKey)}
              className="w-full appearance-none bg-transparent pr-7 text-sm text-white outline-none"
            >
              {sortOptions.map((option) => (
                <option key={option.id} value={option.id} className="bg-[#0b1713] text-white">
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--trip-card-muted-text)]" />
          </div>
        </label>
      </div>

      <div className="mt-6 space-y-3">
        {sortedRoster.map((member) => {
          const canRemoveOther =
            currentViewer?.role === "owner" && !member.isCurrentUser && member.role !== "owner";
          const canLeave = member.isCurrentUser && member.role !== "owner";
          const canShowDelete = canRemoveOther || canLeave;
          const isPending = pendingMemberId === member.memberId;

          return (
            <article
              key={member.memberId}
              className="people-card-row rounded-[1.6rem] border border-[color:var(--trip-card-border)] bg-[color:var(--trip-card-subsurface-solid)] px-4 py-4 sm:px-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-4">
                    <Link
                      href={getTripPersonHref(tripId, member.memberId)}
                      className="shrink-0 transition-transform duration-200 hover:scale-[1.03]"
                      aria-label={`Open ${member.name} profile`}
                    >
                      <UserAvatar
                        name={member.name}
                        image={member.image}
                        seed={member.userId}
                        size={56}
                      />
                    </Link>

                    <div className="min-w-0 flex-1">
                      <div>
                        <Link
                          href={getTripPersonHref(tripId, member.memberId)}
                          className="truncate text-lg font-semibold tracking-[-0.04em] text-white transition-colors hover:text-[color:var(--accent-strong)]"
                        >
                          {member.name}
                        </Link>
                      </div>

                      <p className="mt-2 text-sm text-[color:var(--trip-card-muted-text)]">
                        {member.isCurrentUser
                          ? `You / ${member.role}`
                          : member.role}
                      </p>
                      <p className="mt-1 text-sm text-[color:var(--trip-card-muted-text)]">
                        {buildSecondaryLine(member)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end lg:self-start">
                  <div className="trip-theme-muted rounded-[1rem] px-3 py-2 text-right">
                    <p className="text-[0.54rem] uppercase tracking-[0.14em] text-white/42">
                      Filled
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {toPercent(member.availabilityCoverage)}%
                    </p>
                  </div>

                  {canShowDelete ? (
                    <button
                      type="button"
                      onClick={() => void handleRemove(member)}
                      disabled={isPending}
                      className="trip-theme-chip inline-flex h-11 items-center justify-center gap-2 rounded-[1rem] border px-4 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[#f2c9c9] transition-colors hover:border-[#f2c9c9]/30 hover:bg-[#f2c9c9]/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {member.isCurrentUser ? (
                        <LogOut className="h-4 w-4" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      {member.isCurrentUser ? "Leave" : "Delete"}
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}

        {sortedRoster.length === 0 ? (
          <div className="trip-theme-subsurface rounded-[1.6rem] border border-dashed border-[color:var(--trip-card-border)] px-5 py-8 text-center">
            <p className="text-base font-medium text-white">No people yet</p>
            <p className="mt-2 text-sm text-[color:var(--trip-card-muted-text)]">
              Once members join, they will appear here as a single clean list.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
