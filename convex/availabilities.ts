import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getMemberProfile } from "./presenters";

export const update = mutation({
  args: {
    tripId: v.id("trips"),
    date: v.string(),
    status: v.union(v.literal("yes"), v.literal("no"), v.literal("maybe")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const member = await ctx.db
      .query("members")
      .withIndex("by_user_trip", (q) => q.eq("userId", userId).eq("tripId", args.tripId))
      .unique();

    if (!member) throw new Error("Not a member");

    const existing = await ctx.db
      .query("availabilities")
      .withIndex("by_member", (q) => q.eq("memberId", member._id))
      .filter((q) => q.eq(q.field("date"), args.date))
      .unique();

    if (existing) {
      if (existing.status === args.status) {
        await ctx.db.delete(existing._id);
      } else {
        await ctx.db.patch(existing._id, { status: args.status });
      }
    } else {
      await ctx.db.insert("availabilities", {
        memberId: member._id,
        date: args.date,
        status: args.status,
      });
    }
  },
});

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

    const members = await ctx.db
      .query("members")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .collect();

    const result = [];
    for (const member of members) {
      const avails = await ctx.db
        .query("availabilities")
        .withIndex("by_member", (q) => q.eq("memberId", member._id))
        .collect();
      const profile = await getMemberProfile(ctx, member._id);
      result.push({
        userId: member.userId,
        memberId: member._id,
        name: profile?.name ?? "Unknown",
        image: profile?.image,
        role: profile?.role ?? "member",
        isCurrentUser: member.userId === userId,
        availabilities: avails,
      });
    }
    return result;
  },
});
