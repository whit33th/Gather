import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getMemberProfile } from "./presenters";

export const add = mutation({
  args: {
    tripId: v.id("trips"),
    url: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const member = await ctx.db
      .query("members")
      .withIndex("by_user_trip", (q) => q.eq("userId", userId).eq("tripId", args.tripId))
      .unique();

    if (!member) throw new Error("Not a member");

    const platform = args.url.includes("spotify") ? "spotify" : "apple";

    return await ctx.db.insert("musicLinks", {
      tripId: args.tripId,
      url: args.url,
      platform,
      addedBy: member._id,
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

    const music = await ctx.db
      .query("musicLinks")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .collect();

    return await Promise.all(
      music.map(async (song) => {
        const addedBy = await getMemberProfile(ctx, song.addedBy);
        return {
          ...song,
          addedByName: addedBy?.name ?? "Unknown",
          addedByImage: addedBy?.image,
          addedByUserId: addedBy?.userId,
        };
      })
    );
  },
});
