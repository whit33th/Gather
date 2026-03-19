import { ActionCache } from "@convex-dev/action-cache";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { components } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { action, internalAction, mutation, query } from "./_generated/server";
import {
  extractProposalLinkPreview,
  getProposalProvider,
  normalizeProposalLink,
  type ProposalLinkPreview,
} from "../lib/proposal-links";
import { getMemberProfile } from "./presenters";

const selectionFieldByCategory = {
  accommodation: "selectedAccommodationId",
  food: "selectedFoodId",
  activity: "selectedActivityId",
  favorite: "selectedFavoriteId",
} as const;

type ProposalCategory = keyof typeof selectionFieldByCategory;

function getSelectionPatch(category: ProposalCategory, accommodationId?: Id<"accommodations">) {
  if (category === "accommodation") {
    return { selectedAccommodationId: accommodationId };
  }

  if (category === "food") {
    return { selectedFoodId: accommodationId };
  }

  if (category === "activity") {
    return { selectedActivityId: accommodationId };
  }

  return { selectedFavoriteId: accommodationId };
}

const proposalLinkPreviewCache = new ActionCache(components.actionCache, {
  action: internal.proposals.fetchLinkMetadata,
  name: "proposal-link-preview-v1",
  ttl: 1000 * 60 * 60 * 24 * 7,
});

