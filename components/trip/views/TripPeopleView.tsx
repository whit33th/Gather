"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation, usePreloadedQuery } from "convex/react";
import { Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDeferredValue, useMemo, useState } from "react";

import UserAvatar from "@/components/UserAvatar";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import type { TripPagePreloadedData } from "../preloaded";
import type { TripMemberRosterItem } from "../types";
import { getTripPersonHref } from "../view";

function getSortedRoster(roster: TripMemberRosterItem[]) {
  const collator = new Intl.Collator("en", { sensitivity: "base" });

  return [...roster].sort((left, right) => {
    if (left.isCurrentUser !== right.isCurrentUser) {
      return left.isCurrentUser ? -1 : 1;
    }

    if (left.role !== right.role) {
      return left.role === "owner" ? -1 : 1;
    }

    return collator.compare(left.name, right.name);
  });
}

export default function TripPeopleView({
  preloaded,
  tripId,
}: {
  preloaded: TripPagePreloadedData;
  tripId: Id<"trips">;
}) {
  const router = useRouter();
  const initialRoster = usePreloadedQuery(
    preloaded.memberRoster,
  ) as TripMemberRosterItem[];
  const liveRoster = useQuery(api.members.roster, { tripId }) as
    | TripMemberRosterItem[]
    | undefined;
  const roster = liveRoster ?? initialRoster;
  const removeFromTrip = useMutation(api.members.removeFromTrip);

  const [search, setSearch] = useState("");
  const [pendingMemberId, setPendingMemberId] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search);

  const currentViewer = roster.find((member) => member.isCurrentUser) ?? null;

  const filteredRoster = useMemo(() => {
    const sorted = getSortedRoster(roster);
    const query = deferredSearch.trim().toLowerCase();

    if (!query) {
      return sorted;
    }

    return sorted.filter((member) => member.name.toLowerCase().includes(query));
  }, [deferredSearch, roster]);

  const handleRemove = async (member: TripMemberRosterItem) => {
    const confirmed =
      typeof window === "undefined"
        ? false
        : window.confirm(`Remove ${member.name} from this trip?`);

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
    <section className="w-full px-0 py-2">
      <label className="mb-5 flex items-center gap-3 rounded-[1.15rem] border border-white/10 bg-white/[0.04] px-4 py-3.5 backdrop-blur-xl">
        <Search className="h-4 w-4 text-white/32" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search"
          className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/28"
        />
      </label>

      <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.02))] backdrop-blur-2xl">
        {filteredRoster.length > 0 ? (
          filteredRoster.map((member, index) => {
            const canDelete =
              currentViewer?.role === "owner" &&
              !member.isCurrentUser &&
              member.role !== "owner";
            const isPending = pendingMemberId === member.memberId;

            return (
              <div
                key={member.memberId}
                role="link"
                tabIndex={0}
                onClick={() =>
                  router.push(getTripPersonHref(tripId, member.memberId))
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    router.push(getTripPersonHref(tripId, member.memberId));
                  }
                }}
                className={`grid cursor-pointer grid-cols-[auto_minmax(0,1.2fr)_minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 transition-colors hover:bg-white/[0.035] sm:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:gap-4 sm:px-5 ${index !== filteredRoster.length - 1 ? "border-b border-white/8" : ""}`}
              >
                <UserAvatar
                  name={member.name}
                  image={member.image}
                  seed={member.userId}
                  size={46}
                />

                <p className="min-w-0 truncate text-sm font-medium text-white sm:text-[0.95rem]">
                  {member.name}
                </p>

                <div className="flex justify-end">
                  {canDelete ? (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleRemove(member);
                      }}
                      disabled={isPending}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:text-[#ff5a5f] disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={`Remove ${member.name}`}
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })
        ) : (
          <div className="px-5 h-19.5 text-center flex items-center justify-center">
            <p className="text-base font-medium text-white">
              No matching people
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
