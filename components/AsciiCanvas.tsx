"use client";

import { useEffect, useRef } from "react";

type AsciiCanvasProps = {
  seed: string;
  className?: string;
  density?: number;
};

function hashString(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return h >>> 0;
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function AsciiCanvas({ seed, className, density = 0.55 }: AsciiCanvasProps) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const chars = ["░", "▒", "▓", "█", ".", ":", "+", "*"];
    const rand = mulberry32(hashString(seed));

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const fontSize = 10;
      const lineHeight = 12;
      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.font = `${fontSize}px var(--font-geist-mono)`;
      ctx.fillStyle = "rgba(255,255,255,0.18)";

      const cols = Math.floor(rect.width / fontSize);
      const rows = Math.floor(rect.height / lineHeight);
      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          if (rand() > density) continue;
          const ch = chars[Math.floor(rand() * chars.length)];
          ctx.fillText(ch, x * fontSize, y * lineHeight);
        }
      }
    };

    draw();
    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [seed, density]);

  return <canvas ref={ref} className={className} />;
}
