import { Settings2 } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { preloadServerQuery } from "@/lib/convex-server";

import { SettingsAccountPanel } from "./SettingsAccountPanel";
import { SettingsAppearancePanel } from "./SettingsAppearancePanel";

export default async function SettingsPage() {
  const preloadedCurrentUser = await preloadServerQuery(api.users.current, {});

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <header className="glass-panel overflow-hidden rounded-[2.5rem] p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="section-kicker">Settings</p>
            <h1 className="mt-3 max-w-2xl text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.05] tracking-[-0.06em] text-white">
              Personalize the shell and manage your account
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/58 sm:text-base">
              Theme presets and background behavior are applied across the authenticated app. Profile actions stay on
              this page so the layout stays predictable for your team.
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.1rem] border border-white/10 bg-white/[0.05] text-[var(--accent)]">
            <Settings2 className="h-5 w-5" />
          </div>
        </div>
      </header>

      <div className="mt-6 grid min-h-0 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-h-0">
          <SettingsAppearancePanel preloadedCurrentUser={preloadedCurrentUser} />
        </div>

        <aside className="min-h-0">
          <SettingsAccountPanel preloadedCurrentUser={preloadedCurrentUser} />
        </aside>
      </div>
    </div>
  );
}
