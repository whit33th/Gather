import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getMemberProfile } from "./presenters";

export const add = mutation({
  args: {
    tripId: v.id("trips"),
    title: v.string(),
    amount: v.number(),
    category: v.optional(
      v.union(
        v.literal("flights"),
        v.literal("stay"),
        v.literal("food"),
        v.literal("entertainment"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const member = await ctx.db
      .query("members")
      .withIndex("by_user_trip", (q) => q.eq("userId", userId).eq("tripId", args.tripId))
      .unique();

    if (!member) throw new Error("Not a member");

    return await ctx.db.insert("expenses", {
      tripId: args.tripId,
      title: args.title,
      amount: args.amount,
      category: args.category,
      paidBy: member._id,
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

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .collect();

    return await Promise.all(
      expenses.map(async (expense) => {
        const payer = await getMemberProfile(ctx, expense.paidBy);
        return {
          ...expense,
          category: expense.category,
          payerName: payer?.name ?? "Unknown",
          payerImage: payer?.image,
          payerUserId: payer?.userId,
        };
      })
    );
  },
});

export const remove = mutation({
  args: { expenseId: v.id("expenses") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const expense = await ctx.db.get(args.expenseId);
    if (!expense) return;

    const member = await ctx.db
      .query("members")
      .withIndex("by_user_trip", (q) => q.eq("userId", userId).eq("tripId", expense.tripId))
      .unique();

    if (!member || member.role !== "owner") {
       // Only owner can delete for now, or the person who added it
       if (expense.paidBy !== member?._id) throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.expenseId);
  },
});

export const update = mutation({
  args: {
    expenseId: v.id("expenses"),
    title: v.string(),
    amount: v.number(),
    category: v.optional(
      v.union(
        v.literal("flights"),
        v.literal("stay"),
        v.literal("food"),
        v.literal("entertainment"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const expense = await ctx.db.get(args.expenseId);
    if (!expense) return;

    const member = await ctx.db
      .query("members")
      .withIndex("by_user_trip", (q) => q.eq("userId", userId).eq("tripId", expense.tripId))
      .unique();

    if (!member) throw new Error("Not a member");
    if (expense.paidBy !== member._id && member.role !== "owner") {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.expenseId, {
      title: args.title,
      amount: args.amount,
      category: args.category,
    });
  },
});
