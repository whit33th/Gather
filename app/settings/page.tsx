"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import { ArrowUpRight, LogOut, Settings2 } from "lucide-react";
import { api } from "../../convex/_generated/api";
import AppState from "../../components/AppState";
import UserAvatar from "../../components/UserAvatar";

export default function SettingsPage() {
  const { isLoading } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();
  const currentUser = useQuery(api.users.current);

  if (isLoading || currentUser === undefined) {
    return (
      <AppState
        loading
        eyebrow="Settings"
        title="Loading account"
        description="Preparing profile details and account actions."
      />
    );
  }

  return (
    <div className="page-shell">
      <section className="mx-auto max-w-4xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <div className="glass-panel overflow-hidden rounded-[2.4rem]">
          <div className="border-b border-white/10 bg-white/[0.04] px-6 py-6 sm:px-7">
            <p className="section-kicker">Settings</p>
            <div className="mt-3 flex items-center gap-3">

              <div>
                <h1 className="text-4xl font-semibold tracking-[-0.05em] text-white">
                  Account
                </h1>
                <p className="mt-2 text-sm text-white/52">
                  Keep auth actions and profile details in the shell, not inside page headers.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 px-6 py-6 sm:px-7">
            {currentUser ? (
              <div className="">
                <div className="flex items-center gap-4">
                  <UserAvatar
                    name={currentUser.name || "Traveler"}
                    image={currentUser.image}
                    seed={currentUser._id}
                    size={56}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-xl font-semibold tracking-[-0.04em] text-white">
                      {currentUser.name || "Traveler"}
                    </p>
                    <p className="text-sm text-white/52">Signed in with Google</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="trip-glass-button mt-5 w-full justify-center rounded-[1.2rem] px-4 py-3 text-sm"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => void signIn("google", { redirectTo: "/settings" })}
                className="trip-glass-button w-full justify-center rounded-[1.2rem] px-4 py-3 text-sm"
              >
                <ArrowUpRight className="h-4 w-4" />
                <span>Continue with Google</span>
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
