import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

type ConvexCtx = QueryCtx | MutationCtx;

const selectionFieldByCategory = {
  accommodation: "selectedAccommodationId",
  food: "selectedFoodId",
  activity: "selectedActivityId",
  favorite: "selectedFavoriteId",
} as const;

type ProposalCategory = keyof typeof selectionFieldByCategory;

const ONE_DAY_MS = 1000 * 60 * 60 * 24;

function getTripDayCount(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);
  const delta = Math.round((end.getTime() - start.getTime()) / ONE_DAY_MS);
  return Math.max(delta + 1, 1);
}

function getTripDates(startDate: string, endDate: string) {
  const totalDays = getTripDayCount(startDate, endDate);
  const start = new Date(`${startDate}T00:00:00.000Z`);

  return Array.from({ length: totalDays }, (_, index) => {
    const date = new Date(start.getTime() + index * ONE_DAY_MS);
    return date.toISOString().slice(0, 10);
  });
}

function extractCountryLabel(trip: Pick<Doc<"trips">, "destination" | "locationName">) {
  const source = (trip.locationName || trip.destination).trim();
  if (!source) return undefined;

  const segments = source
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean);

  return segments.at(-1) || source;
}

async function requireTripMember(ctx: ConvexCtx, tripId: Id<"trips">) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    return null;
  }

  const membership = await ctx.db
    .query("members")
    .withIndex("by_user_trip", (q) => q.eq("userId", userId).eq("tripId", tripId))
    .unique();

  if (!membership) {
    return null;
  }

  return { membership, userId };
}

async function getUserTripHistory(ctx: ConvexCtx, userId: Id<"users">) {
  const memberships = await ctx.db
    .query("members")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();

  const trips = (
    await Promise.all(
      memberships.map(async (membership: Doc<"members">) => {
        const trip = await ctx.db.get(membership.tripId);
        if (!trip) return null;

        return {
          tripId: trip._id,
          title: trip.title,
          destination: trip.destination,
          locationName: trip.locationName,
          startDate: trip.startDate,
          endDate: trip.endDate,
          role: membership.role,
          country: extractCountryLabel(trip),
        };
      }),
    )
  )
    .filter((trip): trip is NonNullable<typeof trip> => trip !== null)
    .sort((left, right) => right.startDate.localeCompare(left.startDate));

  return {
    countries: Array.from(
      new Set(trips.map((trip) => trip.country).filter((country): country is string => Boolean(country))),
    ),
    trips,
  };
}

async function buildMemberSummary(
  ctx: ConvexCtx,
  member: Doc<"members">,
  trip: Doc<"trips">,
  viewerUserId: Id<"users">,
  scope: {
    expenses: Doc<"expenses">[];
    photos: Doc<"photos">[];
    proposals: Doc<"accommodations">[];
    songs: Doc<"musicLinks">[];
  },
  history: Awaited<ReturnType<typeof getUserTripHistory>>,
) {
  const [user, availabilities] = await Promise.all([
    ctx.db.get(member.userId),
    ctx.db
      .query("availabilities")
      .withIndex("by_member", (q) => q.eq("memberId", member._id))
      .collect(),
  ]);

  const tripDays = getTripDayCount(trip.startDate, trip.endDate);
  const proposalCount = scope.proposals.filter((proposal) => proposal.addedBy === member._id).length;
  const photoCount = scope.photos.filter((photo) => photo.uploaderId === member._id).length;
  const songCount = scope.songs.filter((song) => song.addedBy === member._id).length;
  const expenseCount = scope.expenses.filter((expense) => expense.paidBy === member._id).length;
  const contributionCount = proposalCount + photoCount + songCount + expenseCount;
  const availabilityCount = availabilities.length;

  return {
    userId: member.userId,
    memberId: member._id,
    name: user?.name ?? "Unknown",
    image: user?.image,
    role: member.role,
    isCurrentUser: member.userId === viewerUserId,
    joinedAt: member._creationTime,
    availabilityCount,
    availabilityCoverage: tripDays > 0 ? availabilityCount / tripDays : 0,
    availabilityStatus:
      availabilityCount === 0 ? "empty" : availabilityCount >= tripDays ? "ready" : "partial",
    tripCount: history.trips.length,
    countryCount: history.countries.length,
    contributionCount,
    proposalCount,
    photoCount,
    songCount,
    expenseCount,
    visitedCountries: history.countries,
    visitedTrips: history.trips,
    rawAvailabilities: availabilities,
  };
}

async function deleteIds(ctx: MutationCtx, ids: Iterable<Id<any>>) {
  for (const id of ids) {
    await ctx.db.delete(id);
  }
}

export const joinTrip = mutation({
  args: {
    tripId: v.id("trips"),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Unauthenticated");
    }

    // Check if trip exists
    const trip = await ctx.db.get(args.tripId);
    if (!trip) throw new Error("Trip not found");

    // Check if already a member
    const existing = await ctx.db
      .query("members")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("tripId"), args.tripId))
      .first();

    if (!existing) {
      await ctx.db.insert("members", {
        userId,
        tripId: args.tripId,
        role: "member",
      });
    }

    return args.tripId;
  },
});

