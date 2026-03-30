"use client";

import { useEffect, useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import type { Preloaded } from "convex/react";
import { useMutation } from "convex/react";
import { usePreloadedQuery } from "convex/react";
import {
  ArrowUpRight,
  Image as ImageIcon,
  LogOut,
  PaintBucket,
  Settings2,
  Sparkles,
} from "lucide-react";

import { api } from "@/convex/_generated/api";
import UserAvatar from "@/components/UserAvatar";
import {
  DEFAULT_THEME_PRESET,
  THEME_PRESET_META,
  THEME_PRESETS,
  type ThemePreset,
} from "@/lib/theme";
import { GoogleIcon } from "../login/LoginActions";

type SettingsUser = {
  _id: string;
  name: string;
  image?: string | null;
  themePreset: ThemePreset;
  useTripCoverBackground: boolean;
  backgroundTrip?: {
    _id?: string | null;
    title: string;
    coverUrl?: string | null;
  } | null;
} | null;

function ThemePresetCard({
  active,
  description,
  label,
  onClick,
  preview,
}: {
  active: boolean;
  description: string;
  label: string;
  onClick: () => void;
  preview: [string, string, string];
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[1.5rem] border p-4 text-left transition ${active
        ? "border-[var(--accent)] bg-white/[0.08] shadow-[0_18px_40px_rgba(0,0,0,0.18)]"
        : "border-white/10 bg-white/[0.04] hover:border-white/18 hover:bg-white/[0.06]"
        }`}
    >
      <div className="flex items-center gap-2">
        {preview.map((color) => (
          <span
            key={color}
            className="h-4 w-4 rounded-full border border-white/10"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      <p className="mt-4 text-base font-semibold tracking-[-0.04em] text-white">{label}</p>
      <p className="mt-2 text-sm leading-6 text-white/58">{description}</p>
    </button>
  );
}

export default function SettingsPageClient({
  preloadedCurrentUser,
}: {
  preloadedCurrentUser: Preloaded<typeof api.users.current>;
}) {
  const currentUser = usePreloadedQuery(preloadedCurrentUser) as SettingsUser;
  const { signIn, signOut } = useAuthActions();
  const updateAppearance = useMutation(api.users.updateAppearance);

  const [themePreset, setThemePreset] = useState<ThemePreset>(
    currentUser?.themePreset || DEFAULT_THEME_PRESET,
  );
  const [useTripCoverBackground, setUseTripCoverBackground] = useState(
    currentUser?.useTripCoverBackground ?? true,
  );
  const [isDirty, setIsDirty] = useState(false);
  const [isSavingAppearance, setIsSavingAppearance] = useState(false);

  useEffect(() => {
    if (!currentUser || isDirty) return;

    setThemePreset(currentUser.themePreset || DEFAULT_THEME_PRESET);
    setUseTripCoverBackground(currentUser.useTripCoverBackground ?? true);
  }, [currentUser, isDirty]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme-preset", themePreset);
    document.body.setAttribute("data-theme-preset", themePreset);

    return () => {
      const resolvedThemePreset = currentUser?.themePreset || DEFAULT_THEME_PRESET;
      document.documentElement.setAttribute("data-theme-preset", resolvedThemePreset);
      document.body.setAttribute("data-theme-preset", resolvedThemePreset);
    };
  }, [currentUser?.themePreset, themePreset]);

  const handleAppearanceSave = async () => {
    if (!currentUser) return;

    setIsSavingAppearance(true);

    try {
      await updateAppearance({
        themePreset,
        useTripCoverBackground,
      });
      setIsDirty(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSavingAppearance(false);
    }
  };

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">


        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="grid gap-6">
            <section className="glass-panel overflow-hidden rounded-4xl">
              <div className="border-b border-white/10 bg-white/[0.04] px-6 py-6 sm:px-7">
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.1rem] border border-white/10 bg-white/[0.05] text-[var(--accent)]">
                    <PaintBucket className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="section-kicker">Appearance</p>
                    <h2 className="mt-3 text-[2rem] font-semibold tracking-[-0.06em] text-white">
                      Global shell theme
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-white/58">
                      These presets recolor the authenticated app shell while keeping the
                      existing Gather hierarchy and glass treatment intact.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 px-6 py-6 sm:px-7">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {THEME_PRESETS.map((preset) => {
                    const meta = THEME_PRESET_META[preset];
                    return (
                      <ThemePresetCard
                        key={preset}
                        active={themePreset === preset}
                        description={meta.description}
                        label={meta.label}
                        onClick={() => {
                          setThemePreset(preset);
                          setIsDirty(true);
                        }}
                        preview={meta.preview}
                      />
                    );
                  })}
                </div>

                <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.04] p-5">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-[var(--accent)]">
                        <ImageIcon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold tracking-[-0.03em] text-white">
                          Use trip cover as app background
                        </p>
                        <p className="mt-2 max-w-xl text-sm leading-6 text-white/56">
                          When enabled, the last opened trip with a cover becomes the blurred
                          background of the authenticated app shell.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setUseTripCoverBackground((value) => !value);
                        setIsDirty(true);
                      }}
                      className={`relative inline-flex h-11 w-20 shrink-0 items-center rounded-full border transition ${useTripCoverBackground
                        ? "border-[var(--accent)] bg-[color:var(--accent-soft)]"
                        : "border-white/10 bg-white/[0.06]"
                        }`}
                      aria-pressed={useTripCoverBackground}
                    >
                      <span
                        className={`absolute h-8 w-8 rounded-full bg-white shadow-[0_12px_24px_rgba(0,0,0,0.18)] transition-transform ${useTripCoverBackground ? "translate-x-[2.55rem]" : "translate-x-1.5"
                          }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => void handleAppearanceSave()}
                    disabled={!currentUser || !isDirty || isSavingAppearance}
                    className="editorial-button-primary justify-center px-5 py-3 text-[0.66rem] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSavingAppearance ? "Saving..." : "Save appearance"}
                    <Sparkles className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </section>
          </div>

          <aside className="grid gap-6">
            <section className="glass-panel overflow-hidden rounded-4xl">
              <div className="border-b border-white/10 bg-white/[0.04] px-6 py-6 sm:px-7">
                <p className="section-kicker">Account</p>
                <h2 className="mt-3 text-[2rem] font-semibold tracking-[-0.06em] text-white">
                  Profile
                </h2>
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
          </aside>
        </div>
      </section>
    </>
  );
}
