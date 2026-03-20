"use client";

import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { ArrowUpRight, CalendarDays, MapPin, Sparkles, Users } from "lucide-react";
import type { Route } from "next";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

function formatTripRange(startDate: string, endDate: string) {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
}

export default function InvitePage() {
  const params = useParams();
  const tripId = params.token as Id<"trips">;

  const trip = useQuery(api.trips.getPublic, { tripId });
  const joinTrip = useMutation(api.members.joinTrip);

  const { signIn } = useAuthActions();
  const router = useRouter();
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");

  const handleJoin = async () => {
    setIsJoining(true);
    setError("");

    try {
      await joinTrip({ tripId });
      router.push(`/trip/${tripId}` as Route);
    } catch (e: unknown) {
      if (e instanceof Error && e.message.includes("Unauthenticated")) {
        await signIn("google", { redirectTo: `/invite/${tripId}` });
        return;
      }

      setError(e instanceof Error ? e.message : "Unable to join this trip.");
      setIsJoining(false);
    }
  };

  if (trip === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-stone-300 border-t-stone-900/60" />
      </div>
    );
  }

  if (trip === null) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="editorial-card w-full max-w-lg rounded-[2rem] p-8 text-center">
          <p className="section-kicker">Invite not found</p>
          <h1 className="mt-3 font-serif text-4xl tracking-[-0.05em] text-stone-950">
            This invitation is no longer valid.
          </h1>
          <p className="mt-4 text-sm text-stone-600">
            The trip may have been removed, or the link may be incomplete.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,218,198,0.84),transparent_30%),radial-gradient(circle_at_88%_16%,rgba(255,244,228,0.84),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0))]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl items-center">
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
              Join the shared plan to weigh in on dates, places, budget, and the details that turn a destination into an actual trip.
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
                    Keep the practical plan visible without losing the energy of the trip itself.
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

            {error ? (
              <div className="mt-5 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <button
              onClick={() => void handleJoin()}
              disabled={isJoining}
              className="editorial-button-primary mt-8 flex w-full items-center justify-center rounded-[1.3rem] px-5 py-4 text-[0.68rem] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isJoining ? "Joining..." : "Join this trip"}
              <ArrowUpRight className="h-4 w-4" />
            </button>

            <p className="mt-4 text-center text-sm text-stone-500">
              If you are not signed in yet, we will send you through Google first and bring you straight back here.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
