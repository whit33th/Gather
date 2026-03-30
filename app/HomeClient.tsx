"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { MapPin, Calendar, Plus, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import * as motion from "motion/react-client";

import Globe from "@/components/Globe";
import CreateTripModalNew from "@/components/CreateTripModalNew";
import { Preloaded, usePreloadedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

type Trip = {
  _id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  coverUrl?: string;
  lat?: number;
  lng?: number;
};

const FALLBACK_COVERS = [
  "/covers/cover-1.png",
  "/covers/cover-2.png",
  "/covers/cover-3.png",
];

function formatRange(start: string, end: string) {
  return `${format(parseISO(start), "MMM d")} – ${format(parseISO(end), "MMM d, yyyy")}`;
}

function TripCard({ trip, index }: { trip: Trip; index: number }) {
  const cover = trip.coverUrl || FALLBACK_COVERS[index % FALLBACK_COVERS.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: 0.55,
        delay: index * 0.08,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <Link href={`/trip/${trip._id}` as Route} className="group block">
        <article className="overflow-hidden rounded-[1.6rem] border border-white/8 bg-surface-card shadow-sm backdrop-blur-md transition-all duration-300 ease-out hover:-translate-y-1 hover:border-white/15 hover:shadow-md ">
          {/* Photo */}
          <div className="relative aspect-[16/10] overflow-hidden">
            <Image
              src={cover}
              alt={trip.title}
              fill
              className="object-cover transition-color duration-700 ease-out group-hover:brightness-110"
            />
            {/* gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

            {/* destination chip */}
            <div className="absolute bottom-3 left-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-[0.62rem] font-semibold  tracking-[0.14em] text-white/90 backdrop-blur-md">
                <MapPin className="h-3 w-3" />
                {trip.destination.split(',')[0].trim()}
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="p-4 sm:p-5">
            <h3 className="text-lg font-semibold tracking-[-0.03em] text-white transition-colors ">
              {trip.title}
            </h3>

            <div className="mt-2 flex items-center gap-1.5 text-[0.72rem] text-white/45">
              <Calendar className="h-3.5 w-3.5" />
              {formatRange(trip.startDate, trip.endDate)}
            </div>

            <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold tracking-[0.06em] text-white/50 transition-colors ">
              Open trip
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 " />
            </div>
          </div>
        </article>
      </Link>
    </motion.div>
  );
}

export default function HomeClient({ preloadedTrips }: { preloadedTrips: Preloaded<typeof api.trips.list> }) {
  const trips = usePreloadedQuery(preloadedTrips);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [prefillLocation, setPrefillLocation] = useState<{destination: string, lat: number, lng: number} | null>(null);

  const handleOpenTemplate = (destination: string, lat: number, lng: number) => {
    setPrefillLocation({ destination, lat, lng });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setPrefillLocation(null), 300);
  };

  const sorted = [...trips].sort((a, b) =>
    a.startDate.localeCompare(b.startDate)
  );

  return (
    <>
      {/* ─── Globe hero ─── */}
      <section className="relative flex flex-col items-center justify-center pb-8 pt-2 min-h-[500px]">
        <div className="relative w-full max-w-160 z-0">
          <Globe trips={trips} onAddTrip={handleOpenTemplate} />
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

      {/* ─── Trip cards ─── */}
      <section className="mt-2">
        {sorted.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-white/10 bg-white/5 p-16 text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-white/8 bg-white/5">
              <MapPin className="h-7 w-7 text-white/30" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-white">
              No trips yet
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-white/45">
              Create your first trip and start planning your next adventure with
              friends.
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="editorial-button-primary mt-6 px-6 py-3.5 text-[0.72rem]"
            >
              <Plus className="h-4 w-4" />
              Create your first trip
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {sorted.map((trip, i) => (
              <TripCard key={trip._id} trip={trip} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* ─── FAB ─── */}
      {sorted.length > 0 && (
        <motion.button
          type="button"
          onClick={() => setIsModalOpen(true)}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-6 right-6 z-30 inline-flex cursor-pointer items-center gap-2 rounded-full border border-accent/42 bg-gradient-to-b bg-white text-black px-5 py-3.5 text-md font-semibold tracking-widest text-accent-contrast shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-2xl"
          aria-label="Add trip"
        >
          <Plus className="h-5.5 w-5.5" />
          <span className="hidden sm:inline">Add trip</span>
        </motion.button>
      )}

      {/* ─── Modal ─── */}
      <CreateTripModalNew
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        initialDestination={prefillLocation?.destination}
        initialLat={prefillLocation?.lat}
        initialLng={prefillLocation?.lng}
      />
    </>
  );
}
