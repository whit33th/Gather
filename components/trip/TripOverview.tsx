"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAction, useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import {
  BedDouble,
  CalendarDays,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  CircleSlash,
  Clock3,
  DollarSign,
  Flag as FlagIcon,
  FileText,
  Heart,
  Hotel,
  Image as ImageIcon,
  LayoutGrid,
  MapPin,
  Music,
  ExternalLink,
  Package,
  Pencil,
  Pin,
  Plus,
  Send,
  ThumbsUp,
  Trash2,
  Utensils,
  X,
} from "lucide-react";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";
import {
  getProposalProvider,
  normalizeProposalLink,
  type ProposalLinkPreview,
  type ProposalProvider,
} from "../../lib/proposal-links";
import ImageKitUpload from "../ImageKitUpload";
import LocationSearch from "../LocationSearch";
import TripMap from "../TripMap";
import UserAvatar from "../UserAvatar";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "../ui/drawer";
import WeatherCard from "@/components/cards/WeatherCard";
import type {
  AvailabilityMember,
  AvailabilityStatus,
  ExpenseCard,
  ProposalCard,
  ProposalCategory,
  TaskCard,
} from "./types";

type SelectedLocation = {
  place_name: string;
  center: [number, number];
};

type PhotoCard = {
  _id: string;
  url: string;
  uploaderName: string;
  uploaderImage?: string;
  uploaderUserId?: string;
  canDelete?: boolean;
};

type SongCard = {
  _id: string;
  url: string;
  platform: "spotify" | "apple";
  addedByName: string;
  addedByImage?: string;
  addedByUserId?: string;
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const categoryMeta: Record<
  ProposalCategory,
  { label: string; icon: ReactNode; tone: string; softTone: string }
> = {
  accommodation: {
    label: "Stay",
    icon: <Hotel className="h-4 w-4" />,
    tone: "border border-sky-400/30 bg-sky-400/12 text-sky-100",
    softTone: "border-sky-400/30 bg-sky-400/14 text-sky-100",
  },
  food: {
    label: "Food",
    icon: <Utensils className="h-4 w-4" />,
    tone: "border border-amber-400/30 bg-amber-400/12 text-amber-100",
    softTone: "border-amber-400/30 bg-amber-400/14 text-amber-100",
  },
  activity: {
    label: "Activity",
    icon: <FlagIcon className="h-4 w-4" />,
    tone: "border border-emerald-400/30 bg-emerald-400/12 text-emerald-100",
    softTone: "border-emerald-400/30 bg-emerald-400/14 text-emerald-100",
  },
  favorite: {
    label: "Favorite",
    icon: <Heart className="h-4 w-4 fill-current" />,
    tone: "border border-rose-400/30 bg-rose-400/12 text-rose-100",
    softTone: "border-rose-400/30 bg-rose-400/14 text-rose-100",
  },
};

const proposalFilterMeta = [
  {
    id: "all" as const,
    label: "All",
    meta: "Everything",
    icon: <LayoutGrid className="h-4 w-4" />,
  },
  {
    id: "accommodation" as const,
    label: categoryMeta.accommodation.label,
    meta: "Places",
    icon: categoryMeta.accommodation.icon,
  },
  {
    id: "food" as const,
    label: categoryMeta.food.label,
    meta: "Dining",
    icon: categoryMeta.food.icon,
  },
  {
    id: "activity" as const,
    label: categoryMeta.activity.label,
    meta: "Plans",
    icon: categoryMeta.activity.icon,
  },
  {
    id: "favorite" as const,
    label: categoryMeta.favorite.label,
    meta: "Saved",
    icon: categoryMeta.favorite.icon,
  },
];

const taskCategoryMeta: Record<string, { icon: ReactNode; shortLabel: string }> = {
  General: { icon: <CheckSquare className="h-3.5 w-3.5" />, shortLabel: "General" },
  Packing: { icon: <Package className="h-3.5 w-3.5" />, shortLabel: "Packing" },
  Booking: { icon: <CalendarDays className="h-3.5 w-3.5" />, shortLabel: "Booking" },
  Docs: { icon: <FileText className="h-3.5 w-3.5" />, shortLabel: "Docs" },
  Food: { icon: <Utensils className="h-3.5 w-3.5" />, shortLabel: "Food" },
};

const selectionFieldByCategory = {
  accommodation: "selectedAccommodationId",
  food: "selectedFoodId",
  activity: "selectedActivityId",
  favorite: "selectedFavoriteId",
} as const;

const availabilityTone: Record<AvailabilityStatus, string> = {
  yes: "border-emerald-400/30 bg-emerald-400/14 text-emerald-100",
  no: "border-rose-400/30 bg-rose-400/14 text-rose-100",
  maybe: "border-amber-400/30 bg-amber-400/14 text-amber-100",
};

const availabilityLegend = [
  {
    id: "yes" as const,
    label: "Yes",
    icon: <Check className="h-3.5 w-3.5" />,
    className: "border-emerald-400/30 bg-emerald-400/14 text-emerald-100",
  },
  {
    id: "no" as const,
    label: "No",
    icon: <CircleSlash className="h-3.5 w-3.5" />,
    className: "border-rose-400/30 bg-rose-400/14 text-rose-100",
  },
  {
    id: "maybe" as const,
    label: "Maybe",
    icon: <Clock3 className="h-3.5 w-3.5" />,
    className: "border-amber-400/30 bg-amber-400/14 text-amber-100",
  },
];

function getProposalRankClasses(rank: number) {
  if (rank === 1) {
    return {
      card: "border-[#556246] bg-[#16241c] shadow-[0_20px_40px_rgba(0,0,0,0.2)]",
      rank: "border-[#dbe887]/32 bg-[#2a3923] text-[#eef5d0]",
    };
  }

  if (rank === 2) {
    return {
      card: "border-[#2b4035] bg-[#13211b]",
      rank: "border-[#31463c] bg-[#1a2b23] text-[#d7e1d3]",
    };
  }

  if (rank === 3) {
    return {
      card: "border-[#2b4035] bg-[#14231c]",
      rank: "border-[#46584a] bg-[#1d3027] text-[#d7e1d3]",
    };
  }

  return {
    card: "border-[#23372e] bg-[#12201a]",
    rank: "border-[#31463c] bg-[#172821] text-[#9fb0a3]",
  };
}

function getProviderLabel(provider: ProposalProvider) {
  if (provider === "airbnb") return "Airbnb";
  if (provider === "booking") return "Booking";
  return "Link";
}

function ProposalProviderMark({ provider }: { provider: ProposalProvider }) {
  if (!provider) return null;

  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-white/12 bg-white/10 text-[0.7rem] font-bold text-white/82">
      {provider === "airbnb" ? "A" : "B"}
    </span>
  );
}

