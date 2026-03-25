import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { DEFAULT_THEME_PRESET } from "../lib/theme";

export const current = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }

    let backgroundTrip:
      | {
          _id: typeof user.lastActiveTripId;
          title: string;
          coverUrl?: string;
        }
      | null = null;

    if (user.lastActiveTripId) {
      const membership = await ctx.db
        .query("members")
        .withIndex("by_user_trip", (q) =>
          q.eq("userId", userId).eq("tripId", user.lastActiveTripId!)
        )
        .unique();

      if (membership) {
        const trip = await ctx.db.get(user.lastActiveTripId);
        if (trip) {
          backgroundTrip = {
            _id: trip._id,
            title: trip.title,
            coverUrl: trip.coverUrl,
          };
        }
      }
    }

    return {
      _id: user._id,
      name: user.name ?? "Traveler",
      image: user.image ?? null,
      themePreset: user.themePreset ?? DEFAULT_THEME_PRESET,
      useTripCoverBackground: user.useTripCoverBackground ?? true,
      lastActiveTripId: user.lastActiveTripId ?? null,
      backgroundTrip,
    };
  },
});

export const updateAppearance = mutation({
  args: {
    themePreset: v.union(
      v.literal("forest"),
      v.literal("blush"),
      v.literal("earth"),
      v.literal("obsidian"),
      v.literal("white"),
      v.literal("babyBlue")
    ),
    useTripCoverBackground: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthenticated");
    }

    await ctx.db.patch(userId, {
      themePreset: args.themePreset,
      useTripCoverBackground: args.useTripCoverBackground,
    });
  },
});

export const setLastActiveTrip = mutation({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthenticated");
    }

    const membership = await ctx.db
      .query("members")
      .withIndex("by_user_trip", (q) => q.eq("userId", userId).eq("tripId", args.tripId))
      .unique();

    if (!membership) {
      throw new Error("Not a member of this trip");
    }

    await ctx.db.patch(userId, {
      lastActiveTripId: args.tripId,
    });
  },
});
