import { MapPin, Plus } from "lucide-react";
import * as motion from "motion/react-client";

import { TripCard } from "./TripCard";
import type { HomeTripListItem } from "./types";

export function HomeTripsFeed({
  onCreateTrip,
  sortedTrips,
}: {
  sortedTrips: HomeTripListItem[];
  onCreateTrip: () => void;
}) {
  return (
    <section aria-label="Your trips" className="mt-2">
      {sortedTrips.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-white/10 bg-white/5 p-16 text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-white/8 bg-white/5">
            <MapPin className="h-7 w-7 text-white/30" />
          </div>
          <h2 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-white">No trips yet</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-white/45">
            Create your first trip and start planning your next adventure with friends.
          </p>
          <button
            type="button"
            onClick={onCreateTrip}
            className="editorial-button-primary mt-6 px-6 py-3.5 text-[0.72rem]"
          >
            <Plus className="h-4 w-4" />
            Create your first trip
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {sortedTrips.map((trip, i) => (
            <TripCard key={trip._id} trip={trip} index={i} />
          ))}
        </div>
      )}

      {sortedTrips.length > 0 ? (
        <motion.button
          type="button"
          onClick={onCreateTrip}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-6 right-6 z-30 inline-flex cursor-pointer items-center gap-2 rounded-full border border-accent/42 bg-gradient-to-b bg-white text-black px-5 py-3.5 text-md font-semibold tracking-widest text-accent-contrast shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-2xl"
          aria-label="Add trip"
        >
          <Plus className="h-5.5 w-5.5" />
          <span className="hidden sm:inline">Add trip</span>
        </motion.button>
      ) : null}
    </section>
  );
}
