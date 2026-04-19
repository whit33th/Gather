import type { Doc, Id } from "@/convex/_generated/dataModel";

export type ProposalCategory = "accommodation" | "food" | "activity" | "favorite";
export type AvailabilityStatus = "yes" | "no" | "maybe";

export type ProposalCard = {
  _id: string;
  name: string;
  link?: string;
  locationName?: string;
  imageUrl?: string;
  lat?: number;
  lng?: number;
  category?: ProposalCategory;
  votes: number;
  isVotedByMe: boolean;
  isOwnedByMe?: boolean;
  authorName: string;
  authorImage?: string;
  authorUserId?: string;
  voters: Array<{ userId?: string; name: string; image?: string }>;
};

export type AvailabilityMember = {
  userId: string;
  memberId: string;
  name: string;
  image?: string;
  role: "owner" | "member";
  isCurrentUser: boolean;
  availabilities: Array<{
    date: string;
    status: AvailabilityStatus;
  }>;
};

export type PhotoCard = {
  _id: string;
  url: string;
  uploaderName: string;
  uploaderImage?: string;
  uploaderUserId?: string;
  canDelete?: boolean;
};

export type ExpenseCard = {
  _id: string;
  title: string;
  amount: number;
  payerName: string;
  payerImage?: string;
  payerUserId?: string;
};

export type TaskCard = Doc<"packingItems">;
export type ScheduleItem = Doc<"tripScheduleItems">;

export type DashboardCardKind =
  | "hero"
  | "arrival"
  | "weather"
  | "map"
  | "travelers"
  | "tripNotes"
  | "spots"
  | "gallery"
  | "availability"
  | "chat"
  | "note";

export type DashboardCardRecord = {
  _id: Id<"dashboardCards">;
  tripId: Id<"trips">;
  kind: DashboardCardKind;
  title?: string;
  content?: string;
  order: number;
};

export type TripMarker = {
  id: string;
  name: string;
  locationName?: string;
  lat: number;
  lng: number;
  category: "general" | ProposalCategory;
  selected?: boolean;
};

export type CurrentUser = {
  _id: string;
  name: string;
  image?: string | null;
  themePreset: string;
  useTripCoverBackground: boolean;
  lastActiveTripId?: Id<"trips"> | null;
  backgroundTrip?: {
    _id?: Id<"trips"> | null;
    title: string;
    coverUrl?: string | null;
  } | null;
} | null;
