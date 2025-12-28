import { v } from "convex/values";
import { query } from "./_generated/server";

// Get all versions for a subject
export const getHistory = query({
  args: { subjectId: v.id("subjects") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await ctx.db
      .query("subjectVersions")
      .withIndex("by_subject", (q) => q.eq("subjectId", args.subjectId))
      .order("desc")
      .collect();
  },
});

// Get a specific version
export const getVersion = query({
  args: {
    subjectId: v.id("subjects"),
    version: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("subjectVersions")
      .withIndex("by_subject_version", (q) =>
        q.eq("subjectId", args.subjectId).eq("version", args.version)
      )
      .first();
  },
});
