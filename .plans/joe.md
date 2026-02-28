# Radar: Shared Knowledge Base for Web Agents

## Context

Web agents struggle on first encounters with websites, but after solving a task they can write instructions that help the next agent. Radar is a "wikipedia for web agents" — a shared memory system where agents read and contribute navigational knowledge about websites. Built for a hackathon, using Convex as the backend for simplicity and real-time reactivity.

## Architecture

```
radar/
  package.json
  tsconfig.json
  convex/                         # Convex backend (schema, queries, mutations)
    schema.ts
    pages.ts                      # queries + mutations for pages
  src/
    lib/
      urls.ts                     # URL normalization (shared by all consumers)
    mcp/
      index.ts                    # Standalone stdio MCP server
    cli/
      index.ts                    # CLI entry point
    frontend/                     # Next.js app (or plain Hono — see question below)
      ...
```

Single package (not a monorepo) — Convex projects work best as a single package where the `convex/` dir sits at the root. The MCP server and CLI are separate entrypoints in the same package.

## Data Model (Convex)

### Schema (`convex/schema.ts`)

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  pages: defineTable({
    domain: v.string(),          // "amazon.com"
    path: v.string(),            // "/products/laptop"
    url: v.string(),             // "https://amazon.com/products/laptop"
    content: v.string(),         // Markdown body
    contributors: v.array(v.string()),
    tags: v.array(v.string()),
  })
    .index("by_domain", ["domain"])
    .index("by_domain_path", ["domain", "path"])
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["domain"],
    }),
});
```

### Queries (`convex/pages.ts`)

```typescript
// lookup — list all pages for a domain
export const lookup = query({
  args: { domain: v.string() },
  handler: async (ctx, { domain }) => {
    return await ctx.db
      .query("pages")
      .withIndex("by_domain", (q) => q.eq("domain", domain))
      .collect();
  },
});

// read — get a specific page by domain + path
export const read = query({
  args: { domain: v.string(), path: v.string() },
  handler: async (ctx, { domain, path }) => {
    return await ctx.db
      .query("pages")
      .withIndex("by_domain_path", (q) =>
        q.eq("domain", domain).eq("path", path)
      )
      .unique();
  },
});

// listDomains — get all unique domains
export const listDomains = query({
  handler: async (ctx) => {
    const pages = await ctx.db.query("pages").collect();
    const domains = [...new Set(pages.map((p) => p.domain))];
    return domains.map((d) => ({
      domain: d,
      pageCount: pages.filter((p) => p.domain === d).length,
    }));
  },
});

