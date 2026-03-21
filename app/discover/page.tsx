"use client";

import { Compass, MapPin, Sparkles, Waves } from "lucide-react";

const discoverCards = [
  {
    title: "Coastal escapes",
    body: "Warm-water stays, island notebooks, and slower group itineraries.",
    icon: Waves,
  },
  {
    title: "City weekends",
    body: "Dense hotel options, food spots, and compact plans that stay easy to scan.",
    icon: Compass,
  },
  {
    title: "Nature routes",
    body: "Trails, viewpoints, and shared logistics when the trip stretches across the map.",
    icon: MapPin,
  },
];

export default function DiscoverPage() {
  return (
    <div className="page-shell">
      <section className="mx-auto max-w-7xl px-4 pb-8 pt-6 sm:px-6 lg:px-8">
        <div className="glass-panel mesh-card overflow-hidden rounded-[2.5rem] p-6 sm:p-8">
          <p className="section-kicker">Discover</p>
          <div className="mt-4 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <h1 className="max-w-3xl text-[clamp(3rem,7vw,5.6rem)] font-semibold leading-[0.92] tracking-[-0.07em] text-white">
                A place for trip ideas before they become notebooks.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
                This view is the lighter discovery surface in the shell: inspirations,
                directions, and themes you can promote into a real trip flow later.
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#ff5a21] text-white">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Discovery board</p>
                  <p className="text-sm text-white/50">Loose concepts, tighter later</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-3">
          {discoverCards.map((card) => {
            const Icon = card.icon;

            return (
              <article key={card.title} className="glass-panel rounded-[2rem] p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12 text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-6 text-2xl font-semibold tracking-[-0.05em] text-white">
                  {card.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-white/68">{card.body}</p>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
