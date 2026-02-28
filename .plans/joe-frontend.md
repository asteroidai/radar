# Radar Frontend — Implementation Plan

## Context

Building the frontend for the Radar hackathon. The monorepo is already scaffolded (pnpm workspace, turbo, all 5 packages stubbed). `packages/web/` has React 19, Vite, Tailwind v4, react-markdown, rehype-highlight, and @tanstack/react-router as deps — but no routes, components, or Convex backend yet.

## What already exists

- Root pnpm workspace + turbo pipeline
- `packages/web/` — Vite + React 19 + Tailwind v4 + react-markdown + rehype-highlight + @tanstack/react-router (all in package.json, not yet installed)
- `packages/web/src/main.tsx` — placeholder rendering "Radar" heading
- `packages/web/src/lib/urls.ts` — URL normalization utility (already written)
- `packages/web/vite.config.ts` — has react + tailwindcss plugins, `@` path alias
- `convex/.gitkeep` — empty, no schema or queries yet
- No `node_modules` — need `pnpm install`
- No Convex init — need `npx convex init`

## What needs to be done

### Step 1: Install deps + add missing packages
- `pnpm install` at root
- Add missing deps to `packages/web/`: `@tanstack/router-plugin`, `remark-gfm`, `lucide-react`, `date-fns`
- Add TanStack Router plugin to `vite.config.ts`
- Init Convex: `npx convex init` at root
- **Verify:** `cd packages/web && pnpm dev` starts

### Step 2: Convex schema + queries + seed data

**`convex/schema.ts`** — 5 tables from README (lines 144-226): `sites`, `files`, `contributions`, `contributors`, `explorations` with indexes and search indexes.

**Query files:**

| File | Exports | Used by |
|------|---------|---------|
| `convex/sites.ts` | `list`, `getByDomain`, `search` | Landing, Site detail, SearchBar |
| `convex/files.ts` | `listBySite`, `getByDomainPath`, `search` | Site detail, SearchBar |
| `convex/contributions.ts` | `list`, `listByFile` | Contributions feed, Site detail |
| `convex/contributors.ts` | `leaderboard` | Leaderboard |
| `convex/explorations.ts` | `list`, `get` | Explore page |

**`convex/seed.ts`** — mutation to populate test data: 3 sites (github.com, amazon.com, linear.app), 6 files, 3 contributors, 2 completed explorations.

- **Verify:** `npx convex dev` deploys schema, run seedData from Convex dashboard, data visible

### Step 3: Layout shell + router
- Update `packages/web/src/main.tsx` — wrap in ConvexProvider + RouterProvider
- Create `src/routes/__root.tsx` — sticky nav bar with blur: Radar logo + Home, Explore, Feed, Leaderboard links. Lucide icons. Max-w-6xl centered. `<Outlet />` for content.
- Create placeholder `src/routes/index.tsx`
- **Verify:** Nav renders, clicking links changes URL

### Step 4: Landing page (`/`)
- `src/components/SearchBar.tsx` — debounced input, calls `api.sites.search`, dropdown results, navigates to `/sites/:domain`
- `src/components/KnowledgeCard.tsx` — card with site name, domain, description (2-line truncate), tag badges, file count. Links to `/sites/:domain`
- Complete `src/routes/index.tsx` — hero (title + subtitle + SearchBar), 3-column grid of KnowledgeCards
- Query: `api.sites.list`
- **Verify:** 3 seeded sites appear as cards, search works

### Step 5: Site detail page (`/sites/:domain`) — the core page
- `src/components/FileTree.tsx` — groups files by directory prefix. Root files at top, then collapsible directory sections. Selected file highlighted bg-zinc-100. Props: `files[], selectedPath, onSelect`
- `src/components/MarkdownViewer.tsx` — renders `file.content` via react-markdown + rehype-highlight + remark-gfm. Shows title, version badge, last contributor, change reason above content. Props: `file: Doc<"files"> | null`
- `src/routes/sites.$domain.tsx` — site header (name, domain, description, tags), then two-column layout: FileTree 240px left | MarkdownViewer right. State: `selectedPath` defaults to "README.md"
- Queries: `api.sites.getByDomain`, `api.files.listBySite`, `api.files.getByDomainPath`
- **Verify:** Click GitHub card → file tree left, README.md rendered right. Click different file → content updates.

