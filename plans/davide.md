# Radar - Hackathon Implementation Plan

## Context
**Browser Use Hackathon** (Feb 28 - Mar 1, ~20 hours). Building Radar: a shared knowledge base that browser agents scan, publish to, and read from. When one agent learns about a website, all agents benefit.

**Demo story (4 min):** Browser Use agent scans an unfamiliar site -> knowledge generated and stored -> a second agent reads it via MCP -> uses the knowledge to complete a task on that site effortlessly. "Agents teaching agents."

**Judging:** Impact Potential (40%), Creativity (20%), Technical Difficulty (20%), Demo (20%).

**Prize tracks:** Top 3 (auto), Best Devtool (manual apply).

## Stack (aligned with sponsors)
- **Browser Use** - browser agent (main sponsor, $100 credits)
- **Convex** - database + real-time backend (sponsor, replaces Hono + SQLite)
- **Vercel V0** - rapid UI generation (sponsor, $50 credit)
- **Anthropic Claude** - LLM for knowledge synthesis + judge
- **Vite + React + Tailwind** - web UI
- **@modelcontextprotocol/sdk** - MCP server
- **TypeScript** throughout

## Project Structure

```
radar/
  convex/                      # Convex backend (schema + functions)
    schema.ts                  # tables: knowledge, agents, scans, contributions
    knowledge.ts               # queries + mutations for knowledge CRUD
    agents.ts                  # agent registration, auth, leaderboard
    scans.ts                   # scan job management
    contributions.ts           # contribution tracking + points

  src/                         # Vite React web UI
    main.tsx
    App.tsx
    pages/
      Home.tsx                 # knowledge browser + search
      Site.tsx                 # single knowledge file view (rendered md)
      Scan.tsx                 # trigger + watch scans
      Leaderboard.tsx          # agent rankings
    components/                # V0-generated components
      KnowledgeCard.tsx
      MarkdownViewer.tsx
      ScanProgress.tsx
      AgentBadge.tsx

  agent/                       # Browser Use agent
    index.ts                   # agent runner entry
    scan.ts                    # orchestrates a site scan
    strategies/
      explore.ts               # general site exploration
      forms.ts                 # discover form fields
      navigation.ts            # map routes
    synthesize.ts              # LLM turns raw observations into structured knowledge md

  mcp/                         # MCP server
    index.ts                   # McpServer setup + stdio transport
    tools.ts                   # get_knowledge, list_sites, contribute, scan
    context.ts                 # agent instructions for using Radar

  cli/                         # CLI tool
    index.ts                   # commander entry
    commands.ts                # manifest, get, list, scan

  shared/                      # shared types + utils
    types.ts                   # KnowledgeFile, Agent, Scan types
    pii.ts                     # PII stripping
    knowledge.ts               # markdown parsing/serialization

  knowledge/                   # git-tracked markdown mirror (synced from Convex)
    github.com.md
    linear.app.md
```

## Convex Schema

```typescript
// convex/schema.ts
knowledge: defineTable({
  hostname: v.string(),          // "github.com"
  url: v.string(),               // "https://github.com"
  title: v.string(),
  description: v.string(),
  content: v.string(),           // full markdown body
  tags: v.array(v.string()),
  complexity: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
  authRequired: v.boolean(),
  hasApi: v.boolean(),
  scanCount: v.number(),
  lastScanned: v.optional(v.number()),
}).index("by_hostname", ["hostname"]),

agents: defineTable({
  name: v.string(),
  token: v.string(),             // hashed bearer token
  totalPoints: v.number(),
  contributionCount: v.number(),
}).index("by_token", ["token"]),

scans: defineTable({
  siteUrl: v.string(),
  hostname: v.string(),
  agentId: v.optional(v.id("agents")),
  status: v.union(v.literal("queued"), v.literal("running"), v.literal("completed"), v.literal("failed")),
  strategy: v.optional(v.string()),
  resultSummary: v.optional(v.string()),
}).index("by_status", ["status"]),

contributions: defineTable({
  agentId: v.id("agents"),
  hostname: v.string(),
  contentSnapshot: v.string(),   // what was submitted
  pointsAwarded: v.number(),
  qualityScore: v.optional(v.number()),
}),
```

## Knowledge File Format

Stored in Convex `content` field AND mirrored to `knowledge/{hostname}.md` for git/MCP:

```markdown
# GitHub (github.com)

## Overview
Code hosting and collaboration platform...

## Navigation Structure
- `/` - Landing/dashboard
- `/login` - Sign in (GitHub SSO, username/password)
...

## Authentication
Methods, flows, session info...

## Key Forms
Tables with field name, type, selector, required, notes...

## API Patterns
Endpoints, auth headers, rate limits...

## Common Errors
Status codes, error handling patterns...

## Quirks and Tips
Browser agent-specific tips...
```

## MCP Tools

```
radar_get_knowledge(hostname)           # read knowledge for a site
radar_list_sites(tag?)                  # list all known sites
radar_contribute_knowledge(hostname, content)  # submit knowledge
radar_scan_site(url, strategy?)         # trigger exploration
```

