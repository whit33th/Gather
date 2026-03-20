import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
      .query("tripScheduleItems")
      .withIndex("by_trip_order", (q) => q.eq("tripId", args.tripId))
      .collect();
  },
});

export const add = mutation({
  args: {
    tripId: v.id("trips"),
    title: v.string(),
    startsAt: v.string(),
    endsAt: v.string(),
    tone: v.optional(
      v.union(v.literal("purple"), v.literal("green"), v.literal("neutral"))
    ),
  },
  handler: async (ctx, args) => {
    await requireMember(ctx, args.tripId);

    const existing = await ctx.db
      .query("tripScheduleItems")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .collect();

    const order =
      existing.length === 0 ? 0 : Math.max(...existing.map((item) => item.order)) + 1;

    return await ctx.db.insert("tripScheduleItems", {
      tripId: args.tripId,
      title: args.title,
      startsAt: args.startsAt,
      endsAt: args.endsAt,
      tone: args.tone,
      order,
    });
  },
});

export const update = mutation({
  args: {
    itemId: v.id("tripScheduleItems"),
    title: v.string(),
    startsAt: v.string(),
    endsAt: v.string(),
    tone: v.optional(
      v.union(v.literal("purple"), v.literal("green"), v.literal("neutral"))
    ),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);
    if (!item) return;

    await requireMember(ctx, item.tripId);

    await ctx.db.patch(args.itemId, {
      title: args.title,
      startsAt: args.startsAt,
      endsAt: args.endsAt,
      tone: args.tone,
    });
  },
});

export const remove = mutation({
  args: { itemId: v.id("tripScheduleItems") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);
    if (!item) return;

    await requireMember(ctx, item.tripId);
    await ctx.db.delete(args.itemId);
  },
});