export const roster = query({
  args: {
    tripId: v.id("trips"),
  },
  handler: async (ctx, args) => {
    const membershipResult = await requireTripMember(ctx, args.tripId);
    if (!membershipResult) {
      return [];
    }

    const trip = await ctx.db.get(args.tripId);
    if (!trip) {
      return [];
    }

    const [members, proposals, photos, songs, expenses] = await Promise.all([
      ctx.db.query("members").withIndex("by_trip", (q) => q.eq("tripId", args.tripId)).collect(),
      ctx.db.query("accommodations").withIndex("by_trip", (q) => q.eq("tripId", args.tripId)).collect(),
      ctx.db.query("photos").withIndex("by_trip", (q) => q.eq("tripId", args.tripId)).collect(),
      ctx.db.query("musicLinks").withIndex("by_trip", (q) => q.eq("tripId", args.tripId)).collect(),
      ctx.db.query("expenses").withIndex("by_trip", (q) => q.eq("tripId", args.tripId)).collect(),
    ]);

    const historyCache = new Map<string, Awaited<ReturnType<typeof getUserTripHistory>>>();

    const roster = await Promise.all(
      members.map(async (member) => {
        const cacheKey = member.userId as string;
        const history =
          historyCache.get(cacheKey) || (await getUserTripHistory(ctx, member.userId));

        historyCache.set(cacheKey, history);

        const summary = await buildMemberSummary(
          ctx,
          member,
          trip,
          membershipResult.userId,
          { expenses, photos, proposals, songs },
          history,
        );

        return {
          ...summary,
          rawAvailabilities: undefined,
        };
      }),
    );

    return roster.sort((left, right) => {
      if (left.isCurrentUser !== right.isCurrentUser) {
        return left.isCurrentUser ? -1 : 1;
      }

      if (left.role !== right.role) {
        return left.role === "owner" ? -1 : 1;
      }

      if (right.availabilityCoverage !== left.availabilityCoverage) {
        return right.availabilityCoverage - left.availabilityCoverage;
      }

      return left.name.localeCompare(right.name);
    });
  },
});

export const profile = query({
  args: {
    tripId: v.id("trips"),
    memberId: v.id("members"),
  },
  handler: async (ctx, args) => {
    const membershipResult = await requireTripMember(ctx, args.tripId);
    if (!membershipResult) {
      return null;
    }

    const [trip, member] = await Promise.all([ctx.db.get(args.tripId), ctx.db.get(args.memberId)]);

    if (!trip || !member || member.tripId !== args.tripId) {
      return null;
    }

    const [proposals, photos, songs, expenses, history] = await Promise.all([
      ctx.db.query("accommodations").withIndex("by_trip", (q) => q.eq("tripId", args.tripId)).collect(),
      ctx.db.query("photos").withIndex("by_trip", (q) => q.eq("tripId", args.tripId)).collect(),
      ctx.db.query("musicLinks").withIndex("by_trip", (q) => q.eq("tripId", args.tripId)).collect(),
      ctx.db.query("expenses").withIndex("by_trip", (q) => q.eq("tripId", args.tripId)).collect(),
      getUserTripHistory(ctx, member.userId),
    ]);

    const summary = await buildMemberSummary(
      ctx,
      member,
      trip,
      membershipResult.userId,
      { expenses, photos, proposals, songs },
      history,
    );

    const availabilityByDate = new Map(
      summary.rawAvailabilities.map((entry) => [entry.date, entry.status] as const),
    );
    const proposalBreakdown = ["accommodation", "food", "activity", "favorite"].map((category) => ({
      category,
      count: proposals.filter(
        (proposal) => proposal.addedBy === member._id && (proposal.category || "accommodation") === category,
      ).length,
    }));
    const gallery = photos
      .filter((photo) => photo.uploaderId === member._id)
      .sort((left, right) => right._creationTime - left._creationTime)
      .slice(0, 4)
      .map((photo) => ({
        id: photo._id,
        url: photo.url,
        createdAt: photo._creationTime,
      }));

    return {
      ...summary,
      rawAvailabilities: undefined,
      currentTrip: {
        tripId: trip._id,
        title: trip.title,
        destination: trip.destination,
        locationName: trip.locationName,
        startDate: trip.startDate,
        endDate: trip.endDate,
        totalDates: getTripDayCount(trip.startDate, trip.endDate),
        country: extractCountryLabel(trip),
      },
      availability: getTripDates(trip.startDate, trip.endDate).map((date) => ({
        date,
        status: availabilityByDate.get(date) || null,
      })),
      gallery,
      proposalBreakdown,
      expenseTotal: expenses
        .filter((expense) => expense.paidBy === member._id)
        .reduce((sum, expense) => sum + expense.amount, 0),
    };
  },
});

