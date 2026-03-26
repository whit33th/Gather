"use client";

import { useEffect, useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation } from "convex/react";
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
      className={`rounded-[1.5rem] border p-4 text-left transition ${
        active
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
  currentUser,
}: {
  currentUser: SettingsUser;
}) {
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
    <div className="page-shell">
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <section className="glass-panel mesh-card overflow-hidden rounded-[2.5rem] p-4 sm:p-5">
          <div className="editorial-hero-panel relative overflow-hidden rounded-[2.2rem] border border-white/10 px-6 py-7 sm:px-8 sm:py-8">
            <div className="editorial-hero-panel__overlay absolute inset-0" />
            <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-end">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-white/76">
                  <Settings2 className="h-3.5 w-3.5 text-[var(--accent)]" />
                  <span>Account settings</span>
                </div>
                <h1 className="mt-5 max-w-3xl text-[clamp(2.6rem,6vw,4.8rem)] font-semibold leading-[0.92] tracking-[-0.08em] text-white">
                  Shape the whole app, not just one page.
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/68 sm:text-base">
                  Switch global color presets, decide whether trip covers become the app
                  background, and keep your account controls in the same surface.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                <article className="rounded-[1.6rem] border border-white/10 bg-white/[0.05] p-4 backdrop-blur-md">
                  <p className="section-kicker text-[0.55rem]">Current theme</p>
                  <p className="mt-3 text-lg font-semibold tracking-[-0.05em] text-white">
                    {THEME_PRESET_META[themePreset].label}
                  </p>
                </article>
                <article className="rounded-[1.6rem] border border-white/10 bg-white/[0.05] p-4 backdrop-blur-md">
                  <p className="section-kicker text-[0.55rem]">Trip background</p>
                  <p className="mt-3 text-sm leading-6 text-white/78">
                    {useTripCoverBackground ? "Enabled" : "Default shell only"}
                  </p>
                </article>
                <article className="rounded-[1.6rem] border border-white/10 bg-white/[0.05] p-4 backdrop-blur-md">
                  <p className="section-kicker text-[0.55rem]">Background source</p>
                  <p className="mt-3 text-sm leading-6 text-white/78">
                    {currentUser?.backgroundTrip?.title || "No trip cover selected yet"}
                  </p>
                </article>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="grid gap-6">
            <section className="glass-panel overflow-hidden rounded-[2.2rem]">
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
                      className={`relative inline-flex h-11 w-20 shrink-0 items-center rounded-full border transition ${
                        useTripCoverBackground
                          ? "border-[var(--accent)] bg-[color:var(--accent-soft)]"
                          : "border-white/10 bg-white/[0.06]"
                      }`}
                      aria-pressed={useTripCoverBackground}
                    >
                      <span
                        className={`absolute h-8 w-8 rounded-full bg-white shadow-[0_12px_24px_rgba(0,0,0,0.18)] transition-transform ${
                          useTripCoverBackground ? "translate-x-[2.55rem]" : "translate-x-1.5"
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
            <section className="glass-panel overflow-hidden rounded-[2.2rem]">
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
                    className="trip-glass-button trip-control-surface w-full justify-center rounded-[1.2rem] px-4 py-3 text-sm"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    <span>Continue with Google</span>
                  </button>
                )}
              </div>
            </section>

            <section className="glass-panel overflow-hidden rounded-[2.2rem] p-6">
              <p className="section-kicker">Live summary</p>
              <h2 className="mt-3 text-[1.6rem] font-semibold tracking-[-0.05em] text-white">
                Current shell
              </h2>
              <div className="mt-5 space-y-3">
                <article className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-[0.62rem] uppercase tracking-[0.16em] text-white/40">
                    Preset
                  </p>
                  <p className="mt-2 text-sm font-medium text-white">
                    {THEME_PRESET_META[themePreset].label}
                  </p>
                </article>
                <article className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-[0.62rem] uppercase tracking-[0.16em] text-white/40">
                    Background source
                  </p>
                  <p className="mt-2 text-sm font-medium text-white">
                    {useTripCoverBackground
                      ? currentUser?.backgroundTrip?.title || "Default background fallback"
                      : "Default background only"}
                  </p>
                </article>
              </div>
            </section>
          </aside>
        </div>
      </section>
    </div>
  );
}
