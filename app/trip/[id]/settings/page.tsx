"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import type { Route } from "next";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Settings2 } from "lucide-react";
import AppState from "../../../../components/AppState";
import LocationSearch from "../../../../components/LocationSearch";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

type SelectedLocation = {
  place_name: string;
  center: [number, number];
};

export default function TripSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as Id<"trips">;
  const trip = useQuery(api.trips.get, { tripId });
  const updateTrip = useMutation(api.trips.update);

  const initialValues = useMemo(
    () => ({
      title: trip?.title || "",
      destination: trip?.destination || "",
      startDate: trip?.startDate || "",
      endDate: trip?.endDate || "",
      lat: trip?.lat,
      lng: trip?.lng,
      locationName: trip?.locationName || trip?.destination || "",
    }),
    [trip]
  );

  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [lat, setLat] = useState<number | undefined>();
  const [lng, setLng] = useState<number | undefined>();
  const [locationName, setLocationName] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Keep hook order stable across renders:
  // always declare hooks before any early return.
  useEffect(() => {
    if (trip == null) return;
    if (isDirty) return;
    setTitle(initialValues.title);
    setDestination(initialValues.destination);
    setStartDate(initialValues.startDate);
    setEndDate(initialValues.endDate);
    setLat(initialValues.lat);
    setLng(initialValues.lng);
    setLocationName(initialValues.locationName);
  }, [initialValues, isDirty, trip]);

  if (trip === undefined) {
    return (
      <AppState
        loading
        eyebrow="Trip settings"
        title="Loading settings"
        description="Fetching the current notebook details before editing."
      />
    );
  }

  if (trip === null) {
    return (
      <AppState
        eyebrow="Trip unavailable"
        title="You cannot edit this trip."
        description="Only members with access to this notebook can change its settings."
      />
    );
  }

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
    } catch (error) {
      console.error(error);
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white">
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href={`/trip/${tripId}` as Route}
          className="inline-flex items-center gap-2 text-sm font-medium text-stone-700 transition-colors hover:text-stone-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to trip
        </Link>

        <div className="mt-8 overflow-hidden rounded-[2.2rem] border border-stone-900/8 bg-[#f7f4ef]">
          <div className="border-b border-stone-900/8 bg-white px-5 py-6 sm:px-6">
            <p className="section-kicker">Trip settings</p>
            <div className="mt-3 flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#eff0ef] text-stone-700">
                <Settings2 className="h-5 w-5" />
              </span>
              <div>
                <h1 className="font-serif text-4xl tracking-[-0.05em] text-stone-950">Edit trip</h1>
                <p className="mt-2 text-sm text-stone-500">
                  Update the title, place and travel window from one quiet settings page.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-6 px-5 py-6 sm:px-6">
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
              <label htmlFor="trip-settings-destination" className="section-kicker text-[0.58rem]">
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

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="section-kicker text-[0.58rem]">Start</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => {
                    setIsDirty(true);
                    setStartDate(event.target.value);
                  }}
                  className="editorial-input mt-3 [color-scheme:light]"
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
                  className="editorial-input mt-3 [color-scheme:light]"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="editorial-button-primary justify-center px-5 py-3 text-[0.66rem] disabled:opacity-60"
              >
                Save changes
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
