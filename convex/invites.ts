import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

export const create = mutation({
  args: {
    tripId: v.id("trips"),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    // Verify trip exists and user is part of it
    const trip = await ctx.db.get(args.tripId);
    if (!trip) throw new Error("Trip not found");

    const existingInvite = await ctx.db
      .query("invitations")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .filter((q) => q.eq(q.field("tripId"), args.tripId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();

    if (existingInvite) {
      throw new Error("User already invited");
    }

    await ctx.db.insert("invitations", {
      tripId: args.tripId,
      email: args.email,
      status: "pending",
      invitedBy: userId,
    });
  },
});

export const listPending = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    const user = await ctx.db.get(userId);
    if (!user || !user.email) return []; // Convex auth stores email on user document usually

    const invites = await ctx.db
      .query("invitations")
      .withIndex("by_email", (q) => q.eq("email", user.email as string))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    return Promise.all(
      invites.map(async (invite) => {
        const trip = await ctx.db.get(invite.tripId);
        return {
          ...invite,
          trip,
        };
      })
    );
  },
});

export const respond = mutation({
  args: {
    inviteId: v.id("invitations"),
    accept: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const invite = await ctx.db.get(args.inviteId);
    if (!invite || invite.status !== "pending") {
      throw new Error("Invalid or expired invitation");
    }

    // Verify the user email matches the invite email
    const user = await ctx.db.get(userId);
    if (!user || user.email !== invite.email) {
      throw new Error("Unauthorized");
    }

    if (args.accept) {
      await ctx.db.patch(args.inviteId, { status: "accepted" });
      
      const existingMember = await ctx.db
        .query("members")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .filter((q) => q.eq(q.field("tripId"), invite.tripId))
        .first();

      if (!existingMember) {
        await ctx.db.insert("members", {
          userId,
          tripId: invite.tripId,
          role: "member",
        });
      }
    } else {
      await ctx.db.patch(args.inviteId, { status: "declined" });
    }
  },
});
