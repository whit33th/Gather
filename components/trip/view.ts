import type { Route } from "next";

import type { Id } from "@/convex/_generated/dataModel";

export const tripViews = [
  "board",
  "calendar",
  "people",
  "settings",
] as const;

export type TripView = (typeof tripViews)[number];

export function normalizeTripView(value?: string | string[]): TripView {
  if (Array.isArray(value)) {
    return normalizeTripView(value[0]);
  }

  return tripViews.find((view) => view === value) ?? "board";
}

export function getTripViewHref(tripId: Id<"trips">, view: TripView): Route {
  const query = new URLSearchParams();

  if (view !== "board") {
    query.set("view", view);
  }

  const suffix = query.toString();
  return `/trip/${tripId}${suffix ? `?${suffix}` : ""}` as Route;
}

