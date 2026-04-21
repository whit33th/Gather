import type { ThemePreset } from "@/lib/theme";

export type SettingsUser = {
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
