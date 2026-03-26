"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";

import { useAppTheme } from "./AppThemeProvider";

export default function AppShellBackground() {
  const { backgroundImageUrl } = useAppTheme();

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">

      <AnimatePresence mode="wait">
        {backgroundImageUrl ? (
          <motion.div
            key={backgroundImageUrl}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <Image
              src={backgroundImageUrl}
              alt="Trip background"
              width={96}
              height={96}
              priority
              fetchPriority="high"
              sizes="100vw"
              className="absolute inset-0 h-full w-full scale-110 object-cover blur-3xl brightness-90"
            />
            <div className="inset-0 absolute bg-linear-to-b from-black/5 to-black/35"/>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
