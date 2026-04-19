import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const cardKind = v.union(
  v.literal("hero"),
  v.literal("arrival"),
  v.literal("weather"),
  v.literal("map"),
  v.literal("travelers"),
  v.literal("tripNotes"),
  v.literal("spots"),
  v.literal("gallery"),
  v.literal("availability"),
  v.literal("chat"),
  v.literal("note")
);

const singletonKinds = new Set([
  "hero",
  "arrival",
  "weather",
  "map",
  "travelers",
  "tripNotes",
  "spots",
  "gallery",
  "availability",
  "chat",
]);

const defaultCards: Array<{
  kind:
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
  title?: string;
  content?: string;
}> = [
  { kind: "hero" },
  { kind: "arrival" },
  { kind: "weather" },
  { kind: "travelers" },
  {
    kind: "tripNotes",
    title: "Trip Notes",
    content: "Add the high-level itinerary, meeting point, and any shared reminders here.",
  },
  { kind: "spots" },
  { kind: "map" },
  { kind: "availability" },
  {
    kind: "note",
    title: "Must have notes",
    content: "Add transport details, booking confirmations, meeting point, and emergency contacts.",
  },
];

async function requireMember(ctx: any, tripId: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");

  const member = await ctx.db
    .query("members")
    .withIndex("by_user_trip", (q: any) => q.eq("userId", userId).eq("tripId", tripId))
    .unique();

  if (!member) throw new Error("Not a member");
  return member;
}

const v2Kinds = new Set([
  "hero",
  "arrival",
  "travelers",
  "tripNotes",
  "spots",
]);

export const list = query({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const member = await ctx.db
      .query("members")
      .withIndex("by_user_trip", (q) => q.eq("userId", userId).eq("tripId", args.tripId))
      .unique();

    if (!member) return [];

    return await ctx.db
      .query("dashboardCards")
      .withIndex("by_trip_order", (q) => q.eq("tripId", args.tripId))
      .collect();
  },
});

export const ensureDefaults = mutation({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    await requireMember(ctx, args.tripId);

    const existing = await ctx.db
      .query("dashboardCards")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .collect();

    if (existing.length === 0) {
      for (const [index, card] of defaultCards.entries()) {
        await ctx.db.insert("dashboardCards", {
          tripId: args.tripId,
          kind: card.kind,
          title: card.title,
          content: card.content,
          order: index,
        });
      }

      return await ctx.db
        .query("dashboardCards")
        .withIndex("by_trip_order", (q) => q.eq("tripId", args.tripId))
        .collect();
    }

    const hasV2Cards = existing.some((card) => v2Kinds.has(card.kind));
    if (!hasV2Cards) {
      const existingKinds = new Set(existing.map((card) => card.kind));
      let nextOrder = Math.max(...existing.map((card) => card.order)) + 1;

      for (const card of defaultCards) {
        if (existingKinds.has(card.kind)) continue;

        await ctx.db.insert("dashboardCards", {
          tripId: args.tripId,
          kind: card.kind,
          title: card.title,
          content: card.content,
          order: nextOrder,
        });

        nextOrder += 1;
      }
    }

    return await ctx.db
      .query("dashboardCards")
      .withIndex("by_trip_order", (q) => q.eq("tripId", args.tripId))
      .collect();
  },
});

export const add = mutation({
  args: {
    tripId: v.id("trips"),
    kind: cardKind,
    title: v.optional(v.string()),
    content: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireMember(ctx, args.tripId);

    const existing = await ctx.db
      .query("dashboardCards")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .collect();

    if (singletonKinds.has(args.kind)) {
      const duplicate = existing.find((card) => card.kind === args.kind);
      if (duplicate) {
        return duplicate._id;
      }
    }

    const nextOrder =
      existing.length === 0 ? 0 : Math.max(...existing.map((card) => card.order)) + 1;

    return await ctx.db.insert("dashboardCards", {
      tripId: args.tripId,
      kind: args.kind,
      title: args.title,
      content: args.content,
      order: nextOrder,
    });
  },
});

export const update = mutation({
  args: {
    cardId: v.id("dashboardCards"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.cardId);
    if (!card) return;

    await requireMember(ctx, card.tripId);

    await ctx.db.patch(args.cardId, {
      title: args.title,
      content: args.content,
    });
  },
});

export const remove = mutation({
  args: { cardId: v.id("dashboardCards") },
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.cardId);
    if (!card) return;

    await requireMember(ctx, card.tripId);
    await ctx.db.delete(args.cardId);
  },
});

export const reorder = mutation({
  args: {
    tripId: v.id("trips"),
    cardIds: v.array(v.id("dashboardCards")),
  },
  handler: async (ctx, args) => {
    await requireMember(ctx, args.tripId);

    const existing = await ctx.db
      .query("dashboardCards")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .collect();

    const existingIds = new Set(existing.map((card) => card._id));
    const hasInvalidIds =
      existing.length !== args.cardIds.length ||
      args.cardIds.some((cardId) => !existingIds.has(cardId));

    if (hasInvalidIds) {
      throw new Error("Invalid dashboard card order");
    }

    for (const [order, cardId] of args.cardIds.entries()) {
      await ctx.db.patch(cardId, { order });
    }
  },
});
