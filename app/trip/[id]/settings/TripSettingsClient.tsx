"use client";

import { differenceInCalendarDays, format, parseISO } from "date-fns";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  MapPin,
  Sparkles,
  Type,
} from "lucide-react";
import { useMutation } from "convex/react";
import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import LocationSearch from "@/components/LocationSearch";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";

type SelectedLocation = {
  place_name: string;
  center: [number, number];
};

export default function TripSettingsClient({
  trip,
  tripId,
}: {
  trip: Doc<"trips">;
  tripId: Id<"trips">;
}) {
  const router = useRouter();
  const updateTrip = useMutation(api.trips.update);
  const initialValues = useMemo(
    () => ({
      title: trip.title,
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
      lat: trip.lat,
      lng: trip.lng,
      locationName: trip.locationName || trip.destination,
    }),
    [trip],
  );

  const [title, setTitle] = useState(trip.title);
  const [destination, setDestination] = useState(trip.destination);
  const [startDate, setStartDate] = useState(trip.startDate);
  const [endDate, setEndDate] = useState(trip.endDate);
  const [lat, setLat] = useState<number | undefined>(trip.lat);
  const [lng, setLng] = useState<number | undefined>(trip.lng);
  const [locationName, setLocationName] = useState(trip.locationName || trip.destination);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const tripLength = useMemo(() => {
    if (!startDate || !endDate) return null;

    const nights = Math.max(
      differenceInCalendarDays(parseISO(endDate), parseISO(startDate)),
      1,
    );

    return {
      nights,
      days: nights + 1,
      range: `${format(parseISO(startDate), "MMM d")} - ${format(parseISO(endDate), "MMM d")}`,
    };
  }, [endDate, startDate]);

  useEffect(() => {
    if (isDirty) return;

    setTitle(initialValues.title);
    setDestination(initialValues.destination);
    setStartDate(initialValues.startDate);
    setEndDate(initialValues.endDate);
    setLat(initialValues.lat);
    setLng(initialValues.lng);
    setLocationName(initialValues.locationName);
  }, [initialValues, isDirty]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      await updateTrip({
        tripId,
        title,
        destination,
        startDate,
        endDate,
        lat,
        lng,
        locationName: locationName || destination || undefined,
      });
      router.push(`/trip/${tripId}` as Route);
      router.refresh();
    } catch (error) {
      console.error(error);
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-full px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href={`/trip/${tripId}` as Route}
            className="trip-glass-button trip-control-surface h-12 px-5 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to trip</span>
          </Link>

          <button
            type="submit"
            form="trip-settings-form"
            disabled={isSaving}
            className="editorial-button-primary justify-center px-5 py-3 text-[0.66rem] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save changes"}
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>

        <form
          id="trip-settings-form"
          onSubmit={handleSubmit}
          className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_21rem]"
        >
          <div className="grid gap-6">
            <section className="glass-panel rounded-[2.1rem] p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.1rem] border border-white/10 bg-white/[0.05] text-[#dbe887]">
                  <Type className="h-5 w-5" />
                </span>
                <div>
                  <p className="section-kicker">Identity</p>
                  <h2 className="mt-3 text-[1.8rem] font-semibold tracking-[-0.06em] text-white">
                    Notebook details
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-white/60">
                    Keep the title and destination precise so the board, invite flow, and
                    overview cards all stay coherent.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-6">
                <div>
                  <label className="section-kicker text-[0.58rem]">Title</label>
                  <input
                    value={title}
                    onChange={(event) => {
                      setIsDirty(true);
                      setTitle(event.target.value);
                    }}
                    className="editorial-input mt-3"
                    placeholder="Summer in Tokyo"
                  />
                </div>

                <div>
                  <label
                    htmlFor="trip-settings-destination"
                    className="section-kicker text-[0.58rem]"
                  >
                    Destination
                  </label>
                  <div className="mt-3">
                    <LocationSearch
                      id="trip-settings-destination"
                      name="destination"
                      value={locationName || destination}
                      onValueChange={(value) => {
                        setIsDirty(true);
                        setDestination(value);
                        setLocationName(value);
                        setLat(undefined);
                        setLng(undefined);
                      }}
                      onSelect={(location: SelectedLocation) => {
                        setIsDirty(true);
                        setDestination(location.place_name);
                        setLocationName(location.place_name);
                        setLng(location.center[0]);
                        setLat(location.center[1]);
                      }}
                      placeholder="Search destination"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="glass-panel rounded-[2.1rem] p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.1rem] border border-white/10 bg-white/[0.05] text-[#8fd0c0]">
                  <CalendarDays className="h-5 w-5" />
                </span>
                <div>
                  <p className="section-kicker">Schedule</p>
                  <h2 className="mt-3 text-[1.8rem] font-semibold tracking-[-0.06em] text-white">
                    Travel window
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-white/60">
                    These dates shape the overview cards, readiness, and shared planning
                    rhythm across the trip.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="section-kicker text-[0.58rem]">Start</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(event) => {
                      setIsDirty(true);
                      setStartDate(event.target.value);
                    }}
                    className="editorial-input mt-3 [color-scheme:dark]"
                  />
                </div>

                <div>
                  <label className="section-kicker text-[0.58rem]">End</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(event) => {
                      setIsDirty(true);
                      setEndDate(event.target.value);
                    }}
                    className="editorial-input mt-3 [color-scheme:dark]"
                  />
                </div>
              </div>
            </section>
          </div>

          <aside className="grid gap-6">
            <section className="glass-panel rounded-[2.1rem] p-5 sm:p-6">
              <p className="section-kicker">Live summary</p>
              <h2 className="mt-3 text-[1.9rem] font-semibold tracking-[-0.06em] text-white">
                What this page is shaping
              </h2>

              <div className="mt-6 space-y-3">
                <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-[#dbe887]" />
                    <p className="text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-white/44">
                      Destination
                    </p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/80">
                    {locationName || destination || "No destination yet"}
                  </p>
                </article>

                <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-center gap-3">
                    <CalendarDays className="h-4 w-4 text-[#8fd0c0]" />
                    <p className="text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-white/44">
                      Window
                    </p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/80">
                    {tripLength ? tripLength.range : "Choose your travel dates"}
                  </p>
                  {tripLength ? (
                    <p className="mt-2 text-[0.72rem] uppercase tracking-[0.16em] text-white/42">
                      {tripLength.days} days / {tripLength.nights} nights
                    </p>
                  ) : null}
                </article>

                <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-4 w-4 text-[#c7b0ff]" />
                    <p className="text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-white/44">
                      Board impact
                    </p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/80">
                    Hero card, readiness, and invite screens will immediately reflect the
                    updated trip identity.
                  </p>
                </article>
              </div>
            </section>

            <section className="glass-panel rounded-[2.1rem] p-5 sm:p-6">
              <p className="section-kicker">Coordinates</p>
              <h2 className="mt-3 text-[1.55rem] font-semibold tracking-[-0.05em] text-white">
                Map status
              </h2>
              <div className="mt-5 grid gap-3">
                <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.04] px-4 py-3">
                  <p className="text-[0.62rem] uppercase tracking-[0.16em] text-white/40">
                    Latitude
                  </p>
                  <p className="mt-2 text-sm font-medium text-white">
                    {lat != null ? lat.toFixed(4) : "Pending"}
                  </p>
                </div>
                <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.04] px-4 py-3">
                  <p className="text-[0.62rem] uppercase tracking-[0.16em] text-white/40">
                    Longitude
                  </p>
                  <p className="mt-2 text-sm font-medium text-white">
                    {lng != null ? lng.toFixed(4) : "Pending"}
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </form>
      </section>
    </div>
  );
}
