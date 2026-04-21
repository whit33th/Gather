"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import type { Preloaded } from "convex/react";
import { usePreloadedQuery } from "convex/react";
import { LogOut } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { GoogleIcon } from "@/components/icons/GoogleIcon";
import UserAvatar from "@/components/UserAvatar";

import type { SettingsUser } from "./types";

export function SettingsAccountPanel({
  preloadedCurrentUser,
}: {
  preloadedCurrentUser: Preloaded<typeof api.users.current>;
}) {
  const currentUser = usePreloadedQuery(preloadedCurrentUser) as SettingsUser;
  const { signIn, signOut } = useAuthActions();

  return (
    <section className="glass-panel overflow-hidden rounded-4xl">
      <div className="border-b border-white/10 bg-white/[0.04] px-6 py-6 sm:px-7">
        <p className="section-kicker">Account</p>
        <h2 className="mt-3 text-[2rem] font-semibold tracking-[-0.06em] text-white">Profile</h2>
      </div>

      <div className="grid gap-6 px-6 py-6 sm:px-7">
        {currentUser ? (
          <>
            <div className="flex items-center gap-4">
              <UserAvatar
                name={currentUser.name || "Traveler"}
                image={currentUser.image ?? undefined}
                seed={currentUser._id}
                size={56}
              />
              <div className="min-w-0">
                <p className="truncate text-xl font-semibold tracking-[-0.04em] text-white">
                  {currentUser.name || "Traveler"}
                </p>
                <p className="text-sm text-white/52">Signed in account</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void signOut()}
              className="trip-glass-button trip-control-surface w-full justify-center rounded-[1.2rem] px-4 py-3 text-sm"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => void signIn("google", { redirectTo: "/settings" })}
            className="flex min-h-16 w-full items-center justify-center gap-3 rounded-full border border-black/8 bg-white px-6 text-[1.1rem] font-bold tracking-[-0.03em] text-[#171717] shadow-[0_14px_30px_rgba(0,0,0,0.2)] transition hover:-translate-y-0.5 hover:bg-[#f8f8f8]"
          >
            <GoogleIcon />
            <span>Sign in with Google</span>
          </button>
        )}
      </div>
    </section>
  );
}