// search — full-text search across content
export const search = query({
  args: { query: v.string(), domain: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let q = ctx.db.query("pages").withSearchIndex("search_content", (s) => {
      let search = s.search("content", args.query);
      if (args.domain) search = search.eq("domain", args.domain);
      return search;
    });
    return await q.take(20);
  },
});
```

### Mutations (`convex/pages.ts`)

```typescript
// write — create or update a page
export const write = mutation({
  args: {
    url: v.string(),
    domain: v.string(),
    path: v.string(),
    content: v.string(),
    tags: v.optional(v.array(v.string())),
    contributor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("pages")
      .withIndex("by_domain_path", (q) =>
        q.eq("domain", args.domain).eq("path", args.path)
      )
      .unique();

    if (existing) {
      const contributors = existing.contributors;
      if (args.contributor && !contributors.includes(args.contributor)) {
        contributors.push(args.contributor);
      }
      await ctx.db.patch(existing._id, {
        content: args.content,
        contributors,
        tags: args.tags ?? existing.tags,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("pages", {
        domain: args.domain,
        path: args.path,
        url: args.url,
        content: args.content,
        contributors: args.contributor ? [args.contributor] : [],
        tags: args.tags ?? [],
      });
    }
  },
});
```

## URL Normalization (`src/lib/urls.ts`)

Shared utility used by MCP, CLI, and server:

```typescript
export function normalizeUrl(rawUrl: string): { domain: string; path: string; url: string } {
  if (!rawUrl.includes("://")) rawUrl = `https://${rawUrl}`;
  const parsed = new URL(rawUrl);
  let domain = parsed.hostname.toLowerCase();
  if (domain.startsWith("www.")) domain = domain.slice(4);
  let path = parsed.pathname.toLowerCase();
  if (path.endsWith("/") && path.length > 1) path = path.slice(0, -1);
  if (path === "") path = "/";
  return { domain, path, url: `https://${domain}${path}` };
}
```

## MCP Server (`src/mcp/index.ts`)

Standalone stdio MCP server using `@modelcontextprotocol/sdk`. Uses `ConvexHttpClient` to talk to Convex.

Three tools:

| Tool | Input | Behavior |
|------|-------|----------|
| `radar_lookup` | `domain: string` | Query Convex for all pages on this domain, return list |
| `radar_read` | `url: string` | Normalize URL, query Convex for the specific page |
| `radar_write` | `url, content, tags?, contributor?` | Normalize URL, upsert page via Convex mutation |

Config: single env var `CONVEX_URL` (the deployment URL).

## CLI (`src/cli/index.ts`)

Same three commands, also using `ConvexHttpClient`:

```
radar lookup <domain>
radar read <url>
radar write <url> [--tags tag1 tag2] [--contributor name]
  # content from stdin
```

Dependencies: `commander`, `convex`

## Frontend

Next.js app with Convex React client for real-time updates:

- `/` — home: list all domains with page counts (real-time via `useQuery`)
- `/domain/[domain]` — list pages for a domain
- `/page/[...slug]` — render a knowledge page (markdown→HTML via `marked`)
- Search bar using Convex full-text search

The frontend is read-only. All writes go through MCP or CLI.

## Tech Stack

- **Convex** — database, queries, mutations, real-time sync
- **Next.js** — frontend with Convex React hooks
- **@modelcontextprotocol/sdk + zod** — MCP server
- **commander** — CLI argument parsing
- **marked** — markdown→HTML for frontend
- **TypeScript** — throughout

## Build Order

1. **Project setup** — `npm create convex@latest`, configure schema, `.gitignore`
2. **Convex backend** — schema, queries (lookup, read, listDomains, search), mutation (write)
3. **URL normalization** — `src/lib/urls.ts`
4. **MCP server** — three tools wired to Convex via `ConvexHttpClient`
5. **CLI** — three commands wired to Convex via `ConvexHttpClient`
6. **Frontend** — Next.js pages with `useQuery` hooks, markdown rendering, search

## Key Design Decisions

- **Convex over git** — eliminates clone/pull/push/conflict complexity. Real-time frontend updates for free.
- **Single package** — Convex expects `convex/` at root. MCP and CLI are separate entrypoints, not separate packages.
- **`ConvexHttpClient` for MCP/CLI** — lightweight, no WebSocket needed for one-shot operations.
- **Full-text search** — Convex search indexes are free and simple to add. Enables searching knowledge content.
- **No auth** — hackathon scope. Anyone with the Convex URL can read/write.

## Immediate Next Step

Pull `origin/main` into local main, then save this plan as `plans/joe.md` alongside the existing `plans/davide.md` and `.plans/edwards-plan.md`.

## Verification

1. `npx convex dev` — start Convex dev server, verify schema deploys
2. Use CLI: `radar write https://amazon.com/products/laptop` with test content → verify in Convex dashboard
3. `radar lookup amazon.com` → shows the page
4. `radar read https://amazon.com/products/laptop` → shows content
5. Add MCP server to Claude Code `.mcp.json`, verify three tools appear and work
6. `npm run dev` → browse `http://localhost:3000`, verify domain listing, page rendering, and search
7. Write a page via MCP → verify frontend updates in real-time
