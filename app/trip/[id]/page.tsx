"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Flag,
  Heart,
  Hotel,
  Link as LinkIcon,
  MapPin,
  Settings2,
  Utensils,
} from "lucide-react";
import TripTabs from "../../../components/trip/TripTabs";
import UserAvatar from "../../../components/UserAvatar";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

type PhotoCard = {
  _id: string;
  url: string;
  uploaderName: string;
  uploaderImage?: string;
  uploaderUserId?: string;
};

type ProposalCard = {
  _id: string;
  name: string;
  locationName?: string;
  imageUrl?: string;
  link?: string;
  category?: "accommodation" | "food" | "activity" | "favorite";
  votes: number;
  authorName: string;
  authorImage?: string;
  authorUserId?: string;
};

type AvailabilityMember = {
  userId: string;
  name: string;
  image?: string;
  role?: "owner" | "member";
  isCurrentUser?: boolean;
};

function formatTripRange(startDate: string, endDate: string) {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
}

const categoryIconMap = {
  accommodation: <Hotel className="h-4 w-4" />,
  food: <Utensils className="h-4 w-4" />,
  activity: <Flag className="h-4 w-4" />,
  favorite: <Heart className="h-4 w-4 fill-current" />,
};

const categoryLabelMap = {
  accommodation: "Stay",
  food: "Food",
  activity: "Activity",
  favorite: "Favorite",
};