export const removeFromTrip = mutation({
  args: {
    tripId: v.id("trips"),
    memberId: v.id("members"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const currentMember = await ctx.db
      .query("members")
      .withIndex("by_user_trip", (q) => q.eq("userId", userId).eq("tripId", args.tripId))
      .unique();

    if (!currentMember) {
      throw new Error("Not a member");
    }

    const targetMember = await ctx.db.get(args.memberId);
    if (!targetMember || targetMember.tripId !== args.tripId) {
      return null;
    }

    const isSelf = targetMember.userId === userId;
    if (!isSelf && currentMember.role !== "owner") {
      throw new Error("Only the trip owner can remove other members");
    }

    if (targetMember.role === "owner") {
      throw new Error("Trip owners cannot be removed from this screen");
    }

    const [
      trip,
      availabilities,
      votesByMember,
      expenses,
      expenseSplitsByMember,
      proposals,
      messages,
      tasks,
      photos,
      musicLinks,
      markers,
    ] = await Promise.all([
      ctx.db.get(args.tripId),
      ctx.db.query("availabilities").withIndex("by_member", (q) => q.eq("memberId", args.memberId)).collect(),
      ctx.db
        .query("accommodationVotes")
        .withIndex("by_member", (q) => q.eq("memberId", args.memberId))
        .collect(),
      ctx.db.query("expenses").withIndex("by_trip", (q) => q.eq("tripId", args.tripId)).collect(),
      ctx.db.query("expenseSplits").withIndex("by_member", (q) => q.eq("memberId", args.memberId)).collect(),
      ctx.db.query("accommodations").withIndex("by_trip", (q) => q.eq("tripId", args.tripId)).collect(),
      ctx.db.query("messages").withIndex("by_trip", (q) => q.eq("tripId", args.tripId)).collect(),
      ctx.db.query("packingItems").withIndex("by_trip", (q) => q.eq("tripId", args.tripId)).collect(),
      ctx.db.query("photos").withIndex("by_trip", (q) => q.eq("tripId", args.tripId)).collect(),
      ctx.db.query("musicLinks").withIndex("by_trip", (q) => q.eq("tripId", args.tripId)).collect(),
      ctx.db.query("markers").withIndex("by_trip", (q) => q.eq("tripId", args.tripId)).collect(),
    ]);

    const proposalIdsToDelete = proposals
      .filter((proposal) => proposal.addedBy === args.memberId)
      .map((proposal) => proposal._id);
    const expenseIdsToDelete = expenses
      .filter((expense) => expense.paidBy === args.memberId)
      .map((expense) => expense._id);
    const voteIdsByProposal = new Set<Id<"accommodationVotes">>(
      votesByMember.map((vote) => vote._id),
    );
    const expenseSplitIds = new Set<Id<"expenseSplits">>(
      expenseSplitsByMember.map((split) => split._id),
    );

    for (const proposal of proposals) {
      if (proposal.addedBy !== args.memberId) {
        continue;
      }

      const proposalVotes = await ctx.db
        .query("accommodationVotes")
        .withIndex("by_accommodation", (q) => q.eq("accommodationId", proposal._id))
        .collect();

      for (const vote of proposalVotes) {
        voteIdsByProposal.add(vote._id);
      }

      if (trip) {
        const proposalCategory = (proposal.category || "accommodation") as ProposalCategory;
        const selectedField = selectionFieldByCategory[proposalCategory];

        if (trip[selectedField] === proposal._id) {
          await ctx.db.patch(args.tripId, { [selectedField]: undefined });
        }
      }
    }

    for (const expense of expenses) {
      if (expense.paidBy !== args.memberId) {
        continue;
      }

      const splits = await ctx.db
        .query("expenseSplits")
        .withIndex("by_expense", (q) => q.eq("expenseId", expense._id))
        .collect();

      for (const split of splits) {
        expenseSplitIds.add(split._id);
      }
    }

    for (const task of tasks) {
      if (task.assignedTo === args.memberId) {
        await ctx.db.patch(task._id, { assignedTo: undefined });
      }
    }

    await deleteIds(
      ctx,
      availabilities.map((entry) => entry._id),
    );
    await deleteIds(ctx, voteIdsByProposal);
    await deleteIds(
      ctx,
      messages.filter((message) => message.senderId === args.memberId).map((message) => message._id),
    );
    await deleteIds(
      ctx,
      photos.filter((photo) => photo.uploaderId === args.memberId).map((photo) => photo._id),
    );
    await deleteIds(
      ctx,
      musicLinks.filter((link) => link.addedBy === args.memberId).map((link) => link._id),
    );
    await deleteIds(
      ctx,
      markers.filter((marker) => marker.addedBy === args.memberId).map((marker) => marker._id),
    );
    await deleteIds(ctx, expenseSplitIds);
    await deleteIds(ctx, expenseIdsToDelete);
    await deleteIds(ctx, proposalIdsToDelete);
    await ctx.db.delete(args.memberId);

    return {
      removedMemberId: args.memberId,
      removedSelf: isSelf,
    };
  },
});
