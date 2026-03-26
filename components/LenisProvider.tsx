"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";

export default function LenisProvider({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const content = contentRef.current;

    if (!content) return;

    const lenis = new Lenis({
      wrapper: content,
      content,
      autoResize: true,
      allowNestedScroll: true,
      smoothWheel: true,
      gestureOrientation: "vertical",
      orientation: "vertical",
      lerp: 0.075,
      wheelMultiplier: 0.9,
      touchMultiplier: 1,
    });

    let rafId = 0;

    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };

    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return (
    <div ref={contentRef} className={className}>
      {children}
    </div>
  );
}
