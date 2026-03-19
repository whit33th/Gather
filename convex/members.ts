import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { auth } from "./auth";

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
