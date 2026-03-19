"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const AVATAR_TONES = [
  { background: "#dce6de", foreground: "#4a5f4d" },
  { background: "#dde4ea", foreground: "#4c6077" },
  { background: "#ebe1dc", foreground: "#6b5447" },
  { background: "#e5dfeb", foreground: "#665278" },
  { background: "#e6e8d9", foreground: "#5d6740" },
  { background: "#eadcdc", foreground: "#7a4f4f" },
];

function hashSeed(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function toneFromSeed(seed: string) {
  return AVATAR_TONES[hashSeed(seed) % AVATAR_TONES.length];
}

export default function UserAvatar({
  name,
  image,
  seed,
  size = 40,
  className = "",
}: {
  name: string;
  image?: string | null;
  seed?: string | null;
  size?: number;
  className?: string;
}) {
  const safeName = name.trim() || "?";
  const tone = toneFromSeed(seed || safeName);
  const initial = safeName.charAt(0).toUpperCase();

  return (
    <Avatar
      className={`shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
      }}
      aria-label={safeName}
      title={safeName}
    >
      {image ? <AvatarImage src={image} alt={safeName} /> : null}
      <AvatarFallback
        className="font-semibold"
        style={{
          backgroundColor: tone.background,
          color: tone.foreground,
          fontSize: Math.max(12, Math.round(size * 0.38)),
        }}
      >
        {initial}
      </AvatarFallback>
    </Avatar>
  );
}
