# Radar Frontend — Implementation Plan

## Context

Building the frontend first for the Radar hackathon project. The repo is empty (just README + plans). We need to scaffold the full project (pnpm workspace, Convex schema, queries) and then build a minimal, beautiful read-only frontend. The frontend is the demo surface — it needs to look great and show real-time data.

## Architecture

```
radar/
  package.json                    # Root workspace
  pnpm-workspace.yaml
  tsconfig.json
  convex/                         # Schema + queries (needed for frontend)
    schema.ts
    sites.ts
    files.ts
    contributions.ts
    contributors.ts
    explorations.ts
    seed.ts                       # Test data
  packages/
    web/                          # Vite + React frontend
      vite.config.ts
      tsconfig.json
      src/
        main.tsx                  # ConvexProvider + RouterProvider
        app.css                   # Tailwind + fonts
        lib/utils.ts              # cn() helper
        lib/urls.ts               # URL normalization
        routes/
          __root.tsx              # Nav layout shell
          index.tsx               # Landing page
          sites.$domain.tsx       # Site detail (core page)
          explore.tsx             # Exploration trigger
          contributions.tsx       # Real-time feed
          leaderboard.tsx         # Rankings
        components/
          SearchBar.tsx
          KnowledgeCard.tsx
          FileTree.tsx
          MarkdownViewer.tsx
          ScanProgress.tsx
          ContributorBadge.tsx
          ui/                     # shadcn components
```

## Design Language

Minimal, Linear/Notion-inspired:
- **Colors:** White cards, zinc-50 page bg, zinc-200 borders. Emerald-600 accent (links, points, active states). Amber for "running" status.
- **Typography:** Inter body, mono for numbers/versions/points. h1=2xl bold, section headers=sm uppercase tracking-wider zinc-400.
- **Spacing:** Generous. space-y-8 between sections, p-6 inside cards, gap-6 in grids.
- **Borders:** 1px zinc-200, rounded-lg everywhere. No shadows except search dropdown.
- **Animation:** Only animate-pulse skeletons and subtle pulse on running status dots. Real-time data updates are the visual excitement.

## Convex Schema

5 tables as defined in README.md (lines 144-226): `sites`, `files`, `contributions`, `contributors`, `explorations`. Each with appropriate indexes and search indexes.

## Convex Queries (minimal set for frontend)

| File | Queries | Used by |
|------|---------|---------|
| `sites.ts` | `list`, `getByDomain`, `search` | Landing, Site detail, SearchBar |
| `files.ts` | `listBySite`, `getByDomainPath`, `search` | Site detail, SearchBar |
| `contributions.ts` | `list`, `listByFile` | Contributions feed, Site detail |
| `contributors.ts` | `leaderboard` | Leaderboard |
| `explorations.ts` | `list`, `get` | Explore page |
| `seed.ts` | `seedData` mutation | Dev setup (3 sites, 6 files, 3 contributors) |

## Routes

### 1. `/` — Landing
- Hero: title + subtitle + SearchBar
- Grid of KnowledgeCards (3 columns) showing all known sites
- Query: `api.sites.list`

### 2. `/sites/:domain` — Site Detail (most important page)
- Site header: name, domain, description, tag badges
- Two-column layout: FileTree (240px left) | MarkdownViewer (right)
- FileTree groups files by directory, selected file highlighted
- MarkdownViewer renders content with syntax highlighting, shows version + contributor
- Queries: `api.sites.getByDomain`, `api.files.listBySite`, `api.files.getByDomainPath`

### 3. `/explore` — Trigger Exploration
- URL input + "Explore" button (wired to mutation later when explorer package exists)
- List of recent explorations with status badges (queued/running/completed/failed)
- Query: `api.explorations.list`

### 4. `/contributions` — Real-time Feed
- List of contribution cards: contributor badge, domain link, file path, change reason, version, time ago
- Query: `api.contributions.list`

### 5. `/leaderboard` — Rankings
- Table: rank, contributor badge, agent type, contribution count, points
- Trophy icon for #1
- Query: `api.contributors.leaderboard`

## Components

