"use client";

import { useEffect, useRef } from "react";
import { useMutation, usePreloadedQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import type { TripPagePreloadedData } from "../preloaded";
import type { CurrentUser } from "../types";

export default function TripBackgroundEffects({
  currentUserPreloaded,
  coverUrl,
  tripId,
}: {
  currentUserPreloaded: TripPagePreloadedData["currentUser"];
  coverUrl?: string | null;
  tripId: Id<"trips">;
}) {
  const currentUser = usePreloadedQuery(currentUserPreloaded) as CurrentUser;
  const setLastActiveTrip = useMutation(api.users.setLastActiveTrip);
  const syncedBackgroundTripRef = useRef<string | null>(null);

  useEffect(() => {
    if (!currentUser?.useTripCoverBackground) {
      return;
    }

    if (
      currentUser.lastActiveTripId === tripId ||
      syncedBackgroundTripRef.current === tripId
    ) {
      return;
    }

    syncedBackgroundTripRef.current = tripId;

    void setLastActiveTrip({ tripId }).catch(() => {
      syncedBackgroundTripRef.current = null;
    });
  }, [
    currentUser?.lastActiveTripId,
    currentUser?.useTripCoverBackground,
    setLastActiveTrip,
    tripId,
  ]);

  useEffect(() => {
    if (!currentUser?.useTripCoverBackground || !coverUrl || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem("gather:lastTripCover", coverUrl);
    window.dispatchEvent(new Event("gather:lastTripCoverChanged"));
  }, [coverUrl, currentUser?.useTripCoverBackground]);

  return null;
}
