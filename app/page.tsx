"use client";

import { useState } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { format, parseISO } from "date-fns";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Layers3,
  Map,
  MapPin,
  MessageCircle,
  Plus,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { api } from "../convex/_generated/api";
import AppState from "../components/AppState";
import CreateTripModal from "../components/CreateTripModal";

const COVERS = ["/covers/cover-1.png", "/covers/cover-2.png", "/covers/cover-3.png"];

function formatTripRange(startDate: string, endDate: string) {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
}

function HeroMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="glass-panel rounded-[1.5rem] px-4 py-4">
      <p className="section-kicker text-[0.56rem]">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-white">
        {value}
      </p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="glass-panel mesh-card rounded-[2rem] p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12 text-white">
        {icon}
      </div>
      <h3 className="mt-6 text-2xl font-semibold tracking-[-0.05em] text-white">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-6 text-white/68">{body}</p>
    </div>
  );
}

function TripCard({
  href,
  cover,
  destination,
  title,
  dateRange,
  featured = false,
}: {
  href: Route;
  cover: string;
  destination: string;
  title: string;
  dateRange: string;
  featured?: boolean;
}) {
  return (
    <Link href={href} className="group block">
      <article
        className={`glass-panel mesh-card overflow-hidden rounded-[2rem] ${featured ? "lg:grid lg:grid-cols-[1.15fr_0.85fr]" : ""
          }`}
      >
        <div className={`relative ${featured ? "min-h-[24rem]" : "h-72"}`}>
          <Image
            src={cover}
            alt={title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-linear-to-t from-stone-950/68 via-stone-950/8 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
            <div className="flex flex-wrap gap-2 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-white/72">
              <span className="rounded-full border border-white/16 bg-white/12 px-3 py-2 backdrop-blur-md">
                {destination}
              </span>
              <span className="rounded-full border border-white/16 bg-white/12 px-3 py-2 backdrop-blur-md">
                {dateRange}
              </span>
            </div>
          </div>
        </div>

        <div className="flex min-h-full flex-col justify-between p-5 sm:p-6">
          <div>
            <p className="section-kicker">Trip notebook</p>
            <h3
              className={`mt-4 font-semibold tracking-[-0.05em] text-white ${featured ? "text-4xl sm:text-5xl" : "text-3xl"
                }`}
            >
              {title}
            </h3>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/68">
              Open the notebook to review the chosen places, scan the budget, check dates,
              and keep the group aligned.
            </p>
          </div>

          <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white">
            Open trip
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </div>
        </div>
      </article>
    </Link>
  );
}

export default function Home() {
  const trips = useQuery(api.trips.list);
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const safeTrips = trips ?? [];
  const sortedTrips = [...safeTrips].sort((left, right) =>
    left.startDate.localeCompare(right.startDate)
  );
  const featuredTrip = sortedTrips[0];
  const uniqueDestinations = new Set(safeTrips.map((trip) => trip.destination)).size;

  const handlePrimaryAction = () => {
    if (isAuthenticated) {
      setIsCreateModalOpen(true);
      return;
    }

    router.push("/login");
  };

  if (isLoading || trips === undefined) {
    return (
      <AppState
        loading
        eyebrow="Trips"
        title="Loading notebooks"
        description="Preparing your workspace and recent trip data."
      />
    );
  }

  if (isAuthenticated) {
    return (
      <div className="page-shell">
        <section className="mx-auto max-w-7xl px-4 pb-8 pt-6 sm:px-6 lg:px-8">
          <div className="glass-panel mesh-card overflow-hidden rounded-[2.5rem] p-6 sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
              <div>
                <p className="section-kicker">Your travel control room</p>
                <h1 className="mt-4 max-w-3xl text-[clamp(3rem,7vw,5.8rem)] font-semibold leading-[0.92] tracking-[-0.07em] text-white">
                  Trips, but presented like something worth opening.
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
                  Your notebooks now read like a cinematic itinerary: stronger covers, clearer
                  hierarchy, glass depth, and faster scanning across the whole planning flow.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="editorial-button-primary px-5 py-3.5 text-[0.74rem]"
                  >
                    Add trip
                    <Plus className="h-4 w-4" />
                  </button>

                  <Link href="/login" className="editorial-button-secondary px-5 py-3.5 text-[0.74rem]">
                    Account
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <HeroMetric label="Open notebooks" value={`${trips.length}`} />
                <HeroMetric label="Destinations" value={`${uniqueDestinations}`} />
                <HeroMetric
                  label="Next window"
                  value={
                    featuredTrip
                      ? format(parseISO(featuredTrip.startDate), "MMM d")
                      : "None"
                  }
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          {trips.length === 0 ? (
            <div className="glass-panel mesh-card rounded-[2.3rem] p-8 sm:p-10">
              <p className="section-kicker">Empty state</p>
              <h2 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.06em] text-white sm:text-5xl">
                Your first trip should look as exciting as the idea itself.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/68">
                Start a notebook, add the destination and dates, then let proposals, chat,
                gallery, budget, and map collect around it.
              </p>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="editorial-button-primary mt-8 px-5 py-3.5 text-[0.74rem]"
              >
                Create your first trip
                <Plus className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {featuredTrip ? (
                <TripCard
                  href={`/trip/${featuredTrip._id}` as Route}
                  cover={featuredTrip.coverUrl || COVERS[0]}
                  destination={featuredTrip.destination}
                  title={featuredTrip.title}
                  dateRange={formatTripRange(featuredTrip.startDate, featuredTrip.endDate)}
                  featured
                />
              ) : null}

              <div className="grid gap-6 lg:grid-cols-2">
                {sortedTrips.slice(featuredTrip ? 1 : 0).map((trip, index) => (
                  <motion.div
                    key={trip._id}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <TripCard
                      href={`/trip/${trip._id}` as Route}
                      cover={trip.coverUrl || COVERS[(index + 1) % COVERS.length]}
                      destination={trip.destination}
                      title={trip.title}
                      dateRange={formatTripRange(trip.startDate, trip.endDate)}
                    />
                  </motion.div>
                ))}
              </div>
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
    <div className="page-shell overflow-hidden">
      <section className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8 lg:pt-10">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="glass-panel relative overflow-hidden rounded-[2.7rem] p-3 sm:p-4"
        >
          <div className="relative min-h-[78vh] overflow-hidden rounded-[2.2rem]">
            <Image
              src={COVERS[0]}
              alt="Travel hero background"
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(94,249,230,0.24),transparent_18%),linear-gradient(180deg,rgba(3,20,29,0.18),rgba(3,20,29,0.36)_30%,rgba(3,20,29,0.76)_68%,rgba(3,20,29,0.92)_100%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,18,27,0.72)_0%,rgba(4,18,27,0.2)_45%,rgba(4,18,27,0.54)_100%)]" />

            <div className="relative flex min-h-[78vh] flex-col justify-between p-5 sm:p-8 lg:p-10">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/12 bg-[#0c4a57]/48 px-4 py-2 text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-white/82 backdrop-blur-md">
                  <Sparkles className="h-3.5 w-3.5 text-[#6af2e3]" />
                  Shared trip planning
                </div>

                <div className="glass-panel hidden rounded-[1.6rem] px-4 py-4 lg:block">
                  <p className="section-kicker text-[0.54rem]">Replaceable hero</p>
                  <p className="mt-2 max-w-xs text-sm font-medium leading-6 text-white/74">
                    Drop in your own generated aerial destination image here and the layout will hold.
                  </p>
                </div>
              </div>

              <div className="grid gap-8 lg:grid-cols-[1.12fr_0.88fr] lg:items-end">
                <div>
                  <h1 className="balanced max-w-4xl text-[clamp(3.7rem,10vw,7.4rem)] font-semibold leading-[0.9] tracking-[-0.08em] text-white">
                    The trip should feel unforgettable before you even book it.
                  </h1>

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
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
                </div>

                <div className="glass-panel rounded-[2rem] p-5 sm:p-6">
                  <p className="text-base leading-7 text-white/82 sm:text-lg">
                    Gather turns destination, dates, votes, map, budget, gallery, and group
                    chat into one immersive notebook instead of a pile of tabs and messages.
                  </p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                    <HeroMetric label="One notebook" value="Map + chat + budget" />
                    <HeroMetric label="Group sync" value="Votes + dates" />
                    <HeroMetric label="Travel mood" value="Gallery + cover" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-3">
          <FeatureCard
            icon={<Map className="h-5 w-5" />}
            title="A trip page with gravity"
            body="The destination hero, chosen places, live map, and dates create a page that feels like the trip already exists."
          />
          <FeatureCard
            icon={<Users className="h-5 w-5" />}
            title="Group decisions stay visible"
            body="Availability, voting, and the running chat stay close together so the group stops losing context."
          />
          <FeatureCard
            icon={<Wallet className="h-5 w-5" />}
            title="Practical details still feel premium"
            body="Budget, checklist, links, and gallery remain fast to scan without collapsing into a dull admin dashboard."
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="glass-panel mesh-card rounded-[2.4rem] p-6 sm:p-8">
            <p className="section-kicker">From scattered to synced</p>
            <h2 className="mt-4 max-w-xl text-4xl font-semibold tracking-[-0.06em] text-white sm:text-5xl">
              Everything important lives on one surface.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-white/68">
              Instead of splitting logistics and inspiration apart, Gather keeps both in the
              same notebook. This direction leans into tropical depth, colder glass, and a
              much more cinematic first impression.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="glass-panel rounded-[2rem] p-5">
              <CalendarDays className="h-5 w-5 text-[#7ef0e2]" />
              <h3 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-white">
                Dates that anchor the plan
              </h3>
              <p className="mt-3 text-sm leading-6 text-white/68">
                Real trip dates shape the availability grid, booking decisions, and the whole rhythm of the notebook.
              </p>
            </div>

            <div className="glass-panel rounded-[2rem] p-5">
              <MapPin className="h-5 w-5 text-[#86c8ff]" />
              <h3 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-white">
                Places with context
              </h3>
              <p className="mt-3 text-sm leading-6 text-white/68">
                Each proposal sits closer to the map, the image, and the people voting on it.
              </p>
            </div>

            <div className="glass-panel rounded-[2rem] p-5">
              <Layers3 className="h-5 w-5 text-[#7ef0e2]" />
              <h3 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-white">
                Layered depth
              </h3>
              <p className="mt-3 text-sm leading-6 text-white/68">
                Darker glass, teal glow, and bold image framing make the product feel more premium without hurting clarity.
              </p>
            </div>

            <div className="glass-panel rounded-[2rem] p-5">
              <MessageCircle className="h-5 w-5 text-[#9ddcff]" />
              <h3 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-white">
                Conversation stays attached
              </h3>
              <p className="mt-3 text-sm leading-6 text-white/68">
                The group chat remains part of the same planning surface instead of becoming another disconnected thread.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        <div className="glass-panel-dark rounded-[2.4rem] p-6 text-white sm:p-8">
          <p className="section-kicker text-white/58">What this design now promises</p>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="rounded-[1.6rem] border border-white/12 bg-white/8 p-5">
              <CheckCircle2 className="h-5 w-5 text-[#ff9a73]" />
              <p className="mt-4 text-xl font-semibold tracking-[-0.04em]">Stronger first impression</p>
            </div>
            <div className="rounded-[1.6rem] border border-white/12 bg-white/8 p-5">
              <CheckCircle2 className="h-5 w-5 text-[#7fdfd5]" />
              <p className="mt-4 text-xl font-semibold tracking-[-0.04em]">More visual hierarchy</p>
            </div>
            <div className="rounded-[1.6rem] border border-white/12 bg-white/8 p-5">
              <CheckCircle2 className="h-5 w-5 text-[#ffd38a]" />
              <p className="mt-4 text-xl font-semibold tracking-[-0.04em]">A premium travel mood</p>
            </div>
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
