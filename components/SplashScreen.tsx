"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const SESSION_KEY = "gather-splash-complete";
const SPLASH_DURATION = 4300;

type SplashPhase = "enter" | "drift" | "exit";

export default function SplashScreen() {
  const [show, setShow] = useState(false);
  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState<SplashPhase>("enter");

  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem(SESSION_KEY);

    if (hasSeenSplash === "true") {
      setReady(true);
      setShow(false);
      return;
    }

    setShow(true);
    setReady(true);

    const driftTimer = setTimeout(() => {
      setPhase("drift");
    }, 1200);

    const exitTimer = setTimeout(() => {
      setPhase("exit");
    }, SPLASH_DURATION - 1100);

    const hideTimer = setTimeout(() => {
      sessionStorage.setItem(SESSION_KEY, "true");
      setShow(false);
    }, SPLASH_DURATION);

    return () => {
      clearTimeout(driftTimer);
      clearTimeout(exitTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  const stageAnimation = {
    enter: { scale: 1, opacity: 1, filter: "blur(0px)" },
    drift: {
      scale: 1.045,
      opacity: 1,
      filter: "blur(0px)",
      transition: { duration: 1.4, ease: [0.22, 1, 0.36, 1] as const },
    },
    exit: {
      scale: 1.12,
      opacity: 0,
      filter: "blur(22px)",
      transition: { duration: 0.95, ease: [0.7, 0, 0.84, 0] as const },
    },
  } satisfies Record<SplashPhase, object>;

  if (!ready) {
    return null;
  }

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98, filter: "blur(18px)" }}
          animate={stageAnimation[phase]}
          exit={{ opacity: 0, transition: { duration: 0.35 } }}
          className="fixed inset-0 z-100 overflow-hidden bg-[#f7f1e8] text-stone-950"
        >
          <motion.div
            animate={{
              scale: phase === "exit" ? 1.14 : 1,
              opacity: phase === "exit" ? 0.6 : 1,
            }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(255,218,186,0.95),transparent_24%),radial-gradient(circle_at_78%_22%,rgba(245,235,212,0.92),transparent_22%),radial-gradient(circle_at_50%_78%,rgba(196,207,198,0.45),transparent_28%),linear-gradient(180deg,#fbf6ef_0%,#f3ece1_100%)]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.84 }}
            animate={{
              opacity: phase === "exit" ? 0 : 0.9,
              scale: phase === "drift" ? 1.08 : 1,
              rotate: phase === "exit" ? -10 : -6,
            }}
            transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/40 bg-white/20 blur-3xl"
          />
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{
              opacity: phase === "exit" ? 0 : 1,
              x: phase === "drift" ? 18 : 0,
            }}
            transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-[12%] top-[16%] h-px w-28 bg-stone-950/12 sm:w-40"
          />
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{
              opacity: phase === "exit" ? 0 : 1,
              x: phase === "drift" ? -18 : 0,
            }}
            transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="absolute bottom-[18%] right-[10%] h-px w-24 bg-stone-950/12 sm:w-36"
          />

          <div className="relative flex h-full flex-col items-center justify-center px-6 text-center">
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{
                opacity: phase === "exit" ? 0 : 1,
                y: phase === "drift" ? -4 : 0,
                letterSpacing: phase === "drift" ? "0.22em" : "0.18em",
              }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="section-kicker"
            >
              Shared itineraries
            </motion.p>

            <div className="overflow-hidden">
              <motion.h1
                initial={{ y: 110, opacity: 0, scale: 0.9 }}
                animate={{
                  y: 0,
                  opacity: phase === "exit" ? 0 : 1,
                  scale: phase === "drift" ? 1.04 : 1,
                }}
                transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
                className="font-serif text-6xl tracking-[-0.09em] sm:text-7xl md:text-8xl lg:text-9xl"
              >
                Gather
              </motion.h1>
            </div>

            <div className="overflow-hidden">
              <motion.p
                initial={{ y: 42, opacity: 0 }}
                animate={{
                  y: 0,
                  opacity: phase === "exit" ? 0 : 1,
                }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.45 }}
                className="mt-4 max-w-lg text-sm text-stone-600 sm:text-base"
              >
                Plan trips together with a calmer rhythm, clearer decisions, and a little sense of arrival.
              </motion.p>
            </div>

            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{
                scaleX: phase === "exit" ? 0 : 1,
                opacity: phase === "exit" ? 0 : 1,
              }}
              transition={{ duration: 1, ease: "easeInOut", delay: 0.75 }}
              className="mt-10 h-px w-24 origin-center bg-stone-900/18"
            />

           
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
