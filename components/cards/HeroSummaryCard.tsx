import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { CalendarDays, MapPin } from "lucide-react";
import Image from "next/image";

import type { Doc } from "@/convex/_generated/dataModel";

import { cardSurface } from "./shared";

export function HeroSummaryCard({
  trip,
  heroImage,
  travelerCount,
}: {
  trip: Doc<"trips">;
  heroImage: string;
  travelerCount: number;
}) {
  const start = parseISO(trip.startDate);
  const end = parseISO(trip.endDate);
  const nights = Math.max(differenceInCalendarDays(end, start), 1);
  const duration = `${nights + 1} Days Trip`;
  const tripWindow = `${format(start, "MMM d")} - ${format(end, "MMM d")}`;
  const tripYear = format(start, "yyyy");

  return (
    <section className={cardSurface("h-full overflow-hidden p-3")}>
      <div className="group relative h-full  overflow-hidden rounded-[28px] bg-cover bg-center ">
        <Image
          src={heroImage}
          alt={trip.title}
          fill
          className="absolute inset-0 bg-cover bg-center object-cover"
        />

        <div className="relative flex h-full  flex-col justify-between p-5  sm:p-7">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/14 bg-black/26 px-3.5 py-2 text-[0.68rem] font-semibold tracking-[0.18em] text-white/88 backdrop-blur-md">
              <MapPin className="h-3.5 w-3.5 text-[#dbe887]" />
              <span>{trip.destination}</span>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-end">
            <div className="max-w-3xl rounded-4xl border border-white/10 bg-background/20 p-5 shadow backdrop-blur-xl sm:p-6">
              <h2 className="mt-4 max-w-2xl text-[2.7rem] font-semibold leading-[0.9] tracking-[-0.09em] text-white sm:text-[4.15rem]">
                {trip.title}
              </h2>
              <p className="mt-2 text-[1.45rem] font-semibold tracking-[-0.06em] text-white">
                {tripWindow} // {tripYear}
              </p>

              <div className="mt-4 flex flex-wrap gap-2.5 text-sm text-white/88">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/9 px-3.5 py-2.5 backdrop-blur-md">
                  <CalendarDays className="h-4 w-4 text-[#dbe887]" />
                  <span>{duration}</span>
                </span>
              </div>
            </div>

            <div className="grid h-full gap-3">
              <div className="rounded-[26px] border border-white/10 bg-background/20 p-4 shadow backdrop-blur-xl">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="rounded-[18px] border border-white/10 bg-white/[0.05] px-3 py-3">
                    <p className="text-[0.58rem] uppercase tracking-[0.16em] text-white/40">
                      People
                    </p>
                    <p className="mt-2 text-sm font-medium text-white">
                      {Math.max(travelerCount, 1)} travelers
                    </p>
                  </div>
                  <div className="rounded-[18px] border border-white/10 bg-white/[0.05] px-3 py-3">
                    <p className="text-[0.58rem] uppercase tracking-[0.16em] text-white/40">
                      Mode
                    </p>
                    <p className="mt-2 text-sm font-medium text-white">Lit</p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-[0.68rem] uppercase tracking-[0.16em] text-white/46">
                      <span>Trip mood</span>
                      <span>Curated</span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-white/10">
                      <div className="h-full w-[82%] rounded-full bg-[linear-gradient(90deg,#dbe887,#8cc8ba)]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-[0.68rem] uppercase tracking-[0.16em] text-white/46">
                      <span>Overview fit</span>
                      <span>Strong</span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-white/10">
                      <div className="h-full w-[91%] rounded-full bg-[linear-gradient(90deg,#c7b0ff,#dbe887)]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
