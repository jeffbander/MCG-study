import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create new subject
export const create = mutation({
  args: {
    siteCode: v.string(),
    subjectNumber: v.string(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Check if subject already exists
    const existing = await ctx.db
      .query("subjects")
      .withIndex("by_site_subject", (q) =>
        q.eq("siteCode", args.siteCode).eq("subjectNumber", args.subjectNumber)
      )
      .first();

    if (existing) {
      throw new Error(`Subject ${args.siteCode}-${args.subjectNumber} already exists`);
    }

    const now = Date.now();

    // Create the subject
    const subjectId = await ctx.db.insert("subjects", {
      siteCode: args.siteCode,
      subjectNumber: args.subjectNumber,
      data: args.data,
      createdBy: identity.subject,
      createdAt: now,
      updatedAt: now,
      currentVersion: 1,
      status: "draft",
    });

    // Create initial version
    await ctx.db.insert("subjectVersions", {
      subjectId,
      version: 1,
      data: args.data,
      createdBy: identity.subject,
      createdAt: now,
      changeNote: "Initial creation",
    });

    return subjectId;
  },
});

// Update subject (creates new version)
export const update = mutation({
  args: {
    id: v.id("subjects"),
    data: v.any(),
    changeNote: v.optional(v.string()),
    changedSections: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Subject not found");

    const now = Date.now();
    const newVersion = existing.currentVersion + 1;

    // Update main record
    await ctx.db.patch(args.id, {
      data: args.data,
      updatedAt: now,
      currentVersion: newVersion,
    });

    // Create version snapshot
    await ctx.db.insert("subjectVersions", {
      subjectId: args.id,
      version: newVersion,
      data: args.data,
      createdBy: identity.subject,
      createdAt: now,
      changeNote: args.changeNote,
      changedSections: args.changedSections,
    });

    return newVersion;
  },
});

// List all subjects
export const list = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await ctx.db
      .query("subjects")
      .order("desc")
      .collect();
  },
});

// Get single subject by ID
export const get = query({
  args: { id: v.id("subjects") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db.get(args.id);
  },
});

// Get subject by site code and subject number
export const getByIdentifier = query({
  args: {
    siteCode: v.string(),
    subjectNumber: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("subjects")
      .withIndex("by_site_subject", (q) =>
        q.eq("siteCode", args.siteCode).eq("subjectNumber", args.subjectNumber)
      )
      .first();
  },
});

// Rollback to previous version
export const rollback = mutation({
  args: {
    subjectId: v.id("subjects"),
    targetVersion: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Get the target version
    const targetVersionRecord = await ctx.db
      .query("subjectVersions")
      .withIndex("by_subject_version", (q) =>
        q.eq("subjectId", args.subjectId).eq("version", args.targetVersion)
      )
      .first();

    if (!targetVersionRecord) throw new Error("Version not found");

    const existing = await ctx.db.get(args.subjectId);
    if (!existing) throw new Error("Subject not found");

    const now = Date.now();
    const newVersion = existing.currentVersion + 1;

    // Update with rolled back data
    await ctx.db.patch(args.subjectId, {
      data: targetVersionRecord.data,
      updatedAt: now,
      currentVersion: newVersion,
    });

    // Record the rollback as a new version
    await ctx.db.insert("subjectVersions", {
      subjectId: args.subjectId,
      version: newVersion,
      data: targetVersionRecord.data,
      createdBy: identity.subject,
      createdAt: now,
      changeNote: `Rolled back to version ${args.targetVersion}`,
    });

    return newVersion;
  },
});

// Delete subject (soft delete by archiving)
export const archive = mutation({
  args: { id: v.id("subjects") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.db.patch(args.id, {
      status: "archived",
      updatedAt: Date.now(),
    });
  },
});

// Update subject status
export const updateStatus = mutation({
  args: {
    id: v.id("subjects"),
    status: v.union(v.literal("draft"), v.literal("complete"), v.literal("archived")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});