// Generic proposals (can be accommodation or activity based on schema)
export const addAccommodation = mutation({
  args: {
    tripId: v.id("trips"),
    name: v.string(),
    link: v.optional(v.string()),
    price: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
    locationName: v.optional(v.string()),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    category: v.optional(v.union(v.literal("accommodation"), v.literal("food"), v.literal("activity"), v.literal("favorite"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const member = await ctx.db
      .query("members")
      .withIndex("by_user_trip", (q) => q.eq("userId", userId).eq("tripId", args.tripId))
      .unique();

    if (!member) throw new Error("Not a member");

    return await ctx.db.insert("accommodations", {
      tripId: args.tripId,
      name: args.name,
      link: args.link,
      price: args.price,
      imageUrl: args.imageUrl,
      locationName: args.locationName,
      lat: args.lat,
      lng: args.lng,
      category: args.category,
      addedBy: member._id,
    });
  },
});

export const listAccommodations = query({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const member = await ctx.db
      .query("members")
      .withIndex("by_user_trip", (q) => q.eq("userId", userId).eq("tripId", args.tripId))
      .unique();

    if (!member) return [];

    const items = await ctx.db
      .query("accommodations")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .collect();

    return await Promise.all(
      items.map(async (item) => {
        const [author, votes] = await Promise.all([
          getMemberProfile(ctx, item.addedBy),
          ctx.db
          .query("accommodationVotes")
          .withIndex("by_accommodation", (q) => q.eq("accommodationId", item._id))
          .collect(),
        ]);
        const voters = (
          await Promise.all(votes.map((vote) => getMemberProfile(ctx, vote.memberId)))
        ).filter((profile) => profile !== null);

        return {
          ...item,
          votes: voters.length,
          isVotedByMe: votes.some((vote) => vote.memberId === member._id),
          isOwnedByMe: item.addedBy === member._id,
          authorName: author?.name ?? "Unknown",
          authorImage: author?.image,
          authorUserId: author?.userId,
          voters: voters.map((voter) => ({
            userId: voter.userId,
            name: voter.name,
            image: voter.image,
          })),
        };
      })
    );
  },
});

export const voteAccommodation = mutation({
  args: { accommodationId: v.id("accommodations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const acc = await ctx.db.get(args.accommodationId);
    if (!acc) throw new Error("Not found");

    const member = await ctx.db
      .query("members")
      .withIndex("by_user_trip", (q) => q.eq("userId", userId).eq("tripId", acc.tripId))
      .unique();

    if (!member) throw new Error("Not a member");

    const existing = await ctx.db
      .query("accommodationVotes")
      .withIndex("by_accommodation_member", (q) => q.eq("accommodationId", args.accommodationId).eq("memberId", member._id))
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    } else {
      await ctx.db.insert("accommodationVotes", {
        accommodationId: args.accommodationId,
        memberId: member._id,
      });
    }
  },
});

export const updateAccommodation = mutation({
  args: {
    accommodationId: v.id("accommodations"),
    name: v.string(),
    link: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    locationName: v.optional(v.string()),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    category: v.optional(
      v.union(
        v.literal("accommodation"),
        v.literal("food"),
        v.literal("activity"),
        v.literal("favorite")
      )
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const accommodation = await ctx.db.get(args.accommodationId);
    if (!accommodation) throw new Error("Not found");

    const member = await ctx.db
      .query("members")
      .withIndex("by_user_trip", (q) => q.eq("userId", userId).eq("tripId", accommodation.tripId))
      .unique();

    if (!member) throw new Error("Not a member");
    if (accommodation.addedBy !== member._id) throw new Error("Only the author can edit this proposal");

    const previousCategory = accommodation.category || "accommodation";
    const nextCategory = args.category || "accommodation";

    await ctx.db.patch(args.accommodationId, {
      name: args.name,
      link: args.link,
      imageUrl: args.imageUrl,
      locationName: args.locationName,
      lat: args.lat,
      lng: args.lng,
      category: args.category,
    });

    if (previousCategory !== nextCategory) {
      const trip = await ctx.db.get(accommodation.tripId);
      if (!trip) {
        return;
      }

      const selectedField = selectionFieldByCategory[previousCategory];
      if (trip[selectedField] === accommodation._id) {
        await ctx.db.patch(accommodation.tripId, getSelectionPatch(previousCategory));
      }
    }
  },
});

export const removeAccommodation = mutation({
  args: { accommodationId: v.id("accommodations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const accommodation = await ctx.db.get(args.accommodationId);
    if (!accommodation) throw new Error("Not found");

    const member = await ctx.db
      .query("members")
      .withIndex("by_user_trip", (q) => q.eq("userId", userId).eq("tripId", accommodation.tripId))
      .unique();

    if (!member) throw new Error("Not a member");
    if (accommodation.addedBy !== member._id) throw new Error("Only the author can remove this proposal");

    const votes = await ctx.db
      .query("accommodationVotes")
      .withIndex("by_accommodation", (q) => q.eq("accommodationId", args.accommodationId))
      .collect();

    await Promise.all(votes.map((vote) => ctx.db.delete(vote._id)));

    const trip = await ctx.db.get(accommodation.tripId);
    if (trip) {
      const proposalCategory = accommodation.category || "accommodation";
      const selectedField = selectionFieldByCategory[proposalCategory];
      if (trip[selectedField] === accommodation._id) {
        await ctx.db.patch(accommodation.tripId, getSelectionPatch(proposalCategory));
      }
    }

    await ctx.db.delete(args.accommodationId);
  },
});

export const setSelectedProposal = mutation({
  args: {
    tripId: v.id("trips"),
    category: v.union(
      v.literal("accommodation"),
      v.literal("food"),
      v.literal("activity"),
      v.literal("favorite")
    ),
    accommodationId: v.optional(v.id("accommodations")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const member = await ctx.db
      .query("members")
      .withIndex("by_user_trip", (q) => q.eq("userId", userId).eq("tripId", args.tripId))
      .unique();

    if (!member) throw new Error("Not a member");
    if (member.role !== "owner") throw new Error("Only the trip owner can choose the final option");

    if (args.accommodationId) {
      const accommodation = await ctx.db.get(args.accommodationId);
      if (!accommodation || accommodation.tripId !== args.tripId) {
        throw new Error("Proposal not found");
      }

      const proposalCategory = accommodation.category || "accommodation";
      if (proposalCategory !== args.category) {
        throw new Error("Proposal category mismatch");
      }
    }

    await ctx.db.patch(args.tripId, getSelectionPatch(args.category, args.accommodationId));
  },
});

export const getLinkPreview = action({
  args: { url: v.string() },
  handler: async (ctx, args): Promise<ProposalLinkPreview> => {
    const normalizedUrl = normalizeProposalLink(args.url);
    const provider = getProposalProvider(normalizedUrl);

    if (!normalizedUrl || !provider) {
      return { normalizedUrl, provider };
    }

    try {
      return await proposalLinkPreviewCache.fetch(ctx, { url: normalizedUrl });
    } catch (error) {
      console.error("Failed to load proposal link preview", error);
      return { normalizedUrl, provider };
    }
  },
});

export const fetchLinkMetadata = internalAction({
  args: { url: v.string() },
  handler: async (_ctx, args): Promise<ProposalLinkPreview> => {
    const normalizedUrl = normalizeProposalLink(args.url);
    const provider = getProposalProvider(normalizedUrl);

    if (!normalizedUrl || !provider) {
      return { normalizedUrl, provider };
    }

    const response = await fetch(normalizedUrl, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
        accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`Could not fetch ${normalizedUrl}: ${response.status}`);
    }

    const html = await response.text();
    return extractProposalLinkPreview(html, normalizedUrl);
  },
});
