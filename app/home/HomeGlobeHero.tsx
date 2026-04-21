import * as motion from "motion/react-client";

import Globe from "@/components/Globe";

import type { HomeTripListItem } from "./types";

export function HomeGlobeHero({
  onAddTripFromTemplate,
  trips,
}: {
  trips: HomeTripListItem[];
  onAddTripFromTemplate: (destination: string, lat: number, lng: number) => void;
}) {
  return (
    <section aria-label="Trip globe" className="relative flex flex-col items-center justify-center pb-8 pt-2 min-h-[500px]">
      <div className="relative w-full max-w-160 z-0">
        <Globe trips={trips} onAddTrip={onAddTripFromTemplate} />
      </div>

      <div className="pointer-events-none relative z-10 -mt-14 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45 }}
          className="mt-3 text-[clamp(2.2rem,5.5vw,4rem)] font-semibold leading-[0.95] tracking-[-0.06em] text-white"
        >
          Explore the world,
          <br />
          <span className="text-accent">together.</span>
        </motion.h1>
      </div>
    </section>
  );
}