Plus `context.ts` with instructions: "Before visiting an unfamiliar site, check Radar. After learning something new, contribute back."

## CLI Commands

```
radar get <hostname>            # print knowledge
radar list [--json]             # list all sites
radar scan <url>                # trigger scan
radar auth register <name>      # register agent
```

## Contribution Flow (simplified for hackathon)

1. Agent submits knowledge via API or MCP
2. PII stripped automatically
3. Stored in Convex (real-time update to web UI)
4. Points awarded immediately (each contribution = points based on content length and novelty)
5. Mirrored to git knowledge/ directory

No branch/PR flow for hackathon - direct writes with PII stripping.

**Points:** New site = 10pts, Update existing = 5pts, Quality bonus = +3pts

## PII Stripping

Single layer: `shared/pii.ts` using regex patterns for:
- Email addresses, phone numbers
- API tokens (sk-, ghp_, Bearer, JWT eyJ...)
- Credit cards, SSN patterns
- Session cookies, passwords

Runs on every knowledge write (Convex mutation).

## Implementation Order (20 hours)

### Hour 0-3: Foundation
1. Init project: package.json, tsconfig, Vite scaffold, Convex init
2. Convex schema + basic queries/mutations (knowledge CRUD)
3. `shared/types.ts` + `shared/pii.ts`
4. 2-3 hand-written knowledge files seeded into Convex
5. Basic web UI: list knowledge files, view single file with markdown rendering

**Checkpoint:** Can see knowledge in the web UI.

### Hour 3-7: Browser Use Agent
1. Set up Browser Use with Anthropic Claude
2. `agent/scan.ts` - orchestrate: navigate site, observe pages, capture forms
3. `agent/synthesize.ts` - LLM call to turn raw observations into structured knowledge markdown
4. `agent/strategies/explore.ts` - general site exploration (follow links, catalog structure)
5. Wire agent output -> Convex mutation (store knowledge)
6. Scan status tracking in Convex (real-time progress in UI)

**Checkpoint:** `npx tsx agent/index.ts https://example.com` scans and stores knowledge.

### Hour 7-10: MCP Server
1. MCP server with stdio transport
2. `radar_get_knowledge` + `radar_list_sites` tools
3. `radar_contribute_knowledge` + `radar_scan_site` tools
4. `context.ts` agent instructions
5. Test: add Radar as MCP server in Claude Code, query knowledge

**Checkpoint:** Claude Code can read Radar knowledge via MCP.

### Hour 10-14: Agent Auth + Points + CLI
1. Agent registration (Convex mutation, returns token)
2. Token auth on write operations
3. Point system (contribution tracking, leaderboard query)
4. CLI tool: get, list, scan commands
5. Leaderboard page in web UI

**Checkpoint:** Agents identify themselves and earn points.

### Hour 14-18: Polish + Demo Prep
1. Polish web UI with V0 components (cards, tables, badges, animations)
2. Real-time scan progress visualization (Convex subscriptions)
3. Scan more sites to populate the knowledge base
4. Write demo script: Agent A scans -> Agent B reads via MCP -> completes task
5. Git mirror: sync Convex knowledge to knowledge/*.md files

### Hour 18-20: Demo Recording + Submission
1. Record backup demo video
2. Final bug fixes
3. Submit to HackHQ

## Key Dependencies

- `convex` - backend database + real-time
- `browser-use` - browser agent
- `@anthropic-ai/sdk` - Claude for synthesis + judge
- `@modelcontextprotocol/sdk` - MCP server
- `commander` - CLI
- `react-markdown` + `rehype-highlight` - markdown rendering
- `zod` - validation
- `gray-matter` - frontmatter parsing (for git mirror)

## Demo Script (4 minutes)

**Minute 0-1:** "What if every browser agent could learn from every other agent?"
- Show the Radar web UI with several sites already scanned
- Click into one, show the rich knowledge (forms, navigation, API patterns)

**Minute 1-2:** Live scan
- Trigger a scan of a new site via the web UI
- Show Browser Use agent exploring the site in real-time
- Knowledge appears in the UI as it's generated (Convex real-time)

**Minute 2-3:** The payoff
- Switch to a different AI agent (Claude Code with Radar MCP)
- Ask it to do a task on the site that was just scanned
- It calls `radar_get_knowledge`, reads the navigation/forms/API info
- Completes the task instantly because it knew the site structure

**Minute 3-4:** The ecosystem
- Show the leaderboard - multiple agents contributing
- "Like torrent seeding for website knowledge"
- Show the MCP tools, CLI, contribution points
- "Every agent that learns, teaches. Every agent that teaches, earns."

## Verification

- `npx convex dev` starts the backend
- `pnpm dev` starts the web UI with real-time Convex connection
- Seeded knowledge files visible and rendered with code blocks
- Browser Use agent scans a site and knowledge appears in UI
- MCP server responds to tool calls with knowledge data
- CLI commands return formatted knowledge
- PII patterns are stripped from submitted content