function ProposalProviderBadge({
  provider,
  subtle = false,
}: {
  provider: ProposalProvider;
  subtle?: boolean;
}) {
  if (!provider) return null;

  const palette =
    provider === "airbnb"
      ? subtle
        ? "border-[#ffd7dc] bg-[#fff3f5] text-[#d9425f]"
        : "bg-[#fff1f4] text-[#d9425f]"
      : subtle
        ? "border-[#d8e4fb] bg-[#f3f7ff] text-[#255dc7]"
        : "bg-[#eef4ff] text-[#255dc7]";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.14em] ${palette}`}
    >
      <ProposalProviderMark provider={provider} />
      {getProviderLabel(provider)}
    </span>
  );
}

function getCategoryMeta(category?: ProposalCategory) {
  return categoryMeta[category || "accommodation"];
}

function getSelectedProposalId(trip: Doc<"trips">, category: ProposalCategory) {
  return trip[selectionFieldByCategory[category]];
}

function getDateRange(startDate: string, endDate: string) {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const totalDays = Math.max(differenceInCalendarDays(end, start) + 1, 1);
  return Array.from({ length: totalDays }, (_, index) => addDays(start, index));
}

function RevealSection({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.section
      {...(shouldReduceMotion
        ? {}
        : {
          initial: { opacity: 0, y: 18 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: "-60px" },
          transition: { duration: 0.45, ease: "easeOut" as const },
        })}
      className={className}
    >
      {children}
    </motion.section>
  );
}

export default function TripOverview({
  trip,
  tripId,
}: {
  trip: Doc<"trips">;
  tripId: Id<"trips">;
}) {
  const proposals = useQuery(api.proposals.listAccommodations, { tripId }) as
    | ProposalCard[]
    | undefined;
  const photos = useQuery(api.photos.list, { tripId }) as PhotoCard[] | undefined;
  const expenses = useQuery(api.expenses.list, { tripId }) as ExpenseCard[] | undefined;
  const tasks = useQuery(api.tasks.list, { tripId }) as TaskCard[] | undefined;
  const music = useQuery(api.music.list, { tripId }) as SongCard[] | undefined;
  const availabilities = useQuery(api.availabilities.list, { tripId }) as
    | AvailabilityMember[]
    | undefined;

  const sortedProposals = useMemo(
    () =>
      [...(proposals || [])].sort(
        (left, right) => right.votes - left.votes || left.name.localeCompare(right.name)
      ),
    [proposals]
  );
  const tripDates = useMemo(
    () => getDateRange(trip.startDate, trip.endDate),
    [trip.endDate, trip.startDate]
  );
  const totalBudget = expenses?.reduce((sum, item) => sum + item.amount, 0) || 0;
  const currentViewer = availabilities?.find((member) => member.isCurrentUser);
  const selectedProposalIds = {
    accommodation: getSelectedProposalId(trip, "accommodation"),
    food: getSelectedProposalId(trip, "food"),
    activity: getSelectedProposalId(trip, "activity"),
    favorite: getSelectedProposalId(trip, "favorite"),
  };
  const markers = [
    ...(trip.lat && trip.lng
      ? [
        {
          id: "destination",
          name: trip.destination,
          lat: trip.lat,
          lng: trip.lng,
          category: "general" as const,
        },
      ]
      : []),
    ...(sortedProposals
      .filter((proposal) => proposal.lat && proposal.lng)
      .map((proposal) => ({
        id: proposal._id,
        name: proposal.name,
        locationName: proposal.locationName,
        lat: proposal.lat!,
        lng: proposal.lng!,
        category: (proposal.category || "accommodation") as ProposalCategory,
        selected:
          selectedProposalIds[proposal.category || "accommodation"] ===
          (proposal._id as Id<"accommodations">),
      })) || []),
  ];

  return (
    <div className="space-y-8">
      <AvailabilityStudio tripId={tripId} dates={tripDates} members={availabilities} />

      <WeatherCard
        lat={trip.lat}
        lng={trip.lng}
        location={trip.locationName || trip.destination}
      />

      <MapStudio trip={trip} markers={markers} />

      <GalleryStudio tripId={tripId} photos={photos} />

      <PlaylistStudio tripId={tripId} songs={music} />
    </div>
  );
}

export function AvailabilityStudio({
  tripId,
  dates,
  members,
}: {
  tripId: Id<"trips">;
  dates: Date[];
  members: AvailabilityMember[] | undefined;
}) {
  const [status, setStatus] = useState<AvailabilityStatus>("yes");
  const updateAvailability = useMutation(api.availabilities.update);

  const dateSummaries = dates.map((date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    let yes = 0;
    let no = 0;
    let maybe = 0;

    members?.forEach((member) => {
      const match = member.availabilities.find((entry) => entry.date === dateKey);
      if (match?.status === "yes") yes += 1;
      if (match?.status === "no") no += 1;
      if (match?.status === "maybe") maybe += 1;
    });

    return { dateKey, date, yes, no, maybe };
  });

  const bestDay = [...dateSummaries].sort(
    (left, right) => right.yes - left.yes || right.maybe - left.maybe
  )[0];

  const handleDateClick = async (date: string, isCurrentUser: boolean) => {
    if (!isCurrentUser) return;

    try {
      await updateAvailability({ tripId, date, status });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <RevealSection className="overflow-hidden rounded-4xl border border-[#23362d] bg-[linear-gradient(180deg,#10211b,#0b1713)] ">
      <div className="border-b border-[#23372e] bg-[#13231d] px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="section-kicker">Availability</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">
              Find the overlap
            </h2>
            <p className="mt-3 text-sm text-white/52">
              {bestDay
                ? `Best day so far: ${format(bestDay.date, "EEE, MMM d")} / ${bestDay.yes} yes / ${bestDay.maybe} maybe`
                : "No one has marked dates yet"}
            </p>
          </div>

          <div className="flex flex-col gap-4 xl:items-end">
            <div className="flex flex-wrap gap-2">
              {availabilityLegend.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setStatus(option.id)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.14em] transition-colors ${status === option.id
                    ? option.className
                    : "border-white/10 bg-white/[0.05] text-white/60 hover:border-white/18 hover:text-white"
                    }`}
                >
                  {option.icon}
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto p-5 sm:p-6">
        {members === undefined ? (
          <Loader />
        ) : members.length === 0 ? (
          <EmptyState icon={<CalendarDays className="h-6 w-6" />} title="No traveler rows yet" />
        ) : (
          <div className="min-w-[52rem] space-y-3">
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: `15rem repeat(${dates.length}, minmax(3.35rem, 1fr))` }}
            >
              <div />
              {dateSummaries.map((summary) => (
                <div key={summary.dateKey} className="rounded-[1rem] border border-white/10 bg-white/[0.05] px-2 py-3 text-center">
                  <p className="section-kicker text-[0.52rem]">{format(summary.date, "EEE")}</p>
                  <p className="mt-1 text-base font-semibold text-white">{format(summary.date, "d")}</p>
                  <p className="mt-1 text-[0.65rem] uppercase tracking-[0.14em] text-white/50">
                    {summary.yes > 0 ? `${summary.yes} yes` : summary.maybe > 0 ? `${summary.maybe} maybe` : summary.no > 0 ? `${summary.no} no` : "open"}
                  </p>
                </div>
              ))}
            </div>

            {members.map((member) => (
              <div
                key={member.memberId}
                className="grid gap-2"
                style={{ gridTemplateColumns: `15rem repeat(${dates.length}, minmax(3.35rem, 1fr))` }}
              >
                <div className={`flex items-center gap-3 rounded-[1.2rem] border px-4 py-3 ${member.isCurrentUser ? "border-cyan-300/18  text-white" : "border-white/10 bg-white/[0.05] text-white"}`}>
                  <UserAvatar name={member.name} image={member.image} seed={member.userId} size={40} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{member.name}</p>
                    <p className={`mt-1 text-[0.62rem] uppercase tracking-[0.16em] ${member.isCurrentUser ? "text-white/60" : "text-white/48"}`}>
                      {member.isCurrentUser ? "You" : member.role}
                    </p>
                  </div>
                </div>

                {dates.map((date) => {
                  const dateKey = format(date, "yyyy-MM-dd");
                  const current = member.availabilities.find((entry) => entry.date === dateKey);
                  const tone = current ? availabilityTone[current.status] : "border-white/10 bg-white/[0.04] text-white/28";

                  return (
                    <button
                      key={`${member.memberId}-${dateKey}`}
                      type="button"
                      disabled={!member.isCurrentUser}
                      onClick={() => void handleDateClick(dateKey, member.isCurrentUser)}
                      className={`flex h-[4.15rem] items-center justify-center rounded-[1rem] border transition-colors ${tone} ${member.isCurrentUser ? "cursor-pointer" : "cursor-default"}`}
                      aria-label={`${member.name} ${dateKey}`}
                    >
                      {current?.status === "yes" ? (
                        <Check className="h-4 w-4" />
                      ) : current?.status === "no" ? (
                        <CircleSlash className="h-4 w-4" />
                      ) : current?.status === "maybe" ? (
                        <Clock3 className="h-4 w-4" />
                      ) : (
                        <span className="h-2.5 w-2.5 rounded-full bg-current/40" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </RevealSection>
  );
}

function SignalsStudio({
  trip,
  photoCount,
  taskCount,
  completedTasks,
  budget,
  leadProposal,
}: {
  trip: Doc<"trips">;
  photoCount: number;
  taskCount: number;
  completedTasks: number;
  budget: number;
  leadProposal?: ProposalCard;
}) {
  const stats = [
    { label: "Budget", value: currencyFormatter.format(budget) },
    { label: "Checklist", value: `${completedTasks}/${taskCount}` },
    { label: "Gallery", value: `${photoCount}` },
  ];

  return (
    <RevealSection className="overflow-hidden rounded-[2rem] bg-[#eff0ef]">
      <div className="p-5 sm:p-6">
        <p className="section-kicker">Trip signal</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-stone-950">{trip.destination}</h2>

        <div className="mt-6 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-[1.3rem] bg-white px-4 py-4">
              <p className="section-kicker text-[0.56rem]">{stat.label}</p>
              <p className="editorial-metric mt-3 text-3xl text-stone-950">{stat.value}</p>
            </div>
          ))}
        </div>

        {leadProposal ? (
          <div className="mt-6 rounded-[1.5rem] bg-stone-950 px-5 py-5 text-white">
            <p className="section-kicker text-white/55">Leading pick</p>
            <p className="mt-3 text-lg font-semibold">{leadProposal.name}</p>
            <div className="mt-4 flex items-center gap-3">
              <UserAvatar
                name={leadProposal.authorName}
                image={leadProposal.authorImage}
                seed={leadProposal.authorUserId || leadProposal.authorName}
                size={34}
              />
              <div>
                <p className="text-sm font-medium">{leadProposal.authorName}</p>
                <p className="text-xs uppercase tracking-[0.14em] text-white/45">
                  {getCategoryMeta(leadProposal.category).label} / {leadProposal.votes} votes
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </RevealSection>
  );
}

export function ProposalStudio({
  trip,
  tripId,
  proposals,
  canManageSelections,
}: {
  trip: Doc<"trips">;
  tripId: Id<"trips">;
  proposals: ProposalCard[] | undefined;
  canManageSelections?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [link, setLink] = useState("");
  const [locationName, setLocationName] = useState("");
  const [lat, setLat] = useState<number | undefined>();
  const [lng, setLng] = useState<number | undefined>();
  const [category, setCategory] = useState<ProposalCategory>("accommodation");
  const [selectedCategory, setSelectedCategory] = useState<ProposalCategory | "all">("all");
  const [editingProposalId, setEditingProposalId] = useState<Id<"accommodations"> | null>(null);
  const [preview, setPreview] = useState<ProposalLinkPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<
    Partial<Record<ProposalCategory, boolean>>
  >({});

  const addProposal = useMutation(api.proposals.addAccommodation);
  const updateProposal = useMutation(api.proposals.updateAccommodation);
  const removeProposal = useMutation(api.proposals.removeAccommodation);
  const setSelectedProposal = useMutation(api.proposals.setSelectedProposal);
  const voteProposal = useMutation(api.proposals.voteAccommodation);
  const getLinkPreview = useAction(api.proposals.getLinkPreview);
  const latestPreviewRequest = useRef(0);
  const nameRef = useRef(name);
  const normalizedLink = normalizeProposalLink(link);
  const detectedProvider = getProposalProvider(normalizedLink);
  const selectedProposalsByCategory = useMemo(
    () => ({
      accommodation: (proposals || []).find(
        (proposal) => proposal._id === trip.selectedAccommodationId
      ),
      food: (proposals || []).find((proposal) => proposal._id === trip.selectedFoodId),
      activity: (proposals || []).find((proposal) => proposal._id === trip.selectedActivityId),
      favorite: (proposals || []).find((proposal) => proposal._id === trip.selectedFavoriteId),
    }),
    [
      proposals,
      trip.selectedAccommodationId,
      trip.selectedActivityId,
      trip.selectedFavoriteId,
      trip.selectedFoodId,
    ]
  );
  const filteredProposals = useMemo(() => {
    const categoryFiltered = (proposals || []).filter((proposal) =>
      selectedCategory === "all"
        ? true
        : (proposal.category || "accommodation") === selectedCategory
    );

    if (selectedCategory === "all") {
      return categoryFiltered;
    }

    const chosenId = selectedProposalsByCategory[selectedCategory]?._id;
    if (!chosenId) {
      return categoryFiltered;
    }

    return [
      ...categoryFiltered.filter((proposal) => proposal._id === chosenId),
      ...categoryFiltered.filter((proposal) => proposal._id !== chosenId),
    ];
  }, [proposals, selectedCategory, selectedProposalsByCategory]);
  const categoryCounts = useMemo(() => {
    const counts: Record<"all" | ProposalCategory, number> = {
      all: proposals?.length || 0,
      accommodation: 0,
      food: 0,
      activity: 0,
      favorite: 0,
    };

    (proposals || []).forEach((proposal) => {
      counts[proposal.category || "accommodation"] += 1;
    });

    return counts;
  }, [proposals]);
  const activeChosenProposal =
    selectedCategory === "all" ? null : selectedProposalsByCategory[selectedCategory];
  const isCollapsedList =
    selectedCategory !== "all" &&
    !!activeChosenProposal &&
    filteredProposals.length > 2 &&
    !expandedCategories[selectedCategory];
  const visibleProposals = isCollapsedList ? filteredProposals.slice(0, 2) : filteredProposals;

  useEffect(() => {
    nameRef.current = name;
  }, [name]);

  useEffect(() => {
    if (!normalizedLink || !detectedProvider) {
      latestPreviewRequest.current += 1;
      setPreview(null);
      setPreviewLoading(false);
      return;
    }

    const requestId = latestPreviewRequest.current + 1;
    latestPreviewRequest.current = requestId;
    setPreview((current) =>
      current?.normalizedUrl === normalizedLink
        ? current
        : { normalizedUrl: normalizedLink, provider: detectedProvider }
    );

    const timeoutId = window.setTimeout(async () => {
      setPreviewLoading(true);

      try {
        const result = await getLinkPreview({ url: normalizedLink });
        if (latestPreviewRequest.current !== requestId) return;

        setPreview(result);
        if (!nameRef.current.trim() && result.title) {
          setName(result.title);
        }
      } catch (error) {
        if (latestPreviewRequest.current === requestId) {
          setPreview({ normalizedUrl: normalizedLink, provider: detectedProvider });
        }
        console.error(error);
      } finally {
        if (latestPreviewRequest.current === requestId) {
          setPreviewLoading(false);
        }
      }
    }, 450);

    return () => window.clearTimeout(timeoutId);
  }, [detectedProvider, getLinkPreview, normalizedLink]);

  const resetForm = () => {
    setName("");
    setLink("");
    setLocationName("");
    setLat(undefined);
    setLng(undefined);
    setCategory("accommodation");
    setEditingProposalId(null);
    setPreview(null);
    setPreviewLoading(false);
    setOpen(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name) return;

    try {
      const payload = {
        name,
        link: normalizedLink || link || undefined,
        imageUrl: preview?.imageUrl || undefined,
        locationName: locationName || undefined,
        lat,
        lng,
        category,
      };

      if (editingProposalId) {
        await updateProposal({
          accommodationId: editingProposalId,
          ...payload,
        });
      } else {
        await addProposal({
          tripId,
          ...payload,
        });
      }

      resetForm();
    } catch (error) {
      console.error(error);
    }
  };

  const handleEditProposal = (proposal: ProposalCard) => {
    setEditingProposalId(proposal._id as Id<"accommodations">);
    setName(proposal.name);
    setLink(proposal.link || "");
    setLocationName(proposal.locationName || "");
    setLat(proposal.lat);
    setLng(proposal.lng);
    setCategory((proposal.category || "accommodation") as ProposalCategory);
    setPreview(
      proposal.link
        ? {
          normalizedUrl: normalizeProposalLink(proposal.link),
          provider: getProposalProvider(proposal.link),
          title: proposal.name,
          imageUrl: proposal.imageUrl,
        }
        : proposal.imageUrl
          ? {
            normalizedUrl: "",
            provider: null,
            title: proposal.name,
            imageUrl: proposal.imageUrl,
          }
          : null
    );
    setOpen(true);
  };

  const handleRemoveProposal = async (proposalId: Id<"accommodations">) => {
    if (!window.confirm("Delete this proposal?")) return;

    try {
      await removeProposal({ accommodationId: proposalId });
      if (editingProposalId === proposalId) {
        resetForm();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggleSelection = async (proposal: ProposalCard) => {
    const proposalCategory = (proposal.category || "accommodation") as ProposalCategory;
    const selectedId = getSelectedProposalId(trip, proposalCategory);

    try {
      await setSelectedProposal({
        tripId,
        category: proposalCategory,
        accommodationId:
          selectedId === (proposal._id as Id<"accommodations">)
            ? undefined
            : (proposal._id as Id<"accommodations">),
      });
      setExpandedCategories((current) => ({
        ...current,
        [proposalCategory]: false,
      }));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <RevealSection className="rounded-4xl border border-[#23362d] bg-[linear-gradient(180deg,#10211b,#0b1713)] p-5 sm:p-6">
   

      <div className=" flex flex-wrap gap-2.5">
        {proposalFilterMeta.map((item) => {
          const active = selectedCategory === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedCategory(item.id)}
              data-active={active}
              className="editorial-filter-chip"
            >
              <span className="editorial-filter-chip__icon">{item.icon}</span>
              <span className="editorial-filter-chip__label">
                <span className="editorial-filter-chip__title">{item.label}</span>
                <span className="editorial-filter-chip__meta">{categoryCounts[item.id]}</span>
              </span>
            </button>
          );
        })}
      </div>

      {activeChosenProposal ? (
        <div className="mt-5 overflow-hidden rounded-[1.6rem] border border-[#4b5740] bg-[#17251d]">
          <div className="grid gap-0 sm:grid-cols-[5.5rem_minmax(0,1fr)]">
            <div className="relative min-h-[5.5rem] bg-[#13231d]">
              {activeChosenProposal.imageUrl ? (
                <Image
                  src={activeChosenProposal.imageUrl}
                  alt={activeChosenProposal.name}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[#7f9086]">
                  <BedDouble className="h-5 w-5" />
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center gap-2 px-4 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="section-kicker text-[0.56rem] text-[#dbe6cf]">Chosen pick</span>
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.14em] ${getCategoryMeta(activeChosenProposal.category).tone}`}
                >
                  {getCategoryMeta(activeChosenProposal.category).icon}
                  {getCategoryMeta(activeChosenProposal.category).label}
                </span>
              </div>
              <div>
                <p className="text-base font-semibold tracking-[-0.03em] text-white">
                  {activeChosenProposal.name}
                </p>
                <p className="mt-1 text-sm text-[#9fb0a3]">
                  {activeChosenProposal.locationName || "Address will appear here after you set a place."}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {proposals === undefined ? (
        <div className="mt-6">
          <Loader />
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          <AddTile
            title="Add proposal"
            description="Open a drawer and drop in a new option."
            onClick={() => {
              setEditingProposalId(null);
              setOpen(true);
            }}
            className="min-h-[9.75rem]"
          />
          {visibleProposals.map((proposal) => {
            const meta = getCategoryMeta(proposal.category);
            const rank = filteredProposals.findIndex((item) => item._id === proposal._id) + 1;
            const rankClasses = getProposalRankClasses(rank);
            const provider = getProposalProvider(proposal.link);
            const proposalCategory = (proposal.category || "accommodation") as ProposalCategory;
            const isSelected = getSelectedProposalId(trip, proposalCategory) === proposal._id;
            const siteIcon = provider ? (
              <span className="text-[0.72rem] font-bold">{provider === "airbnb" ? "A" : "B"}</span>
            ) : proposal.link ? (
              <ExternalLink className="h-4 w-4" />
            ) : null;

            return (
              <article
                key={proposal._id}
                className={`overflow-hidden rounded-[1.8rem] border transition-colors ${rankClasses.card}`}
              >
                <div className="grid gap-0 md:grid-cols-[18rem_minmax(0,1fr)]">
                  <div className="relative min-h-[12rem] bg-[#13231d] md:min-h-full">
                    {proposal.imageUrl ? (
                      <Image
                        src={proposal.imageUrl}
                        alt={proposal.name}
                        width={720}
                        height={520}
                        unoptimized
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full min-h-[12rem] items-center justify-center text-stone-400">
                        <BedDouble className="h-7 w-7" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-linear-to-r from-black/18 via-transparent to-transparent" />

                    {rank <= 3 ? (
                      <div
                        className={`absolute left-4 top-4 flex h-12 w-12 items-center justify-center rounded-[1rem] border text-[1.25rem] font-semibold tracking-[-0.05em] backdrop-blur-sm ${rankClasses.rank}`}
                      >
                        {rank}
                      </div>
                    ) : null}
                  </div>

                  <div className="p-4 sm:p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] ${meta.tone}`}
                          >
                            {meta.icon}
                            {meta.label}
                          </span>
                          {isSelected ? (
                            <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/14 px-3 py-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-amber-100">
                              <Pin className="h-3.5 w-3.5" />
                              Chosen
                            </span>
                          ) : null}
                          {proposal.link ? (
                            <a
                              href={proposal.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="trip-glass-icon-button h-9 w-9 bg-[color:var(--control-bg)] text-[#cfd8cd] hover:bg-[color:var(--control-bg-hover)] hover:text-white"
                              title={provider ? getProviderLabel(provider) : "Open link"}
                            >
                              {siteIcon}
                            </a>
                          ) : null}
                        </div>

                        <h3 className="mt-3 text-[clamp(1.4rem,2vw,2rem)] font-semibold leading-[1.05] tracking-[-0.04em] text-white">
                          {proposal.name}
                        </h3>
                        {proposal.locationName ? (
                          <p className="mt-2 inline-flex items-center gap-2 text-sm text-[#9fb0a3]">
                            <MapPin className="h-4 w-4" />
                            {proposal.locationName}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap items-start gap-2 lg:justify-end">
                        {canManageSelections ? (
                          <button
                            type="button"
                            onClick={() => void handleToggleSelection(proposal)}
                            className={`editorial-button-secondary justify-center px-3.5 py-2.5 text-[0.58rem] ${isSelected ? "border-[#dbe887]/36 bg-[#213229] text-[#eef5d0]" : "bg-[#14251e]"
                              }`}
                          >
                            <Pin className={`h-4 w-4 ${isSelected ? "fill-current" : ""}`} />
                            {isSelected ? "Pinned" : "Pin pick"}
                          </button>
                        ) : null}

                        {proposal.isOwnedByMe ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleEditProposal(proposal)}
                              className="trip-glass-icon-button h-10 w-10 bg-[color:var(--control-bg)] text-[#cfd8cd] hover:bg-[color:var(--control-bg-hover)] hover:text-white"
                              title="Edit proposal"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                void handleRemoveProposal(proposal._id as Id<"accommodations">)
                              }
                              className="trip-glass-icon-button h-10 w-10 bg-[color:var(--control-bg)] text-[#cfd8cd] hover:bg-[color:var(--control-bg-hover)] hover:text-[#f3b4a3]"
                              title="Delete proposal"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        ) : null}

                        <div className="flex min-w-[6.5rem] flex-col items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              void voteProposal({ accommodationId: proposal._id as Id<"accommodations"> })
                            }
                            className={`editorial-button-secondary justify-center px-3.5 py-2.5 text-[0.58rem] ${proposal.isVotedByMe ? "border-[#dbe887]/36 bg-[#213229] text-white" : "bg-[#14251e]"
                              }`}
                          >
                            <ThumbsUp className={`h-4 w-4 ${proposal.isVotedByMe ? "fill-current" : ""}`} />
                            Vote
                          </button>
                          <p className="text-sm text-[#9fb0a3]">
                            {proposal.votes} vote{proposal.votes === 1 ? "" : "s"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5">
                      <AvatarStack users={proposal.voters} compact />
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
      {selectedCategory !== "all" && filteredProposals.length > 2 && activeChosenProposal ? (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() =>
              setExpandedCategories((current) => ({
                ...current,
                [selectedCategory]: !current[selectedCategory],
              }))
            }
            className="editorial-button-secondary px-4 py-3 text-[0.62rem]"
          >
            {expandedCategories[selectedCategory] ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            {expandedCategories[selectedCategory]
              ? `Show fewer ${getCategoryMeta(selectedCategory).label.toLowerCase()} picks`
              : `Show all ${filteredProposals.length} ${getCategoryMeta(selectedCategory).label.toLowerCase()} picks`}
          </button>
        </div>
      ) : null}

      <EditorDrawer
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            resetForm();
            return;
          }
          setOpen(nextOpen);
        }}
        title={editingProposalId ? "Edit proposal" : "Add proposal"}
        description="Save one option with its category, link preview and map location."
        footer={
          <div className="flex items-center justify-between gap-3">
            {editingProposalId ? (
              <button
                type="button"
                onClick={resetForm}
                className="editorial-button-ghost px-4 py-3 text-[0.62rem]"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            ) : (
              <div />
            )}
            <SubmitButton
              label={editingProposalId ? "Save changes" : "Save proposal"}
              form="proposal-drawer-form"
            />
          </div>
        }
      >
        <form id="proposal-drawer-form" onSubmit={handleSubmit} className="grid gap-4 pb-4">
          <Input placeholder="Hotel Splendido" value={name} onChange={setName} />
          <Input
            placeholder="Airbnb or Booking link"
            value={link}
            onChange={setLink}
            type="url"
            startAdornment={<ProposalProviderMark provider={detectedProvider} />}
          />

          <div className="space-y-2">
            <label className="section-kicker text-[0.58rem]">Location</label>
            <LocationSearch
              defaultValue={locationName}
              onSelect={(location: SelectedLocation) => {
                setName((previous) => previous || location.place_name.split(",")[0]);
                setLocationName(location.place_name);
                setLng(location.center[0]);
                setLat(location.center[1]);
              }}
              placeholder="Search place"
            />
          </div>

          <div className="space-y-2">
            <label className="section-kicker text-[0.58rem]">Category</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(categoryMeta).map(([id, meta]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setCategory(id as ProposalCategory)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] transition-colors ${category === id
                    ? meta.softTone
                    : "border-white/10 bg-white/[0.05] text-white/56 hover:border-white/18 hover:text-white"
                    }`}
                >
                  {meta.icon}
                  <span className="text-[0.58rem] tracking-[0.14em]">{meta.label}</span>
                </button>
              ))}
            </div>
          </div>

          {detectedProvider ? (
            <div className="overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.04]">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
                <div className="flex items-center gap-2">
                  <ProposalProviderBadge provider={detectedProvider} subtle />
                  <p className="text-sm text-white/52">
                    {previewLoading ? "Reading preview..." : "Link preview"}
                  </p>
                </div>
                {normalizedLink ? (
                  <a
                    href={normalizedLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/46 transition-colors hover:text-white"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : null}
              </div>

              <div className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_11rem] sm:items-center">
                <div className="min-w-0">
                  <p className="text-base font-semibold tracking-[-0.03em] text-white">
                    {preview?.title || "We will pull the stay title from the link if it's available."}
                  </p>
                  <p className="mt-2 text-sm text-white/52">
                    Saved proposals keep this preview image when the remote page exposes one.
                  </p>
                </div>

                <div className="overflow-hidden rounded-[1.1rem] bg-white/[0.05]">
                  {preview?.imageUrl ? (
                    <Image
                      src={preview.imageUrl}
                      alt={preview.title || "Proposal preview"}
                      width={320}
                      height={220}
                      unoptimized
                      className="h-36 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-36 items-center justify-center text-stone-400">
                      <BedDouble className="h-6 w-6" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </form>
      </EditorDrawer>
    </RevealSection>
  );
}

export function BudgetStudio({
  tripId,
  expenses,
  totalBudget,
}: {
  tripId: Id<"trips">;
  expenses: ExpenseCard[] | undefined;
  totalBudget: number;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [editingExpenseId, setEditingExpenseId] = useState<Id<"expenses"> | null>(null);
  const addExpense = useMutation(api.expenses.add);
  const updateExpense = useMutation(api.expenses.update);
  const removeExpense = useMutation(api.expenses.remove);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title || !amount) return;

    try {
      const numericAmount = parseFloat(amount);
      if (Number.isNaN(numericAmount)) return;

      if (editingExpenseId) {
        await updateExpense({ expenseId: editingExpenseId, title, amount: numericAmount });
      } else {
        await addExpense({ tripId, title, amount: numericAmount });
      }

      setTitle("");
      setAmount("");
      setEditingExpenseId(null);
      setOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const resetEditor = () => {
    setTitle("");
    setAmount("");
    setEditingExpenseId(null);
    setOpen(false);
  };

  return (
    <RevealSection className="h-full overflow-hidden rounded-[2rem] border border-[#23362d] bg-[linear-gradient(180deg,#10211b,#0b1713)] ">
      <div className="border-b border-white/10 bg-white/[0.04] px-5 py-4 sm:px-6">
        <div>
          <p className="section-kicker">Budget</p>
          <h2 className="mt-2 text-[1.75rem] font-semibold tracking-[-0.04em] text-white">
            Money snapshot
          </h2>
          <div className="mt-3">
            <p className="section-kicker text-[0.56rem]">Total</p>
            <p className="editorial-metric mt-1.5 text-[clamp(1.9rem,3.5vw,3rem)] text-white">
              {currencyFormatter.format(totalBudget)}
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 sm:px-6">
        {expenses === undefined ? (
          <Loader />
        ) : (
          <div className="grid gap-2.5 lg:grid-cols-2">
            <AddTile
              title="Add expense"
              onClick={() => setOpen(true)}
              className="min-h-[6.25rem]"
            />
            {expenses.map((expense) => (
              <article
                key={expense._id}
                className="flex items-center justify-between gap-3 rounded-[1.5rem] border border-[#23372e] bg-[#14251e] px-4 py-3.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{expense.title}</p>
                  <div className="mt-1.5 flex items-center gap-3">
                    <UserAvatar
                      name={expense.payerName}
                      image={expense.payerImage}
                      seed={expense.payerUserId || expense.payerName}
                      size={28}
                    />
                    <p className="truncate text-xs uppercase tracking-[0.14em] text-[#9fb0a3]">
                      {expense.payerName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingExpenseId(expense._id as Id<"expenses">);
                      setTitle(expense.title);
                      setAmount(String(expense.amount));
                      setOpen(true);
                    }}
                    className="trip-glass-icon-button h-10 w-10 bg-[color:var(--control-bg)] text-[#cfd8cd] hover:bg-[color:var(--control-bg-hover)] hover:text-white"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <span className="text-sm font-semibold text-white">
                    {currencyFormatter.format(expense.amount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => void removeExpense({ expenseId: expense._id as Id<"expenses"> })}
                    className="trip-glass-icon-button h-10 w-10 bg-[color:var(--control-bg)] text-[#cfd8cd] hover:bg-[color:var(--control-bg-hover)] hover:text-[#f3b4a3]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <EditorDrawer
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            resetEditor();
            return;
          }

          setOpen(nextOpen);
        }}
        title={editingExpenseId ? "Edit expense" : "Add expense"}
        description="Log a shared cost and keep the running total tidy."
        footer={
          <div className="flex items-center justify-between gap-3">
            {editingExpenseId ? (
              <button
                type="button"
                onClick={resetEditor}
                className="editorial-button-ghost px-4 py-3 text-[0.62rem]"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            ) : (
              <div />
            )}
            <SubmitButton label={editingExpenseId ? "Save changes" : "Save"} form="expense-drawer-form" />
          </div>
        }
      >
        <form id="expense-drawer-form" onSubmit={handleSubmit} className="grid gap-4 pb-4">
          <Input placeholder="Dinner reservation" value={title} onChange={setTitle} />
          <Input placeholder="Amount" value={amount} onChange={setAmount} type="number" />
        </form>
      </EditorDrawer>
    </RevealSection>
  );
}

export function MapStudio({
  trip,
  markers,
}: {
  trip: Doc<"trips">;
  markers: Array<{
    id: string;
    name: string;
    locationName?: string;
    lat: number;
    lng: number;
    category: "accommodation" | "food" | "activity" | "favorite" | "general";
    selected?: boolean;
  }>;
}) {
  const categorizedMarkers = markers
    .map((marker) => ({
      ...marker,
      meta:
        marker.category === "general"
          ? {
            label: "Base",
            icon: <MapPin className="h-4 w-4" />,
            tone: "border border-white/12 bg-white/10 text-white/78",
          }
          : getCategoryMeta(marker.category),
    }))
    .sort((left, right) => Number(Boolean(right.selected)) - Number(Boolean(left.selected)));
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(
    categorizedMarkers.find((marker) => marker.selected)?.id || categorizedMarkers[0]?.id || null
  );

  useEffect(() => {
    if (categorizedMarkers.length === 0) {
      setActiveMarkerId(null);
      return;
    }

    if (!activeMarkerId || !categorizedMarkers.some((marker) => marker.id === activeMarkerId)) {
      setActiveMarkerId(
        categorizedMarkers.find((marker) => marker.selected)?.id || categorizedMarkers[0]?.id || null
      );
    }
  }, [activeMarkerId, categorizedMarkers]);

  return (
    <RevealSection className="overflow-hidden rounded-4xl border border-[#23362d] bg-[linear-gradient(180deg,#10211b,#0b1713)] ">
      <div className="border-b border-[#23372e] px-5 py-5 sm:px-6">
        <p className="section-kicker">Map</p>
        <div className="mt-3 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">
              Around {trip.destination}
            </h2>
            <p className="mt-2 text-sm text-[#a8b8ad]">
              {categorizedMarkers.length > 1
                ? `${categorizedMarkers.length} pinned locations across the trip map`
                : "The base destination is pinned and ready"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="h-[23rem] overflow-hidden rounded-[1.5rem] border border-[#23372e] bg-[#13231d] sm:h-[29rem] lg:h-[32rem]">
          <TripMap
            center={trip.lat && trip.lng ? { lat: trip.lat, lng: trip.lng } : undefined}
            markers={markers}
            activeMarkerId={activeMarkerId || undefined}
            onActiveMarkerChange={(markerId) => setActiveMarkerId(markerId)}
          />
        </div>

        <div className="rounded-[1.5rem] border border-[#23372e] bg-[#14251e] p-3">
          <div className="flex items-center justify-between gap-3 border-b border-[#23372e] px-2 pb-3">
            <p className="section-kicker">Locations</p>
            <p className="text-xs uppercase tracking-[0.14em] text-[#9fb0a3]">
              {categorizedMarkers.length} total
            </p>
          </div>
          <div className="mt-3 max-h-[17rem] space-y-2 overflow-y-auto pr-1 sm:max-h-[20rem] lg:max-h-[29rem]">
            {categorizedMarkers.map((marker) => {
              const isActive = marker.id === activeMarkerId;

              return (
                <button
                  key={marker.id}
                  type="button"
                  onClick={() => setActiveMarkerId(marker.id)}
                  className={`w-full rounded-[1.1rem] border px-3 py-3 text-left transition-[background-color,border-color,box-shadow] ${isActive
                    ? "border-[#dbe887]/36 bg-[#1b3026] shadow-[0_12px_28px_rgba(0,0,0,0.2)]"
                    : "border-[#23372e] bg-[#13231d] hover:border-[#42584d] hover:bg-[#172920]"
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${marker.meta.tone}`}
                    >
                      {marker.meta.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{marker.name}</p>
                      <p className="mt-1 truncate text-xs text-[#9fb0a3]">
                        {marker.locationName || trip.destination}
                      </p>
                      <p className="mt-1 text-[0.62rem] uppercase tracking-[0.14em] text-[#7f9086]">
                        {marker.selected ? `Chosen ${marker.meta.label}` : marker.meta.label}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </RevealSection>
  );
}

export function GalleryStudio({
  tripId,
  photos,
}: {
  tripId: Id<"trips">;
  photos: PhotoCard[] | undefined;
}) {
  const addPhoto = useMutation(api.photos.add);
  const removePhoto = useMutation(api.photos.remove);

  return (
    <RevealSection className="overflow-hidden rounded-4xl border border-[#23362d] bg-[linear-gradient(180deg,#10211b,#0b1713)]">
      <div className="bg-[#13231d] px-5 py-4 sm:px-6">
        <p className="section-kicker">Gallery</p>
        <h2 className="mt-2 text-[1.75rem] font-semibold tracking-[-0.04em] text-white">
          Notebook images
        </h2>
      </div>

      <div className="border-t border-[#23372e] bg-transparent">
        {photos === undefined ? (
          <div className="p-4">
            <Loader />
          </div>
        ) : (
          <div className="p-2.5 sm:p-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
              <ImageKitUpload
                folder={`/gather/trips/${tripId}/photos`}
                onSuccess={(url) => void addPhoto({ tripId, url })}
                mode="tile"

              />

              {(photos ?? []).map((photo) => (
                <div
                  key={photo._id}
                  className="group relative aspect-[3/4] rounded-4xl overflow-hidden bg-[#14251e]"
                >
                  <Image
                    src={photo.url}
                    alt={photo.uploaderName}
                    fill
                    className="object-cover transition-transform duration-700"
                  />
                  {photo.canDelete ? (
                    <button
                      type="button"
                      onClick={() => void removePhoto({ photoId: photo._id as Id<"photos"> })}
                      className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/60 bg-stone-950/58 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-stone-950/78 group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                  <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-stone-950/70 to-transparent px-3 py-3">
                    <UserAvatar
                      name={photo.uploaderName}
                      image={photo.uploaderImage}
                      seed={photo.uploaderUserId || photo.uploaderName}
                      size={26}
                    />
                    <p className="truncate text-xs font-medium text-white">{photo.uploaderName}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </RevealSection>
  );
}

export function TasksStudio({
  tripId,
  tasks,
}: {
  tripId: Id<"trips">;
  tasks: TaskCard[] | undefined;
}) {
  const [open, setOpen] = useState(false);
  const [task, setTask] = useState("");
  const [category, setCategory] = useState("General");
  const [editingTaskId, setEditingTaskId] = useState<Id<"packingItems"> | null>(null);
  const categories = ["General", "Packing", "Booking", "Docs", "Food"];
  const addTask = useMutation(api.tasks.add);
  const toggleTask = useMutation(api.tasks.toggle);
  const updateTask = useMutation(api.tasks.update);
  const removeTask = useMutation(api.tasks.remove);
  const completed = tasks?.filter((item) => item.isChecked).length || 0;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!task) return;

    try {
      if (editingTaskId) {
        await updateTask({ taskId: editingTaskId, name: task, category });
      } else {
        await addTask({ tripId, name: task, category });
      }

      setTask("");
      setEditingTaskId(null);
      setOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const resetEditor = () => {
    setTask("");
    setCategory("General");
    setEditingTaskId(null);
    setOpen(false);
  };

  return (
    <RevealSection className="h-full overflow-hidden rounded-[2rem] border border-[#23362d] bg-[linear-gradient(180deg,#10211b,#0b1713)] ">
      <div className="border-b border-[#23372e] px-5 py-5 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="section-kicker">Tasks</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">
              Pre-trip checklist
            </h2>
          </div>
          <p className="editorial-metric text-4xl text-white">
            {completed}/{tasks?.length || 0}
          </p>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="mt-1">
          {tasks === undefined ? (
            <Loader />
          ) : (
            <div className="grid gap-3">
              <AddTile
                title="Add task"
                onClick={() => setOpen(true)}
              />
              {tasks.map((taskItem) => (
                <article
                  key={taskItem._id}
                  className={`flex items-start gap-3 rounded-[1.5rem] px-4 py-4 text-left transition-colors ${taskItem.isChecked ? "border border-[#31453b] bg-[#11211b]" : "border border-[#23372e] bg-[#14251e]"
                    }`}
                >
                  <button
                    type="button"
                    onClick={() => void toggleTask({ taskId: taskItem._id })}
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${taskItem.isChecked ? "border-[#dbe887] bg-[#dbe887] text-[#0f1b16]" : "border-[#506257] bg-transparent text-transparent"}`}
                    aria-label={`Toggle ${taskItem.name}`}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={`w-full break-words whitespace-normal text-sm font-medium ${taskItem.isChecked ? "text-[#6f7d74] line-through" : "text-white"}`}>
                      {taskItem.name}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[#9fb0a3]">
                      {taskItem.category}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTaskId(taskItem._id as Id<"packingItems">);
                        setTask(taskItem.name);
                        setCategory(taskItem.category);
                        setOpen(true);
                      }}
                      className="trip-glass-icon-button h-10 w-10 bg-[color:var(--control-bg)] text-[#cfd8cd] hover:bg-[color:var(--control-bg-hover)] hover:text-white"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeTask({ taskId: taskItem._id })}
                      className="trip-glass-icon-button h-10 w-10 bg-[color:var(--control-bg)] text-[#cfd8cd] hover:bg-[color:var(--control-bg-hover)] hover:text-[#f3b4a3]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      <EditorDrawer
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            resetEditor();
            return;
          }
          setOpen(nextOpen);
        }}
        title={editingTaskId ? "Edit task" : "Add task"}
        description="Keep the pre-trip checklist focused and easy to scan."
        footer={
          <div className="flex items-center justify-between gap-3">
            {editingTaskId ? (
              <button
                type="button"
                onClick={resetEditor}
                className="editorial-button-ghost px-4 py-3 text-[0.62rem]"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            ) : (
              <div />
            )}
            <SubmitButton
              label={editingTaskId ? "Save changes" : "Save task"}
              form="task-drawer-form"
            />
          </div>
        }
      >
        <form id="task-drawer-form" onSubmit={handleSubmit} className="grid gap-4 pb-4">
          <Input placeholder="Reserve the train" value={task} onChange={setTask} />
          <div className="flex flex-wrap gap-2">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] transition-colors ${category === item
                  ? "border-[#dbe887]/36 bg-[#213229] text-white"
                  : "border-[#23372e] bg-[#14251e] text-[#9fb0a3] hover:border-[#42584d] hover:text-white"
                  }`}
              >
                {taskCategoryMeta[item]?.icon || <CheckSquare className="h-3.5 w-3.5" />}
                <span>{taskCategoryMeta[item]?.shortLabel || item}</span>
              </button>
            ))}
          </div>
        </form>
      </EditorDrawer>
    </RevealSection>
  );
}

export function PlaylistStudio({
  tripId,
  songs,
}: {
  tripId: Id<"trips">;
  songs: SongCard[] | undefined;
}) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const addSong = useMutation(api.music.add);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!url) return;

    try {
      await addSong({ tripId, url });
      setUrl("");
      setOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <RevealSection className="h-full overflow-hidden rounded-[2rem] bg-[#eff0ef]">
      <div className="px-5 py-5 sm:px-6">
        <div>
          <p className="section-kicker">Playlist</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-stone-950">
            Trip soundtrack
          </h2>
        </div>
        <div className="mt-6 space-y-3">
          {songs === undefined ? (
            <Loader />
          ) : (
            <>
              <AddTile
                title="Add song"
                description="Paste a Spotify or Apple Music link."
                onClick={() => setOpen(true)}
                className="min-h-[9rem] bg-white"
              />
              {songs.map((song) => (
                <article key={song._id} className="rounded-[1.4rem] bg-white px-4 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          name={song.addedByName}
                          image={song.addedByImage}
                          seed={song.addedByUserId || song.addedByName}
                          size={32}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-stone-950">{song.addedByName}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-stone-500">Added this track</p>
                        </div>
                      </div>

                      <a
                        href={song.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex min-w-0 items-center gap-2 text-sm font-medium text-stone-900 transition-colors hover:text-stone-600"
                      >
                        <Send className="h-4 w-4" />
                        <span className="truncate">{song.url}</span>
                      </a>
                    </div>

                    <span className="rounded-full bg-[#eff0ef] px-3 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-stone-600">
                      {song.platform}
                    </span>
                  </div>
                </article>
              ))}
            </>
          )}
        </div>
      </div>

      <EditorDrawer
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            setUrl("");
          }
        }}
        title="Add song"
        description="Attach one link and keep the trip soundtrack in one place."
        footer={<SubmitButton label="Save song" form="song-drawer-form" />}
      >
        <form id="song-drawer-form" onSubmit={handleSubmit} className="grid gap-4 pb-4">
          <Input
            placeholder="Paste Spotify or Apple Music link"
            value={url}
            onChange={setUrl}
            type="url"
          />
        </form>
      </EditorDrawer>
    </RevealSection>
  );
}

function AvatarStack({
  users,
  compact = false,
}: {
  users: Array<{ name: string; image?: string; userId?: string }>;
  compact?: boolean;
}) {
  if (users.length === 0) {
    return (
      <div className="flex items-center">
        {Array.from({ length: compact ? 3 : 4 }).map((_, index) => (
          <div
            key={index}
            className={`${index === 0 ? "" : "-ml-2.5"} h-7 w-7 rounded-full border border-dashed border-stone-300 bg-white/70 sm:h-8 sm:w-8`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center">
      {users.slice(0, compact ? 4 : 6).map((user, index) => (
        <div key={`${user.userId || user.name}-${index}`} className={index === 0 ? "" : "-ml-2.5"}>
          <UserAvatar
            name={user.name}
            image={user.image}
            seed={user.userId || user.name}
            size={compact ? 30 : 34}
            className="ring-2 ring-white"
          />
        </div>
      ))}
      {users.length > (compact ? 4 : 6) ? (
        <div
          className={`${users.length > 0 ? "-ml-2.5" : ""
            } flex h-[30px] w-[30px] items-center justify-center rounded-full bg-stone-950 text-[0.64rem] font-semibold text-white ring-2 ring-white`}
        >
          +{users.length - (compact ? 4 : 6)}
        </div>
      ) : null}
    </div>
  );
}

function AddTile({
  title,
  description,
  onClick,
  className = "",
}: {
  title: string;
  description?: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex min-h-[7.5rem] w-full flex-col items-center justify-center rounded-[1.45rem] border border-dashed border-[#31463c] bg-[#13231d] px-4 py-5 text-center transition-colors hover:border-[#42584d] hover:bg-[#172920] ${className}`}
    >
      <span className="trip-glass-icon-button h-11 w-11 bg-[color:var(--control-bg)] text-[#cfd8cd] transition-transform group-hover:scale-[1.03] group-hover:bg-[color:var(--control-bg-hover)] group-hover:text-white">
        <Plus className="h-4 w-4" />
      </span>
      <span className="mt-3 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[#d7e1d3]">
        {title}
      </span>
      {description ? <span className="mt-1 text-sm text-[#9fb0a3]">{description}</span> : null}
    </button>
  );
}

function EditorDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <p className="section-kicker">Editor</p>
          <DrawerTitle>{title}</DrawerTitle>
          {description ? <DrawerDescription>{description}</DrawerDescription> : null}
        </DrawerHeader>
        <div className=" px-5 pb-2 sm:px-6 h-full">{children}</div>
        <DrawerFooter>{footer}</DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function Input({
  placeholder,
  value,
  onChange,
  type = "text",
  startAdornment,
}: {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  startAdornment?: ReactNode;
}) {
  return (
    <div className="relative">
      {startAdornment ? (
        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
          {startAdornment}
        </div>
      ) : null}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`editorial-input ${startAdornment ? "pl-12" : ""}`}
      />
    </div>
  );
}

function SubmitButton({ label, form }: { label: string; form?: string }) {
  return (
    <button
      type="submit"
      form={form}
      className="editorial-button-primary justify-center px-5 py-3 text-[0.66rem]"
    >
      {label}
    </button>
  );
}

function EmptyState({
  icon,
  title,
}: {
  icon: ReactNode;
  title: string;
}) {
  return (
    <div className="flex min-h-[12rem] flex-col items-center justify-center rounded-[1.5rem] border border-[#23372e] bg-[#13231d] text-center text-[#9fb0a3]">
      <div className="trip-glass-icon-button h-12 w-12 bg-[color:var(--control-bg)] text-[#d7e1d3]">
        {icon}
      </div>
      <p className="mt-4 text-sm">{title}</p>
    </div>
  );
}

function Loader() {
  return (
    <div className="flex justify-center py-8">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#627168] border-t-[#dbe887]" />
    </div>
  );
}
