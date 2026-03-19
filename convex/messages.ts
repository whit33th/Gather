import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getMemberProfile } from "./presenters";

export const send = mutation({
  args: {
    tripId: v.id("trips"),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const member = await ctx.db
      .query("members")
      .withIndex("by_user_trip", (q) => q.eq("userId", userId).eq("tripId", args.tripId))
      .unique();

    if (!member) throw new Error("Not a member of this trip");

    await ctx.db.insert("messages", {
      tripId: args.tripId,
      senderId: member._id,
      text: args.text,
    });
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

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .collect();

    return await Promise.all(
      messages.map(async (msg) => {
        const profile = await getMemberProfile(ctx, msg.senderId);
        return {
          ...msg,
          senderName: profile?.name ?? "Unknown",
          senderImage: profile?.image,
          senderUserId: profile?.userId,
        };
      })
    );
  },
});
