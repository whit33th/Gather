"use client";

import { useState } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { format, parseISO } from "date-fns";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  MapPin,
  Plus,
} from "lucide-react";
import { api } from "../convex/_generated/api";
import CreateTripModal from "../components/CreateTripModal";

const COVERS = ["/covers/cover-1.png", "/covers/cover-2.png", "/covers/cover-3.png"];

function formatTripRange(startDate: string, endDate: string) {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
}

function ImageRail() {
  const { scrollYProgress } = useScroll();
  const leftY = useTransform(scrollYProgress, [0, 0.4], [0, 80]);
  const centerY = useTransform(scrollYProgress, [0, 0.4], [0, -30]);
  const rightY = useTransform(scrollYProgress, [0, 0.4], [0, 110]);

  return (
    <div className="mt-12 grid gap-4 lg:grid-cols-[0.78fr_1.62fr_0.78fr]">
      <motion.div style={{ y: leftY }} className="relative hidden h-[28rem] overflow-hidden rounded-[1.5rem] lg:block">
        <Image src={COVERS[1]} alt="" fill className="object-cover opacity-28" />
      </motion.div>

      <motion.div style={{ y: centerY }} className="relative h-[22rem] overflow-hidden rounded-[1.6rem] sm:h-[28rem]">
        <Image src={COVERS[0]} alt="Featured trip" fill priority className="object-cover" />
      </motion.div>

      <motion.div style={{ y: rightY }} className="relative hidden h-[28rem] overflow-hidden rounded-[1.5rem] lg:block">
        <Image src={COVERS[2]} alt="" fill className="object-cover opacity-28" />
      </motion.div>
    </div>
  );
}

function ScrollFrames() {
  const { scrollYProgress } = useScroll();
  const firstY = useTransform(scrollYProgress, [0.18, 0.52], [90, -30]);
  const secondY = useTransform(scrollYProgress, [0.18, 0.52], [-40, 70]);
  const secondOpacity = useTransform(scrollYProgress, [0.2, 0.34, 0.5], [0.25, 0.8, 1]);

  return (
    <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
      <motion.div style={{ y: firstY }} className="relative h-[24rem] overflow-hidden rounded-[1.5rem] sm:h-[30rem]">
        <Image src={COVERS[2]} alt="" fill className="object-cover" />
      </motion.div>

      <motion.div style={{ y: secondY, opacity: secondOpacity }} className="relative h-[24rem] overflow-hidden rounded-[1.5rem] sm:h-[30rem]">
        <Image src={COVERS[1]} alt="" fill className="object-cover" />
      </motion.div>
    </div>
  );
}

export default function Home() {
  const trips = useQuery(api.trips.list);
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handlePrimaryAction = () => {
    if (isAuthenticated) {
      setIsCreateModalOpen(true);
      return;
    }

    router.push("/login");
  };

  if (isLoading || trips === undefined) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="space-y-4">
          {[1, 2].map((item) => (
            <div
              key={item}
              className="h-56 animate-pulse rounded-[1.6rem] bg-stone-100"
            />
          ))}
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="bg-white">
        <section className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="section-kicker">Your trips</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-stone-950 sm:text-4xl">
                Trips
              </h1>
            </div>

            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="editorial-button-primary px-5 py-3.5 text-[0.74rem]"
            >
              Add trip
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {trips.length === 0 ? (
            <div className="flex flex-col items-start gap-6 border-t border-stone-900/8 pt-8">
              <p className="max-w-xl text-sm text-stone-600">
                Your notebook is empty. Create your first trip to start collecting destinations, voting proposals, tracking the budget, and sharing the chat.
              </p>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="editorial-button-primary px-5 py-3.5 text-[0.74rem]"
              >
                Create your first trip
                <Plus className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {trips.map((trip, index) => {
                const cover = trip.coverUrl || COVERS[index % COVERS.length];

                return (
                  <motion.div
                    key={trip._id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Link href={`/trip/${trip._id}`} className="group block">
                      <article className="grid gap-5 rounded-[1.6rem] border border-stone-900/8 bg-white p-4 transition-shadow hover:shadow-[0_12px_36px_rgba(15,15,15,0.06)] sm:grid-cols-[260px_1fr] sm:p-5">
                        <div className="relative h-52 overflow-hidden rounded-[1.2rem] sm:h-44">
                          <Image
                            src={cover}
                            alt={trip.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                          />
                        </div>

                        <div className="flex min-h-full flex-col justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-stone-500">
                              <span className="inline-flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                {trip.destination}
                              </span>
                              <span className="inline-flex items-center gap-2">
                                <CalendarDays className="h-4 w-4" />
                                {formatTripRange(trip.startDate, trip.endDate)}
                              </span>
                            </div>

                            <h3 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-stone-950 sm:text-3xl">
                              {trip.title}
                            </h3>
                          </div>

                          <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-stone-950">
                            Open trip
                            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                          </div>
                        </div>
                      </article>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        <CreateTripModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="bg-white">
      <section className="mx-auto max-w-7xl px-4 pb-14 pt-14 sm:px-6 lg:px-8 lg:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="section-kicker">Shared trip planning</p>
          <h1 className="balanced mt-4 text-[clamp(2.8rem,7vw,4.8rem)] font-semibold leading-[0.95] tracking-[-0.06em] text-stone-950">
            Plan the trip in one quiet, beautiful place.
          </h1>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handlePrimaryAction}
              className="editorial-button-primary px-5 py-3.5 text-[0.74rem]"
            >
              Sign in to begin
              <ArrowUpRight className="h-4 w-4" />
            </button>

            <Link href="/login" className="editorial-button-secondary px-5 py-3.5 text-[0.74rem]">
              Open the app
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>

        <ImageRail />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-x-12 gap-y-8 border-t border-stone-900/8 pt-10 md:grid-cols-3">
          <div>
            <p className="section-kicker">Destination and dates</p>
            <p className="mt-3 text-lg font-medium tracking-[-0.03em] text-stone-950">
              Start with the actual trip and let everything else attach to it.
            </p>
          </div>
          <div>
            <p className="section-kicker">Group decisions</p>
            <p className="mt-3 text-lg font-medium tracking-[-0.03em] text-stone-950">
              Proposals, voting, budget, and availability stay close to each other.
            </p>
          </div>
          <div>
            <p className="section-kicker">Shared memory</p>
            <p className="mt-3 text-lg font-medium tracking-[-0.03em] text-stone-950">
              Keep cover image, gallery, and chat in the same notebook after the plan becomes real.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-18 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="section-kicker">Scroll</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight tracking-[-0.05em] text-stone-950 sm:text-4xl">
            Images carry the mood. The interface stays out of the way.
          </h2>
        </div>
        <ScrollFrames />
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 pt-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
          <div className="border-t border-stone-900/8 pt-5">
            <p className="section-kicker">01</p>
            <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-stone-950">
              Create a trip and set the real dates.
            </h3>
            <p className="mt-3 max-w-lg text-base leading-7 text-stone-500">
              Start with destination and dates.
            </p>
          </div>

          <div className="border-t border-stone-900/8 pt-5">
            <p className="section-kicker">02</p>
            <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-stone-950">
              Invite the group and collect decisions in one thread.
            </h3>
            <p className="mt-3 max-w-lg text-base leading-7 text-stone-500">
              Keep places, budget, and chat in one flow.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-[1.6rem] lg:col-span-2">
            <Image
              src={COVERS[0]}
              alt="Trip planning preview"
              width={1600}
              height={900}
              className="h-[26rem] w-full object-cover"
            />
          </div>
        </div>
      </section>

      <CreateTripModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
