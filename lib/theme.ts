export const THEME_PRESETS = [
  "forest",
  "blush",
  "earth",
  "obsidian",
  "white",
  "babyBlue",
] as const;

export type ThemePreset = (typeof THEME_PRESETS)[number];

export const DEFAULT_THEME_PRESET: ThemePreset = "forest";

export const THEME_PRESET_META: Record<
  ThemePreset,
  {
    label: string;
    description: string;
    preview: [string, string, string];
  }
> = {
  forest: {
    label: "Forest",
    description: "The current moss-and-olive Gather palette.",
    preview: ["#081411", "#152720", "#dbe887"],
  },
  blush: {
    label: "Blush",
    description: "Soft rose glass with a warmer editorial tint.",
    preview: ["#1c1316", "#3b252e", "#f2c9d4"],
  },
  earth: {
    label: "Earth",
    description: "Brown stone and clay tones with restrained warmth.",
    preview: ["#16110d", "#31241b", "#d7b184"],
  },
  obsidian: {
    label: "Obsidian",
    description: "Sharper black graphite surfaces with cool highlights.",
    preview: ["#08090b", "#171a1f", "#c8d0db"],
  },
  white: {
    label: "White",
    description: "A controlled ivory preset that stays readable in the dark shell.",
    preview: ["#171512", "#2f2a24", "#f3eadf"],
  },
  babyBlue: {
    label: "Baby Blue",
    description: "Powder blue tint with quiet steel accents.",
    preview: ["#0d141a", "#1c2934", "#b8dbf6"],
  },
};
