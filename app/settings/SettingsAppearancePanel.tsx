"use client";

import { useEffect, useState } from "react";
import type { Preloaded } from "convex/react";
import { useMutation, usePreloadedQuery } from "convex/react";
import { Image as ImageIcon, PaintBucket, Sparkles } from "lucide-react";

import { api } from "@/convex/_generated/api";
import {
  DEFAULT_THEME_PRESET,
  THEME_PRESET_META,
  THEME_PRESETS,
  type ThemePreset,
} from "@/lib/theme";

import { ThemePresetCard } from "./ThemePresetCard";
import type { SettingsUser } from "./types";

export function SettingsAppearancePanel({
  preloadedCurrentUser,
}: {
  preloadedCurrentUser: Preloaded<typeof api.users.current>;
}) {
  const currentUser = usePreloadedQuery(preloadedCurrentUser) as SettingsUser;
  const updateAppearance = useMutation(api.users.updateAppearance);

  const [themePreset, setThemePreset] = useState<ThemePreset>(currentUser?.themePreset || DEFAULT_THEME_PRESET);
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
    <section className="glass-panel overflow-hidden rounded-4xl">
      <div className="border-b border-white/10 bg-white/[0.04] px-6 py-6 sm:px-7">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.1rem] border border-white/10 bg-white/[0.05] text-[var(--accent)]">
            <PaintBucket className="h-5 w-5" />
          </span>
          <div>
            <p className="section-kicker">Appearance</p>
            <h2 className="mt-3 text-[2rem] font-semibold tracking-[-0.06em] text-white">Global shell theme</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/58">
              These presets recolor the authenticated app shell while keeping the existing Gather hierarchy and glass
              treatment intact.
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
                <p className="text-sm font-semibold tracking-[-0.03em] text-white">Use trip cover as app background</p>
                <p className="mt-2 max-w-xl text-sm leading-6 text-white/56">
                  When enabled, the last opened trip with a cover becomes the blurred background of the authenticated app
                  shell.
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
  );
}