| Component | Props | Purpose |
|-----------|-------|---------|
| `SearchBar` | none (self-contained) | Debounced search input, dropdown results, navigates to site |
| `KnowledgeCard` | `site: Doc<"sites">` | Card linking to `/sites/:domain` with name, description, tags, file count |
| `FileTree` | `files[], selectedPath, onSelect` | Groups files by directory, collapsible sections, click to select |
| `MarkdownViewer` | `file: Doc<"files"> \| null` | Renders markdown via react-markdown + rehype-highlight + remark-gfm |
| `ScanProgress` | `exploration: Doc<"explorations">` | Status badge (colored dot + text), domain, files generated, time |
| `ContributorBadge` | `name: string` | Colored avatar circle (deterministic from name hash) + name text |

## Tech Stack

- `convex` — real-time backend, `useQuery` subscriptions
- `vite` + `@vitejs/plugin-react` — build tool
- `@tanstack/react-router` + `@tanstack/router-plugin` — file-based routing
- `tailwindcss` v4 + `@tailwindcss/vite` — styling
- shadcn/ui (button, card, input, badge, separator, scroll-area)
- `react-markdown` + `rehype-highlight` + `remark-gfm` — markdown rendering
- `lucide-react` — icons
- `date-fns` — relative timestamps
- `clsx` + `tailwind-merge` + `class-variance-authority` — utility classes

## Build Order

### Step 1: Project scaffolding
- Root `package.json`, `pnpm-workspace.yaml`, `tsconfig.json`, `.gitignore`
- `pnpm add convex` at root, `npx convex init`
- Scaffold `packages/web/` with Vite React TS template
- Install all deps, configure `vite.config.ts` (TanStack Router + Tailwind + path alias)
- `npx shadcn@latest init` + add components
- **Verify:** `pnpm dev` in packages/web starts without errors

### Step 2: Convex schema + queries + seed data
- `convex/schema.ts` — 5 tables with indexes
- `convex/sites.ts`, `files.ts`, `contributions.ts`, `contributors.ts`, `explorations.ts` — queries
- `convex/seed.ts` — seed mutation (3 sites: github.com, amazon.com, linear.app; 6 files; 3 contributors; 2 explorations)
- **Verify:** `npx convex dev` deploys, run seed from dashboard, data visible

### Step 3: Layout shell + router
- `src/main.tsx` — ConvexProvider + RouterProvider
- `src/routes/__root.tsx` — sticky nav bar (Radar logo, Home, Explore, Feed, Leaderboard links)
- Placeholder `src/routes/index.tsx`
- **Verify:** Nav renders, routing works

### Step 4: Landing page
- `SearchBar` and `KnowledgeCard` components
- Complete `index.tsx` with hero + site grid
- **Verify:** 3 seeded sites appear as cards, search works

### Step 5: Site detail page (core)
- `FileTree` and `MarkdownViewer` components
- `sites.$domain.tsx` with two-column layout
- **Verify:** Click GitHub card → see file tree left, README.md rendered right with syntax highlighting. Click different file → content updates.

### Step 6: Remaining pages
- `ScanProgress` and `ContributorBadge` components
- `explore.tsx`, `contributions.tsx`, `leaderboard.tsx`
- **Verify:** All 5 routes render with seed data

### Step 7: Polish
- highlight.js theme CSS for code blocks
- Loading skeletons (animate-pulse) where useQuery returns undefined
- Empty states where data is null
- Tune spacing and hover states

## Key Technical Notes

- **Convex imports from packages/web:** `import { api } from "../../../../convex/_generated/api"` — tsconfig includes `../../convex/_generated`
- **Conditional queries:** Use `"skip"` as 2nd arg to `useQuery` when dependency not loaded yet (e.g., `files.listBySite` waiting on `sites.getByDomain`)
- **TanStack Router params:** `sites.$domain.tsx` → route `/sites/:domain`, access via `Route.useParams()`
- **Convex env var:** `VITE_CONVEX_URL` in `packages/web/.env.local`, populated by `npx convex dev`

## Verification

1. `npx convex dev` — schema deploys, seed data in dashboard
2. `cd packages/web && pnpm dev` — frontend starts at localhost:5173
3. Landing page shows 3 site cards with search
4. Click site → two-column layout with file tree + markdown viewer
5. All 5 routes render with real-time data
6. Change data in Convex dashboard → UI updates instantly (no refresh)
