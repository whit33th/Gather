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

    return await ctx.db.insert("photos", {
      tripId: args.tripId,
      url: args.url,
      uploaderId: member._id,
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

    const photos = await ctx.db
      .query("photos")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .collect();

    return await Promise.all(
      [...photos]
        .sort((left, right) => right._creationTime - left._creationTime)
        .map(async (photo) => {
        const uploader = await getMemberProfile(ctx, photo.uploaderId);
        return {
          ...photo,
          uploaderName: uploader?.name ?? "Unknown",
          uploaderImage: uploader?.image,
          uploaderUserId: uploader?.userId,
          canDelete: photo.uploaderId === member._id || member.role === "owner",
        };
        })
    );
  },
});

export const remove = mutation({
  args: { photoId: v.id("photos") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const photo = await ctx.db.get(args.photoId);
    if (!photo) return;

    const member = await ctx.db
      .query("members")
      .withIndex("by_user_trip", (q) => q.eq("userId", userId).eq("tripId", photo.tripId))
      .unique();

    if (!member) throw new Error("Not a member");
    if (photo.uploaderId !== member._id && member.role !== "owner") {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.photoId);
  },
});
