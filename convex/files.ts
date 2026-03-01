import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const countByDomain = query({
  args: { domain: v.string() },
  handler: async (ctx, args) => {
    const files = await ctx.db
      .query("files")
      .withIndex("by_domain_path", (q) => q.eq("domain", args.domain))
      .collect();
    return files.length;
  },
});

export const listBySite = query({
  args: { siteId: v.id("sites") },
  handler: async (ctx, args) => {
    const files = await ctx.db
      .query("files")
      .withIndex("by_site", (q) => q.eq("siteId", args.siteId))
      .collect();

    return files.map(({ content: _content, ...frontmatter }) => frontmatter);
  },
});

export const listByDomain = query({
  args: { domain: v.string() },
  handler: async (ctx, args) => {
    const files = await ctx.db
      .query("files")
      .withIndex("by_domain_path", (q) => q.eq("domain", args.domain))
      .collect();

    return files.map(({ content: _content, ...frontmatter }) => frontmatter);
  },
});

export const listByDomainWithContent = query({
  args: { domain: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("files")
      .withIndex("by_domain_path", (q) => q.eq("domain", args.domain))
      .collect();
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const files = await ctx.db.query("files").collect();
    return files.map(({ content: _content, ...frontmatter }) => frontmatter);
  },
});

export const getByDomainPath = query({
  args: { domain: v.string(), path: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("files")
      .withIndex("by_domain_path", (q) =>
        q.eq("domain", args.domain).eq("path", args.path),
      )
      .unique();
  },
});

export const search = query({
  args: {
    query: v.string(),
    domain: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let searchQuery = ctx.db
      .query("files")
      .withSearchIndex("search_content", (q) => {
        const base = q.search("content", args.query);
        if (args.domain) {
          return base.eq("domain", args.domain);
        }
        return base;
      });

    const files = await searchQuery.collect();

    return files.map(({ content: _content, ...frontmatter }) => frontmatter);
  },
});

const POINTS_NEW_SITE = 10;
const POINTS_NEW_FILE = 5;
const POINTS_UPDATE = 3;

export const submit = mutation({
  args: {
    domain: v.string(),
    path: v.string(),
    type: v.optional(
      v.union(
        v.literal("readme"),
        v.literal("sitemap"),
        v.literal("flow"),
        v.literal("script"),
        v.literal("selectors"),
        v.literal("api"),
        v.literal("guide"),
      ),
    ),
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
    scriptLanguage: v.optional(
      v.union(
        v.literal("playwright-ts"),
        v.literal("playwright-py"),
        v.literal("puppeteer"),
        v.literal("selenium-py"),
        v.literal("selenium-java"),
        v.literal("cypress"),
        v.literal("other"),
      ),
    ),
    selectorsCount: v.optional(v.number()),
    relatedFiles: v.array(v.string()),
    content: v.string(),
    contributorName: v.string(),
    changeReason: v.string(),
    agentType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { contributorName, changeReason, agentType, ...fileFields } = args;

    let site = await ctx.db
      .query("sites")
      .withIndex("by_domain", (q) => q.eq("domain", args.domain))
      .unique();

    let isNewSite = false;
    if (!site) {
      isNewSite = true;
      const siteId = await ctx.db.insert("sites", {
        domain: args.domain,
        name: args.domain,
        description: args.summary,
        tags: args.tags.slice(0, 3),
        fileCount: 0,
        lastUpdated: Date.now(),
      });
      site = (await ctx.db.get(siteId))!;
    }

    const existingFile = await ctx.db
      .query("files")
      .withIndex("by_domain_path", (q) =>
        q.eq("domain", args.domain).eq("path", args.path),
      )
      .unique();

    const now = Date.now();
    let fileId;
    let previousVersion: number | undefined;
    let newVersion: number;
    let points: number;

    if (existingFile) {
      previousVersion = existingFile.version;
      newVersion = existingFile.version + 1;
      points = POINTS_UPDATE;

      await ctx.db.patch(existingFile._id, {
        ...fileFields,
        siteId: site._id,
        version: newVersion,
        lastUpdated: now,
        lastContributor: contributorName,
        lastChangeReason: changeReason,
      });
      fileId = existingFile._id;
    } else {
      newVersion = 1;
      points = isNewSite ? POINTS_NEW_SITE + POINTS_NEW_FILE : POINTS_NEW_FILE;

      fileId = await ctx.db.insert("files", {
        ...fileFields,
        siteId: site._id,
        version: 1,
        lastUpdated: now,
        lastContributor: contributorName,
        lastChangeReason: changeReason,
      });

      await ctx.db.patch(site._id, {
        fileCount: site.fileCount + 1,
        lastUpdated: now,
      });
    }

    await ctx.db.insert("contributions", {
      fileId,
      domain: args.domain,
      filePath: args.path,
      contributorName,
      changeReason,
      contentSnapshot: args.content,
      previousVersion,
      newVersion,
      pointsAwarded: points,
      createdAt: now,
    });

    const contributor = await ctx.db
      .query("contributors")
      .withIndex("by_name", (q) => q.eq("name", contributorName))
      .unique();

    if (contributor) {
      await ctx.db.patch(contributor._id, {
        totalPoints: contributor.totalPoints + points,
        contributionCount: contributor.contributionCount + 1,
        agentType: agentType ?? contributor.agentType,
      });
    } else {
      await ctx.db.insert("contributors", {
        name: contributorName,
        agentType,
        totalPoints: points,
        contributionCount: 1,
      });
    }

    return { fileId, version: newVersion, pointsAwarded: points };
  },
});
