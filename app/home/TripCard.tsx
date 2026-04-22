import { MapPin, Calendar, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import * as motion from "motion/react-client";

import { formatHomeTripRange } from "./formatTripDateRange";
import type { HomeTripListItem } from "./types";

const FALLBACK_COVERS = ["/covers/cover-1.png", "/covers/cover-2.png", "/covers/cover-3.png"];

export function TripCard({ trip, index }: { trip: HomeTripListItem; index: number }) {
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
          <div className="relative aspect-[16/10] overflow-hidden">
            <Image
              src={cover}
              alt={trip.title}
              fill
              className="object-cover transition-color duration-700 ease-out group-hover:brightness-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-[0.62rem] font-semibold  tracking-[0.14em] text-white/90 backdrop-blur-md">
                <MapPin className="h-3 w-3" />
                {trip.destination.split(",")[0].trim()}
              </span>
            </div>
          </div>

          <div className="p-4 sm:p-5 bg-black/70">
            <h3 className="text-lg font-semibold tracking-[-0.03em] text-white transition-colors ">{trip.title}</h3>

            <div className="mt-2 flex items-center gap-1.5 text-[0.72rem] text-white/45">
              <Calendar className="h-3.5 w-3.5" />
              {formatHomeTripRange(trip.startDate, trip.endDate)}
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
