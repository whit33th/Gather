"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { Plus, X, Loader2, MapPin, Calendar, Type, ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "../convex/_generated/api";
import { tripDateRangeSchema } from "../lib/validation/tripDates";
import LocationSearch from "./LocationSearch";
import ImageKitUpload, { uploadImageWithImageKit } from "./ImageKitUpload";

type SelectedLocation = {
  place_name: string;
  center: [number, number];
};

export default function CreateTripModalNew({
  isOpen,
  onClose,
  initialDestination = "",
  initialLat,
  initialLng,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialDestination?: string;
  initialLat?: number;
  initialLng?: number;
}) {
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState(initialDestination);
  const [lat, setLat] = useState<number | undefined>(initialLat);
  const [lng, setLng] = useState<number | undefined>(initialLng);

  useEffect(() => {
    if (isOpen) {
      setDestination(initialDestination);
      setLat(initialLat);
      setLng(initialLng);
    }
  }, [isOpen, initialDestination, initialLat, initialLng]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!coverUrl.startsWith("blob:")) return;
    return () => URL.revokeObjectURL(coverUrl);
  }, [coverUrl]);

  const createTrip = useMutation(api.trips.create);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    const dateValidation = tripDateRangeSchema.safeParse({
      startDate,
      endDate,
    });
    if (!dateValidation.success) {
      setSubmitError(
        dateValidation.error.issues[0]?.message ?? "Check the trip dates."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const uploadedCoverUrl =
        coverFile !== null
          ? await uploadImageWithImageKit({ file: coverFile, folder: "/gather/covers" })
          : coverUrl || undefined;

      const tripId = await createTrip({
        title,
        destination,
        startDate,
        endDate,
        coverUrl: uploadedCoverUrl,
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
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* modal */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className={`relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/10 p-6 shadow-[0_32px_100px_rgba(0,0,0,0.5)] backdrop-blur-3xl sm:p-8 transition-colors duration-500 ${
              coverUrl
                ? "bg-black/60"
                : "bg-gradient-to-b from-paper-strong/98 to-background/96"
            }`}
          >
            {/* close */}
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            {/* header */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/15 text-accent">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold tracking-[-0.04em] text-white">
                  New trip
                </h2>
                <p className="text-xs text-white/40">
                  Fill in the details to get started
                </p>
              </div>
            </div>

            {/* form */}
            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              {/* title */}
              <div className="flex flex-col gap-2">
                <label className="inline-flex items-center gap-1.5 text-[0.62rem] font-bold tracking-widest uppercase text-white/50">
                  <Type className="h-3.5 w-3.5" />
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-[0.9rem] border border-white/10 bg-paper/70 px-4 py-3 text-sm text-white backdrop-blur-md transition-all focus:border-accent/34 focus:outline-none focus:ring-4 focus:ring-accent/10"
                  placeholder="Summer in Tokyo"
                />
              </div>

              {/* destination */}
              <div className="flex flex-col gap-2">
                <label className="inline-flex items-center gap-1.5 text-[0.62rem] font-bold tracking-widest uppercase text-white/50">
                  <MapPin className="h-3.5 w-3.5" />
                  Destination
                </label>
                <div className="[&_input]:w-full [&_input]:rounded-[0.9rem] [&_input]:border [&_input]:border-white/10 [&_input]:bg-paper/70 [&_input]:px-4 [&_input]:py-3 [&_input]:text-sm [&_input]:text-white [&_input]:backdrop-blur-md [&_input]:transition-all [&_input]:focus:border-accent/34 [&_input]:focus:outline-none [&_input]:focus:ring-4 [&_input]:focus:ring-accent/10">
                  <LocationSearch
                    id="new-trip-destination"
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
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <label className="inline-flex items-center gap-1.5 text-[0.62rem] font-bold tracking-widest uppercase text-white/50">
                    <Calendar className="h-3.5 w-3.5" />
                    Start
                  </label>
                  <input
                    type="date"
                    required
                    lang="en-GB"
                    value={startDate}
                    onChange={(e) => {
                      setSubmitError("");
                      setStartDate(e.target.value);
                    }}
                    className="w-full rounded-[0.9rem] border border-white/10 bg-paper/70 px-4 py-3 text-sm text-white backdrop-blur-md transition-all focus:border-accent/34 focus:outline-none focus:ring-4 focus:ring-accent/10 [color-scheme:dark]"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="inline-flex items-center gap-1.5 text-[0.62rem] font-bold tracking-widest uppercase text-white/50">
                    <Calendar className="h-3.5 w-3.5" />
                    End
                  </label>
                  <input
                    type="date"
                    required
                    lang="en-GB"
                    value={endDate}
                    onChange={(e) => {
                      setSubmitError("");
                      setEndDate(e.target.value);
                    }}
                    className="w-full rounded-[0.9rem] border border-white/10 bg-paper/70 px-4 py-3 text-sm text-white backdrop-blur-md transition-all focus:border-accent/34 focus:outline-none focus:ring-4 focus:ring-accent/10 [color-scheme:dark]"
                  />
                </div>
              </div>

              {/* cover */}
              <div className="flex flex-col gap-2">
                <label className="inline-flex items-center gap-1.5 text-[0.62rem] font-bold tracking-widest uppercase text-white/50">
                  <ImageIcon className="h-3.5 w-3.5" />
                  Cover photo
                  <span className="ml-1 text-white/30">(optional)</span>
                </label>
                <div className="relative aspect-video overflow-hidden rounded-2xl border border-dashed border-white/12 bg-paper/60">
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
                        onClick={() => {
                          setCoverUrl("");
                          setCoverFile(null);
                        }}
                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white/80 backdrop-blur transition hover:bg-black/80"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    <ImageKitUpload
                      uploadMode="manual"
                      label="Upload cover"
                      onFileSelect={(file) => {
                        setCoverFile(file);
                        if (!file) {
                          setCoverUrl("");
                          return;
                        }
                        const localPreviewUrl = URL.createObjectURL(file);
                        setCoverUrl(localPreviewUrl);
                      }}
                      buttonClassName="flex flex-1 h-full w-full *:h-full *:w-full items-center justify-center text-sm font-medium text-white/40 transition hover:text-white/60"
                    />
                  )}
                </div>
              </div>

              {/* error */}
              {submitError && (
                <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
                  {submitError}
                </p>
              )}

              {/* submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="editorial-button-primary w-full justify-center px-5 py-3.5 text-[0.72rem] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    Create trip
                    <Plus className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