export default function TripPage() {
  const params = useParams();
  const tripId = params.id as Id<"trips">;

  const trip = useQuery(api.trips.get, { tripId });
  const photos = useQuery(api.photos.list, { tripId }) as PhotoCard[] | undefined;
  const proposals = useQuery(api.proposals.listAccommodations, { tripId }) as
    | ProposalCard[]
    | undefined;
  const travelers = useQuery(api.availabilities.list, { tripId }) as
    | AvailabilityMember[]
    | undefined;
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const currentViewer = travelers?.find((traveler) => traveler.isCurrentUser);

  if (trip === undefined) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-stone-900/60" />
      </div>
    );
  }

  if (trip === null) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-4">
        <div className="w-full rounded-[1.6rem] border border-stone-900/8 bg-white p-8 text-center">
          <p className="section-kicker">Trip unavailable</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-stone-950">
            This trip is not available to you.
          </h1>
        </div>
      </div>
    );
  }

  const heroImage = trip.coverUrl || photos?.[0]?.url;
  const sortedProposals = [...(proposals || [])].sort(
    (left, right) => right.votes - left.votes || left.name.localeCompare(right.name)
  );
  const leadProposal = sortedProposals[0];
  const selectedProposals = [
    trip.selectedAccommodationId,
    trip.selectedFoodId,
    trip.selectedActivityId,
    trip.selectedFavoriteId,
  ]
    .map((proposalId) => sortedProposals.find((proposal) => proposal._id === proposalId))
    .filter((proposal): proposal is ProposalCard => Boolean(proposal));

  const handleCopyLink = async () => {
    const inviteUrl = `${window.location.origin}/invite/${trip._id}`;
    setCopyError(null);

    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      setCopyError("Couldn't copy the invite link. You can copy it from the URL bar.");
    }
  };

  return (
    <div className="bg-white">
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(162,180,167,0.22),_transparent_42%),radial-gradient(circle_at_top_right,_rgba(215,189,163,0.24),_transparent_30%),linear-gradient(180deg,_#f7f3ee_0%,_#ffffff_58%)]" />

        <div className="relative mx-auto max-w-[90rem] px-4 pb-8 pt-10 sm:px-6 lg:px-8">
          <div className="flex items-start justify-between gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-stone-700 transition-colors hover:text-stone-950"
            >
              <ArrowLeft className="h-4 w-4" />
              All trips
            </Link>

            {currentViewer?.role === "owner" ? (
              <Link
                href={`/trip/${tripId}/settings`}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-900/8 bg-white/74 text-stone-600 backdrop-blur-[6px] transition-colors hover:text-stone-950"
                aria-label="Edit trip settings"
              >
                <Settings2 className="h-4 w-4" />
              </Link>
            ) : null}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 grid items-end gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.72fr)] lg:gap-12"
          >
            <div className="max-w-4xl pb-2">
              <p className="section-kicker text-stone-700/70">Trip notebook</p>
              <h1 className="balanced mt-4 text-[clamp(3rem,8vw,6.2rem)] font-semibold leading-[0.92] tracking-[-0.065em] text-stone-950">
                {trip.title}
              </h1>

              <div className="mt-5 flex items-center gap-3">
                <div className="flex">
                  {(travelers || []).slice(0, 4).map((traveler, index) => (
                    <div
                      key={`${traveler.userId}-${index}`}
                      className={index === 0 ? "" : "-ml-2.5"}
                    >
                      <UserAvatar
                        name={traveler.name}
                        image={traveler.image}
                        seed={traveler.userId}
                        size={36}
                        className="ring-2 ring-white"
                      />
                    </div>
                  ))}
                  {(travelers?.length || 0) > 4 ? (
                    <div className="-ml-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-stone-950 text-[0.66rem] font-semibold text-white ring-2 ring-white">
                      +{(travelers?.length || 0) - 4}
                    </div>
                  ) : null}
                </div>
                <p className="text-sm font-medium text-stone-600">
                  {travelers?.length || 0} traveler{(travelers?.length || 0) === 1 ? "" : "s"}
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-3 text-sm text-stone-700">
                <span className="inline-flex items-center gap-2 rounded-full border border-stone-900/8 bg-white/72 px-4 py-2.5 backdrop-blur-[6px]">
                  <MapPin className="h-4 w-4" />
                  {trip.destination}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-stone-900/8 bg-white/72 px-4 py-2.5 backdrop-blur-[6px]">
                  <CalendarDays className="h-4 w-4" />
                  {formatTripRange(trip.startDate, trip.endDate)}
                </span>
              </div>

              {selectedProposals.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-3">
                  {selectedProposals.map((proposal) => {
                    const category = proposal.category || "accommodation";
                    return (
                      <div
                        key={proposal._id}
                        className="flex min-w-[16rem] items-center gap-3 rounded-[1.35rem] border border-stone-900/8 bg-white/78 px-3 py-3 backdrop-blur-[6px]"
                      >
                        <div className="relative h-14 w-14 overflow-hidden rounded-[1rem] bg-[#ebe4d9]">
                          {proposal.imageUrl ? (
                            <Image
                              src={proposal.imageUrl}
                              alt={proposal.name}
                              fill
                              unoptimized
                              className="object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <p className="inline-flex items-center gap-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-stone-500">
                            {categoryIconMap[category]}
                            {categoryLabelMap[category]}
                          </p>
                          <p className="mt-1 truncate text-sm font-semibold text-stone-950">
                            {proposal.name}
                          </p>
                          <p className="mt-1 truncate text-xs uppercase tracking-[0.14em] text-stone-500">
                            {proposal.locationName || trip.destination}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="editorial-button-secondary bg-white/80 px-5 py-3 text-[0.68rem] backdrop-blur-[6px]"
                >
                  {copied ? <Check className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
                  {copied ? "Invite copied" : "Copy invite link"}
                </button>

                {copyError ? (
                  <p className="w-full text-sm text-rose-600" role="status" aria-live="polite">
                    {copyError}
                  </p>
                ) : null}

                {selectedProposals.length === 0 && leadProposal ? (
                  <div className="inline-flex items-center gap-3 rounded-full border border-stone-900/8 bg-white/78 px-4 py-3 backdrop-blur-[6px]">
                    <UserAvatar
                      name={leadProposal.authorName}
                      image={leadProposal.authorImage}
                      seed={leadProposal.authorUserId || leadProposal.authorName}
                      size={32}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-stone-950">
                        {leadProposal.name}
                      </p>
                      <p className="mt-0.5 truncate text-[0.68rem] uppercase tracking-[0.14em] text-stone-500">
                        {leadProposal.authorName} / {leadProposal.votes} votes
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="justify-self-end">
              <div className="relative w-full max-w-[36rem] overflow-hidden rounded-[2rem] border border-white/70 bg-[#ebe7e1] shadow-[0_28px_80px_rgba(61,42,24,0.16)]">
                {heroImage ? (
                  <>
                    <Image
                      src={heroImage}
                      alt={trip.title}
                      width={960}
                      height={1200}
                      priority
                      className="h-[20rem] w-full object-cover sm:h-[24rem] lg:h-[28rem]"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-stone-950/24 via-transparent to-transparent" />
                  </>
                ) : (
                  <div className="h-[20rem] w-full bg-[linear-gradient(135deg,_#ded8cf_0%,_#f4efe8_100%)] sm:h-[24rem] lg:h-[28rem]" />
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-[90rem] px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <TripTabs trip={trip} tripId={tripId} />
      </section>
    </div>
  );
}
