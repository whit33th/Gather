import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  trips: defineTable({
    title: v.string(),
    destination: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    createdBy: v.id("users"),
    coverUrl: v.optional(v.string()),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    locationName: v.optional(v.string()),
    selectedAccommodationId: v.optional(v.id("accommodations")),
    selectedFoodId: v.optional(v.id("accommodations")),
    selectedActivityId: v.optional(v.id("accommodations")),
    selectedFavoriteId: v.optional(v.id("accommodations")),
  })
    .index("by_createdBy", ["createdBy"]),

  members: defineTable({
    userId: v.id("users"),
    tripId: v.id("trips"),
    role: v.union(v.literal("owner"), v.literal("member")),
  })
    .index("by_trip", ["tripId"])
    .index("by_user", ["userId"])
    .index("by_user_trip", ["userId", "tripId"]),
    
  invitations: defineTable({
    tripId: v.id("trips"),
    email: v.string(), // The email invited
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("declined")),
    invitedBy: v.id("users"),
  })
    .index("by_trip", ["tripId"])
    .index("by_email", ["email"]),

  availabilities: defineTable({
    memberId: v.id("members"),
    date: v.string(), // ISO string date
    status: v.union(v.literal("yes"), v.literal("no"), v.literal("maybe")),
  })
    .index("by_member", ["memberId"]),

  accommodations: defineTable({
    tripId: v.id("trips"),
    name: v.string(),
    link: v.optional(v.string()),
    price: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
    locationName: v.optional(v.string()),
    addedBy: v.id("members"),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    category: v.optional(v.union(v.literal("accommodation"), v.literal("food"), v.literal("activity"), v.literal("favorite"))),
  })
    .index("by_trip", ["tripId"]),
    
  accommodationVotes: defineTable({
    accommodationId: v.id("accommodations"),
    memberId: v.id("members"),
  })
    .index("by_accommodation", ["accommodationId"])
    .index("by_member", ["memberId"])
    .index("by_accommodation_member", ["accommodationId", "memberId"]),

  activities: defineTable({
    tripId: v.id("trips"),
    name: v.string(),
    link: v.optional(v.string()),
    description: v.optional(v.string()),
    addedBy: v.id("members"),
  })
    .index("by_trip", ["tripId"]),
    
  activityVotes: defineTable({
    activityId: v.id("activities"),
    memberId: v.id("members"),
  })
    .index("by_activity", ["activityId"])
    .index("by_member", ["memberId"]),

  expenses: defineTable({
    tripId: v.id("trips"),
    title: v.string(),
    amount: v.number(),
    paidBy: v.id("members"),
  })
    .index("by_trip", ["tripId"]),

  expenseSplits: defineTable({
    expenseId: v.id("expenses"),
    memberId: v.id("members"),
    amount: v.number(),
  })
    .index("by_expense", ["expenseId"])
    .index("by_member", ["memberId"]),

  messages: defineTable({
    tripId: v.id("trips"),
    senderId: v.id("members"),
    text: v.string(),
  })
    .index("by_trip", ["tripId"]),

  packingItems: defineTable({
    tripId: v.id("trips"),
    category: v.string(),
    name: v.string(),
    isChecked: v.boolean(),
    assignedTo: v.optional(v.id("members")),
  })
    .index("by_trip", ["tripId"]),

  photos: defineTable({
    tripId: v.id("trips"),
    url: v.string(),
    uploaderId: v.id("members"),
    description: v.optional(v.string()),
  })
    .index("by_trip", ["tripId"]),

  musicLinks: defineTable({
    tripId: v.id("trips"),
    url: v.string(),
    platform: v.union(v.literal("spotify"), v.literal("apple")),
    addedBy: v.id("members"),
  })
    .index("by_trip", ["tripId"]),
  markers: defineTable({
    tripId: v.id("trips"),
    name: v.string(),
    lat: v.number(),
    lng: v.number(),
    category: v.union(v.literal("hotel"), v.literal("food"), v.literal("sight"), v.literal("favorite"), v.literal("general")),
    addedBy: v.id("members"),
  })
    .index("by_trip", ["tripId"]),
});
