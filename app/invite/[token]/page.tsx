import { format, parseISO } from "date-fns";
import { CalendarDays, MapPin, Sparkles, Users } from "lucide-react";
import type { Route } from "next";
import * as motion from "motion/react-client";

import { ConvexClientProvider } from "@/app/ConvexClientProvider";
import AppState from "@/components/AppState";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { fetchServerQuery } from "@/lib/convex-server";

import InviteActions from "./InviteActions";

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
  const trip = await fetchServerQuery(api.trips.getPublic, { tripId });

  if (trip === null) {
    return (
      <AppState
        eyebrow="Invite not found"
        title="This invitation is no longer valid."
        description="The trip may have been removed, or the link may be incomplete."
      />
    );
  }

  return (
    <div className="relative min-h-full overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="invite-page-glow absolute inset-0" />

      <div className="relative mx-auto flex min-h-full max-w-5xl items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[0.96fr_1.04fr]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="editorial-card hidden rounded-[2.5rem] p-10 lg:flex lg:flex-col"
          >
            <p className="section-kicker">Invitation</p>
            <h1 className="balanced mt-4 font-serif text-6xl leading-[0.9] tracking-[-0.06em] text-stone-950">
              Someone wants you in the trip notebook.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-stone-600">
              Join the shared plan to weigh in on dates, places, budget, and the details
              that turn a destination into an actual trip.
            </p>

            <div className="mt-auto grid gap-4">
              <div className="editorial-card-soft rounded-[1.7rem] p-5">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-[#5a7e67]" />
                  <p className="text-sm text-stone-700">
                    Join the same chat, map, and planning board as everyone else.
                  </p>
                </div>
              </div>
              <div className="editorial-card-soft rounded-[1.7rem] p-5">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-[#dd5a3d]" />
                  <p className="text-sm text-stone-700">
                    Keep the practical plan visible without losing the energy of the trip
                    itself.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="editorial-card rounded-[2.2rem] p-6 shadow-[0_32px_90px_rgba(96,58,30,0.16)] sm:p-8"
          >
            <p className="section-kicker">You are invited</p>
            <h2 className="balanced mt-3 font-serif text-4xl leading-[0.94] tracking-[-0.05em] text-stone-950 sm:text-5xl">
              {trip.title}
            </h2>

            <div className="mt-8 grid gap-4">
              <div className="editorial-card-soft rounded-[1.6rem] p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fff0e8] text-[#dd5a3d]">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="section-kicker text-[0.58rem]">Destination</p>
                    <p className="mt-2 text-sm text-stone-700">{trip.destination}</p>
                  </div>
                </div>
              </div>

              <div className="editorial-card-soft rounded-[1.6rem] p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#edf3ee] text-[#5a7e67]">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="section-kicker text-[0.58rem]">Travel window</p>
                    <p className="mt-2 text-sm text-stone-700">
                      {formatTripRange(trip.startDate, trip.endDate)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <ConvexClientProvider>
              <InviteActions tripId={tripId} redirectHref={`/trip/${tripId}` as Route} />
            </ConvexClientProvider>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
