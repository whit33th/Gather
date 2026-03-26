"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { ArrowUpRight, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "../convex/_generated/api";
import { tripDateRangeSchema } from "../lib/validation/tripDates";
import LocationSearch from "./LocationSearch";
import ImageKitUpload from "./ImageKitUpload";

type SelectedLocation = {
  place_name: string;
  center: [number, number];
};

const fieldLabelClassName = "section-kicker text-[0.62rem] text-stone-600";

export default function CreateTripModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [lat, setLat] = useState<number | undefined>();
  const [lng, setLng] = useState<number | undefined>();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const createTrip = useMutation(api.trips.create);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    const dateValidation = tripDateRangeSchema.safeParse({
      startDate,
      endDate,
    });
    if (!dateValidation.success) {
      setSubmitError(dateValidation.error.issues[0]?.message ?? "Check the trip dates.");
      return;
    }

    setIsSubmitting(true);

    try {
      const tripId = await createTrip({
        title,
        destination,
        startDate,
        endDate,
        coverUrl: coverUrl || undefined,
        lat,
        lng,
        locationName: destination,
      });

      onClose();
      router.push(`/trip/${tripId}`);
    } catch (error) {
      console.error(error);
      setSubmitError("Could not create trip.");
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* overlay */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-stone-950/20 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* modal */}
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-4xl rounded-[2rem] bg-white p-6 shadow-[0_24px_80px_rgba(15,15,15,0.18)] sm:p-8"
          >
            {/* close */}
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-3 hover:bg-stone-100 transition"
            >
              <X className="h-4 w-4" />
            </button>

            {/* header */}
            <div className="max-w-xl">
              <p className="section-kicker">Create trip</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-stone-950 sm:text-4xl">
                New trip
              </h2>
            </div>

            {/* CONTENT */}
            <form
              onSubmit={handleSubmit}
              className="mt-8 grid gap-8 lg:grid-cols-2"
            >
              {/* LEFT — COVER */}
              <div className="w-full">
                <label className={fieldLabelClassName}>Cover</label>

                <div className="mt-3 w-full flex justify-center items-center aspect-square overflow-hidden rounded-[1.4rem] bg-[#eff0ef] relative">
                  {coverUrl ? (
                    <>
                      <Image
                        src={coverUrl}
                        alt="Trip cover"
                        fill
                        className="object-cover"
                      />

                      <button
                        type="button"
                        onClick={() => setCoverUrl("")}
                        className="absolute right-3 top-3 p-2 bg-white/80 backdrop-blur rounded-full hover:bg-white transition"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    <ImageKitUpload
                      folder="/gather/covers"
                      label="Upload cover"
                      onSuccess={(url) => setCoverUrl(url)}
                      buttonClassName="flex flex-1 h-full w-full *:h-full *:w-full items-center justify-center text-sm font-medium text-stone-600 transition hover:bg-[#e5e8e5]"
                    />
                  )}
                </div>
              </div>

              {/* RIGHT — FORM */}
              <div className="flex flex-col gap-6 justify-between">
                {/* title */}
                <div>
                  <label htmlFor="title" className={fieldLabelClassName}>
                    Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="editorial-input mt-3"
                    placeholder="Summer in Tokyo"
                  />
                </div>

                {/* destination */}
                <div>
                  <label htmlFor="trip-destination" className={fieldLabelClassName}>
                    Destination
                  </label>
                  <div className="mt-3">
                    <LocationSearch
                      id="trip-destination"
                      name="destination"
                      required
                      value={destination}
                      onValueChange={(value) => {
                        setDestination(value);
                        setLat(undefined);
                        setLng(undefined);
                      }}
                      onSelect={(location: SelectedLocation) => {
                        setDestination(location.place_name);
                        setLng(location.center[0]);
                        setLat(location.center[1]);
                      }}
                      placeholder="Tokyo, Japan"
                    />
                  </div>
                </div>

                {/* dates */}
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="startDate" className={fieldLabelClassName}>
                      Start
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      required
                      value={startDate}
                      onChange={(e) => {
                        setSubmitError("");
                        setStartDate(e.target.value);
                      }}
                      className="editorial-input mt-3 [color-scheme:light]"
                    />
                  </div>

                  <div>
                    <label htmlFor="endDate" className={fieldLabelClassName}>
                      End
                    </label>
                    <input
                      type="date"
                      id="endDate"
                      required
                      value={endDate}
                      onChange={(e) => {
                        setSubmitError("");
                        setEndDate(e.target.value);
                      }}
                      className="editorial-input mt-3 [color-scheme:light]"
                    />
                  </div>
                </div>

                {/* error */}
                {submitError && (
                  <p className="rounded-[1rem] bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {submitError}
                  </p>
                )}

                {/* submit */}
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="editorial-button-primary flex items-center gap-2 px-5 py-3 text-[0.68rem] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? "Creating..." : "Create trip"}
                    <ArrowUpRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