### Step 6: Remaining pages
- `src/components/ScanProgress.tsx` — status dot (gray=queued, amber+pulse=running, green=completed, red=failed) + domain + files generated + time
- `src/components/ContributorBadge.tsx` — deterministic colored circle (from name hash) + name text
- `src/routes/explore.tsx` — URL input + "Explore" button (mutation wired later), list of recent explorations via ScanProgress cards. Query: `api.explorations.list`
- `src/routes/contributions.tsx` — list of contribution cards: ContributorBadge, domain link, file path, change reason, version, relative time. Query: `api.contributions.list`
- `src/routes/leaderboard.tsx` — table with rank, ContributorBadge, agent type, contribution count, points. Trophy icon for #1. Query: `api.contributors.leaderboard`
- **Verify:** All 5 routes render with seed data

### Step 7: Polish
- highlight.js theme CSS (github or github-dark)
- Loading skeletons (animate-pulse) where `useQuery` returns undefined
- Empty states where data is null/empty
- Hover transitions on cards (border-zinc-300)

## Design Language

Minimal, Linear/Notion-inspired:
- **Colors:** White cards, zinc-50 page bg, zinc-200 borders. Emerald-600 accent. Amber for running status.
- **Typography:** Inter body, mono for numbers/versions/points. h1=2xl bold, section headers=sm uppercase tracking-wider zinc-400.
- **Spacing:** Generous. space-y-8 between sections, p-6 inside cards, gap-6 in grids.
- **Borders:** 1px zinc-200, rounded-lg everywhere. No shadows except search dropdown.
- **Animation:** Only animate-pulse skeletons + subtle pulse on running status dots.

## Key Technical Notes

- **Existing `urls.ts`:** `packages/web/src/lib/urls.ts` already has `normalizeUrl()` — reuse it
- **Convex imports:** `import { api } from "../../../convex/_generated/api"` — tsconfig needs to include `../../convex/_generated`
- **Conditional queries:** Pass `"skip"` as 2nd arg to `useQuery` when dependency not loaded
- **TanStack Router params:** `sites.$domain.tsx` → `/sites/:domain`, access via `Route.useParams()`
- **No shadcn/ui:** Keep it simpler — hand-write the few components we need with Tailwind directly. Less setup friction.

## Files to create/modify

**Modify:**
- `packages/web/package.json` — add missing deps
- `packages/web/vite.config.ts` — add TanStack Router plugin
- `packages/web/tsconfig.json` — ensure convex/_generated is included
- `packages/web/src/main.tsx` — ConvexProvider + RouterProvider
- `packages/web/src/index.css` — add font import if needed

**Create (Convex):**
- `convex/schema.ts`
- `convex/sites.ts`
- `convex/files.ts`
- `convex/contributions.ts`
- `convex/contributors.ts`
- `convex/explorations.ts`
- `convex/seed.ts`

**Create (Routes):**
- `packages/web/src/routes/__root.tsx`
- `packages/web/src/routes/index.tsx`
- `packages/web/src/routes/sites.$domain.tsx`
- `packages/web/src/routes/explore.tsx`
- `packages/web/src/routes/contributions.tsx`
- `packages/web/src/routes/leaderboard.tsx`

**Create (Components):**
- `packages/web/src/components/SearchBar.tsx`
- `packages/web/src/components/KnowledgeCard.tsx`
- `packages/web/src/components/FileTree.tsx`
- `packages/web/src/components/MarkdownViewer.tsx`
- `packages/web/src/components/ScanProgress.tsx`
- `packages/web/src/components/ContributorBadge.tsx`

## Verification

1. `npx convex dev` — schema deploys, seed data in dashboard
2. `cd packages/web && pnpm dev` — frontend starts at localhost:5173
3. Landing page shows 3 site cards with search
4. Click site → two-column layout with file tree + markdown viewer
5. All 5 routes render with real-time data
6. Change data in Convex dashboard → UI updates instantly
