import { format, parseISO } from "date-fns";
import { fetchQuery } from "convex/nextjs";
import type { Route } from "next";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { getServerQueryOptions } from "@/lib/convex-server";

import InvitePageMotion from "./InvitePageMotion";

function formatTripRange(startDate: string, endDate: string) {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const tripId = token as Id<"trips">;
  const trip = await fetchQuery(api.trips.getPublic, { tripId }, await getServerQueryOptions());

  if (trip === null) {
    return (
      <div className="flex min-h-full items-center justify-center px-4 py-10">
        <section className="w-full max-w-xl rounded-[28px] border border-white/10 p-8 text-center shadow-[0_24px_60px_rgba(0,0,0,0.32)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">Invite not found</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white">This invitation is no longer valid.</h1>
          <p className="mt-4 text-sm leading-6 text-white/58">
            The trip may have been removed, or the link may be incomplete.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="relative min-h-full overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="invite-page-glow absolute inset-0" />

      <InvitePageMotion
        tripTitle={trip.title}
        tripDestination={trip.destination}
        tripId={tripId}
        redirectHref={`/trip/${tripId}` as Route}
        travelWindowLabel={formatTripRange(trip.startDate, trip.endDate)}
      />
    </div>
  );
}
