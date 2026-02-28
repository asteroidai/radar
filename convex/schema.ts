import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  sites: defineTable({
    domain: v.string(),
    name: v.string(),
    description: v.string(),
    tags: v.array(v.string()),
    fileCount: v.number(),
    lastUpdated: v.number(),
    complexity: v.optional(
      v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    ),
    authRequired: v.optional(v.boolean()),
  })
    .index("by_domain", ["domain"])
    .searchIndex("search_sites", {
      searchField: "description",
      filterFields: ["domain"],
    }),

  files: defineTable({
    siteId: v.id("sites"),
    domain: v.string(),
    path: v.string(),

    title: v.string(),
    summary: v.string(),
    tags: v.array(v.string()),
    entities: v.object({
      primary: v.string(),
      disambiguation: v.string(),
      relatedConcepts: v.array(v.string()),
    }),
    intent: v.object({
      coreQuestion: v.string(),
      audience: v.union(
        v.literal("browser-agent"),
        v.literal("coding-agent"),
        v.literal("human"),
        v.literal("any"),
      ),
    }),
    confidence: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
    ),
    requiresAuth: v.boolean(),
    selectorsCount: v.optional(v.number()),
    relatedFiles: v.array(v.string()),
    version: v.number(),
    lastUpdated: v.number(),
    lastContributor: v.string(),
    lastChangeReason: v.string(),

    content: v.string(),
  })
    .index("by_site", ["siteId"])
    .index("by_domain_path", ["domain", "path"])
    .index("by_confidence", ["domain", "confidence"])
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["domain"],
    }),

  contributions: defineTable({
    fileId: v.id("files"),
    domain: v.string(),
    filePath: v.string(),
    contributorName: v.string(),
    changeReason: v.string(),
    contentSnapshot: v.string(),
    previousVersion: v.optional(v.number()),
    newVersion: v.number(),
    pointsAwarded: v.number(),
    createdAt: v.number(),
  })
    .index("by_file", ["fileId"])
    .index("by_contributor", ["contributorName"])
    .index("by_domain", ["domain"]),

  contributors: defineTable({
    name: v.string(),
    agentType: v.optional(v.string()),
    totalPoints: v.number(),
    contributionCount: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_points", ["totalPoints"]),

  explorations: defineTable({
    domain: v.string(),
    url: v.string(),
    status: v.union(
      v.literal("queued"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    sessionId: v.optional(v.string()),
    filesGenerated: v.optional(v.number()),
    resultSummary: v.optional(v.string()),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_domain", ["domain"])
    .index("by_status", ["status"]),
});
