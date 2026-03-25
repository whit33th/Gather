"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import {
  DEFAULT_THEME_PRESET,
  type ThemePreset,
} from "../lib/theme";

type AppThemeContextValue = {
  themePreset: ThemePreset;
  photoBackgroundActive: boolean;
  backgroundImageUrl: string | null;
};

const AppThemeContext = createContext<AppThemeContextValue>({
  themePreset: DEFAULT_THEME_PRESET,
  photoBackgroundActive: false,
  backgroundImageUrl: null,
});

export function AppThemeProvider({
  children,
  themePreset,
  backgroundImageUrl,
  className,
  enabled = true,
}: {
  children: ReactNode;
  themePreset?: ThemePreset;
  backgroundImageUrl?: string | null;
  className?: string;
  enabled?: boolean;
}) {
  const resolvedThemePreset = themePreset ?? DEFAULT_THEME_PRESET;
  const photoBackgroundActive = Boolean(backgroundImageUrl);

  const value = useMemo<AppThemeContextValue>(
    () => ({
      themePreset: resolvedThemePreset,
      photoBackgroundActive,
      backgroundImageUrl: backgroundImageUrl ?? null,
    }),
    [backgroundImageUrl, photoBackgroundActive, resolvedThemePreset]
  );

  return (
    <AppThemeContext.Provider value={value}>
      <div
        className={className}
        data-theme-preset={enabled ? resolvedThemePreset : undefined}
        data-photo-background={enabled && photoBackgroundActive ? "true" : undefined}
      >
        {children}
      </div>
    </AppThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(AppThemeContext);
}
