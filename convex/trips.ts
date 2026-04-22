import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { tripDateRangeSchema } from "../lib/validation/tripDates";
import { mutation, query } from "./_generated/server";
// Create a new trip
export const create = mutation({
  args: {
    title: v.string(),
    destination: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    coverUrl: v.optional(v.string()),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    locationName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const parsedDates = tripDateRangeSchema.safeParse({
      startDate: args.startDate,
      endDate: args.endDate,
    });
    if (!parsedDates.success) {
      throw new Error(parsedDates.error.issues[0]?.message ?? "Invalid trip dates");
    }

    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthenticated");
    }

    // Insert the trip
    const tripId = await ctx.db.insert("trips", {
      title: args.title,
      destination: args.destination,
      startDate: args.startDate,
      endDate: args.endDate,
      createdBy: userId,
      coverUrl: args.coverUrl,
      lat: args.lat,
      lng: args.lng,
      locationName: args.locationName,
    });

    // Add the creator as an owner member
    await ctx.db.insert("members", {
      userId,
      tripId,
      role: "owner",
    });

    return tripId;
  },
});

// Get all trips the user is a member of
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const memberships = await ctx.db
      .query("members")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const trips = await Promise.all(
      memberships.map(async (m) => {
        return await ctx.db.get(m.tripId);
      })
    );

    // Filter out potential nulls if a trip was deleted
    return trips.filter((t): t is NonNullable<typeof t> => t !== null);
  },
});

export const get = query({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const member = await ctx.db
      .query("members")
      .withIndex("by_user_trip", (q) => q.eq("userId", userId).eq("tripId", args.tripId))
      .unique();

    if (!member) return null;

    return await ctx.db.get(args.tripId);
  },
});

export const getPublic = query({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    const trip = await ctx.db.get(args.tripId);
    if (!trip) return null;
    return {
      _id: trip._id,
      title: trip.title,
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
    };
  },
});

export const update = mutation({
  args: {
    tripId: v.id("trips"),
    title: v.string(),
    destination: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    coverUrl: v.optional(v.string()),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    locationName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const parsedDates = tripDateRangeSchema.safeParse({
      startDate: args.startDate,
      endDate: args.endDate,
    });
    if (!parsedDates.success) {
      throw new Error(parsedDates.error.issues[0]?.message ?? "Invalid trip dates");
    }

    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthenticated");
    }

    const member = await ctx.db
      .query("members")
      .withIndex("by_user_trip", (q) => q.eq("userId", userId).eq("tripId", args.tripId))
      .unique();

    if (!member || member.role !== "owner") {
      throw new Error("Only the trip owner can update trip settings");
    }

    await ctx.db.patch(args.tripId, {
      title: args.title,
      destination: args.destination,
      startDate: args.startDate,
      endDate: args.endDate,
      coverUrl: args.coverUrl,
      lat: args.lat,
      lng: args.lng,
      locationName: args.locationName,
    });
  },
});
