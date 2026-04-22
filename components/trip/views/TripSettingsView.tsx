"use client";

import type { Preloaded } from "convex/react";
import { useMutation, usePreloadedQuery } from "convex/react";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import {
  ArrowUpRight,
  CalendarDays,
  Type,
  X
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import ImageKitUpload, { uploadImageWithImageKit } from "@/components/ImageKitUpload";
import LocationSearch from "@/components/LocationSearch";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { tripDateRangeSchema } from "@/lib/validation/tripDates";

type SelectedLocation = {
  place_name: string;
  center: [number, number];
};

export default function TripSettingsView({
  preloadedTrip,
  tripId,
}: {
  preloadedTrip: Preloaded<typeof api.trips.get>;
  tripId: Id<"trips">;
}) {
  const trip = usePreloadedQuery(preloadedTrip) as Doc<"trips">;
  const updateTrip = useMutation(api.trips.update);
  const initialValues = useMemo(
    () => ({
      title: trip.title,
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
      coverUrl: trip.coverUrl || "",
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
  const [coverUrl, setCoverUrl] = useState(trip.coverUrl || "");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [lat, setLat] = useState<number | undefined>(trip.lat);
  const [lng, setLng] = useState<number | undefined>(trip.lng);
  const [locationName, setLocationName] = useState(trip.locationName || trip.destination);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

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
    setCoverUrl(initialValues.coverUrl);
    setCoverFile(null);
    setLat(initialValues.lat);
    setLng(initialValues.lng);
    setLocationName(initialValues.locationName);
  }, [initialValues, isDirty]);

  useEffect(() => {
    if (!coverUrl.startsWith("blob:")) return;
    return () => URL.revokeObjectURL(coverUrl);
  }, [coverUrl]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaveError("");

    const dateValidation = tripDateRangeSchema.safeParse({
      startDate,
      endDate,
    });
    if (!dateValidation.success) {
      setSaveError(dateValidation.error.issues[0]?.message ?? "Check the trip dates.");
      return;
    }

    setIsSaving(true);

    try {
      const uploadedCoverUrl =
        coverFile !== null
          ? await uploadImageWithImageKit({ file: coverFile, folder: "/gather/covers" })
          : coverUrl || undefined;

      await updateTrip({
        tripId,
        title,
        destination,
        startDate,
        endDate,
        coverUrl: uploadedCoverUrl,
        lat,
        lng,
        locationName: locationName || destination || undefined,
      });
      setIsDirty(false);
      setCoverFile(null);
      setIsSaving(false);
    } catch (error) {
      console.error(error);
      setSaveError(error instanceof Error ? error.message : "Could not save trip settings.");
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-full px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <form
          id="trip-settings-form"
          onSubmit={handleSubmit}
          className=""
        >
          <div className="grid gap-6">
            <section className="glass-panel relative z-20 overflow-visible rounded-[2.1rem] p-5 sm:p-6">
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

                <div>
                  <label className="section-kicker text-[0.58rem]">Cover photo</label>
                  <div className="mt-3 relative aspect-video overflow-hidden rounded-2xl border border-dashed border-white/12 bg-paper/60">
                    {coverUrl ? (
                      <>
                        <Image src={coverUrl} alt="Trip cover" fill className="object-cover" unoptimized />
                        <button
                          type="button"
                          onClick={() => {
                            setIsDirty(true);
                            setCoverUrl("");
                            setCoverFile(null);
                          }}
                          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white/80 backdrop-blur transition hover:bg-black/80"
                          aria-label="Remove cover image"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center p-3">
                        <div className="w-full h-full">
                          <ImageKitUpload
                            uploadMode="manual"
                            mode="button"
                            label="Upload cover"
                            onFileSelect={(file) => {
                              setCoverFile(file);
                              if (!file) {
                                setCoverUrl("");
                                return;
                              }
                              const localPreviewUrl = URL.createObjectURL(file);
                              setCoverUrl(localPreviewUrl);
                              setIsDirty(true);
                            }}
                            buttonClassName="flex h-full w-full items-center justify-center rounded-xl border border-white/14 bg-transparent text-sm font-medium text-white/60 transition hover:border-white/24 hover:text-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-white/46">
                    New image is uploaded only when you save changes.
                  </p>
                </div>
              </div>
            </section>

            <section className="glass-panel relative z-0 rounded-[2.1rem] p-5 sm:p-6">
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
                      setSaveError("");
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
                      setSaveError("");
                      setEndDate(event.target.value);
                    }}
                    className="editorial-input mt-3 [color-scheme:dark]"
                  />
                </div>
              </div>

              {saveError ? (
                <p className="mt-4 rounded-[1rem] bg-rose-500/14 px-4 py-3 text-sm text-rose-100">
                  {saveError}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSaving}
                className="editorial-button-primary mt-6 justify-center px-5 py-3 text-[0.66rem] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save changes"}
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </section>
          </div>

        </form>
      </div>
    </div>
  );
}
