import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Main patient/subject records
  subjects: defineTable({
    // Identifiers
    siteCode: v.string(),
    subjectNumber: v.string(),

    // The complete subject data object (stored as JSON for flexibility)
    data: v.any(), // Full SubjectData object

    // Metadata
    createdBy: v.string(), // Clerk user ID
    createdAt: v.number(), // timestamp
    updatedAt: v.number(), // timestamp
    currentVersion: v.number(), // current version number

    // Status
    status: v.optional(v.union(v.literal("draft"), v.literal("complete"), v.literal("archived"))),
  })
    .index("by_site_subject", ["siteCode", "subjectNumber"])
    .index("by_created_by", ["createdBy"])
    .index("by_updated_at", ["updatedAt"]),

  // Version history table for rollback capability
  subjectVersions: defineTable({
    subjectId: v.id("subjects"), // Reference to parent subject
    version: v.number(), // Version number (1, 2, 3, etc.)
    data: v.any(), // Full SubjectData snapshot at this version

    // Metadata
    createdBy: v.string(), // Clerk user ID who made this version
    createdAt: v.number(), // timestamp
    changeNote: v.optional(v.string()), // Optional description of changes

    // What changed (optional, for UI display)
    changedSections: v.optional(v.array(v.string())),
  })
    .index("by_subject", ["subjectId"])
    .index("by_subject_version", ["subjectId", "version"]),
});
