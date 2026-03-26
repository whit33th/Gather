"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation } from "convex/react";
import { ArrowUpRight } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export default function InviteActions({
  tripId,
  redirectHref,
}: {
  tripId: Id<"trips">;
  redirectHref: Route;
}) {
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
      router.push(redirectHref);
    } catch (joinError: unknown) {
      if (joinError instanceof Error && joinError.message.includes("Unauthenticated")) {
        await signIn("google", { redirectTo: `/invite/${tripId}` });
        return;
      }

      setError(joinError instanceof Error ? joinError.message : "Unable to join this trip.");
      setIsJoining(false);
    }
  };

  return (
    <>
      {error ? (
        <div className="mt-5 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => void handleJoin()}
        disabled={isJoining}
        className="editorial-button-primary mt-8 flex w-full items-center justify-center rounded-[1.3rem] px-5 py-4 text-[0.68rem] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isJoining ? "Joining..." : "Join this trip"}
        <ArrowUpRight className="h-4 w-4" />
      </button>

      <p className="mt-4 text-center text-sm text-stone-500">
        If you are not signed in yet, we will send you through Google first and bring you
        straight back here.
      </p>
    </>
  );
}
