import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const add = mutation({
  args: {
    tripId: v.id("trips"),
    name: v.string(),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const member = await ctx.db
      .query("members")
      .withIndex("by_user_trip", (q) => q.eq("userId", userId).eq("tripId", args.tripId))
      .unique();

    if (!member) throw new Error("Not a member");

    return await ctx.db.insert("packingItems", {
      tripId: args.tripId,
      name: args.name,
      category: args.category,
      isChecked: false,
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

    return await ctx.db
      .query("packingItems")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .collect();
  },
});

export const toggle = mutation({
  args: { taskId: v.id("packingItems") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const task = await ctx.db.get(args.taskId);
    if (!task) return;

    const member = await ctx.db
      .query("members")
      .withIndex("by_user_trip", (q) => q.eq("userId", userId).eq("tripId", task.tripId))
      .unique();

    if (!member) throw new Error("Not a member");

    await ctx.db.patch(args.taskId, { isChecked: !task.isChecked });
  },
});

export const update = mutation({
  args: {
    taskId: v.id("packingItems"),
    name: v.string(),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const task = await ctx.db.get(args.taskId);
    if (!task) return;

    const member = await ctx.db
      .query("members")
      .withIndex("by_user_trip", (q) => q.eq("userId", userId).eq("tripId", task.tripId))
      .unique();

    if (!member) throw new Error("Not a member");

    await ctx.db.patch(args.taskId, {
      name: args.name,
      category: args.category,
    });
  },
});

export const remove = mutation({
  args: { taskId: v.id("packingItems") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const task = await ctx.db.get(args.taskId);
    if (!task) return;

    const member = await ctx.db
      .query("members")
      .withIndex("by_user_trip", (q) => q.eq("userId", userId).eq("tripId", task.tripId))
      .unique();

    if (!member) throw new Error("Not a member");

    await ctx.db.delete(args.taskId);
  },
});
