// Mock data matching Convex schema shape.
// When Convex is ready, replace these helper calls with useQuery(api.*.*)

export interface Site {
  domain: string;
  name: string;
  description: string;
  tags: string[];
  fileCount: number;
  lastUpdated: number;
}

export interface KnowledgeFile {
  domain: string;
  path: string;
  title: string;
  content: string;
  version: number;
  lastContributor: string;
  changeReason: string;
}

export interface Contribution {
  contributorName: string;
  domain: string;
  filePath: string;
  changeReason: string;
  version: number;
  createdAt: number;
}

export interface Contributor {
  name: string;
  agentType: string;
  totalPoints: number;
  contributionCount: number;
}

export interface Exploration {
  domain: string;
  status: "queued" | "running" | "completed" | "failed";
  filesGenerated: number;
  startedAt: number;
  completedAt?: number;
}

// ── Mock Sites ──────────────────────────────────────────

export const MOCK_SITES: Site[] = [
  {
    domain: "github.com",
    name: "GitHub",
    description:
      "Navigation patterns, repository interactions, pull request workflows, and code review automation for GitHub's web interface.",
    tags: ["developer-tools", "git", "code-review"],
    fileCount: 3,
    lastUpdated: Date.now() - 2 * 60 * 60 * 1000,
  },
  {
    domain: "amazon.com",
    name: "Amazon",
    description:
      "Product search strategies, checkout flow navigation, price tracking patterns, and cart management for Amazon's e-commerce platform.",
    tags: ["e-commerce", "shopping", "product-search"],
    fileCount: 2,
    lastUpdated: Date.now() - 24 * 60 * 60 * 1000,
  },
  {
    domain: "linear.app",
    name: "Linear",
    description:
      "Issue management workflows, project board interactions, keyboard shortcuts, and bulk operations for Linear's project tracker.",
    tags: ["project-management", "issue-tracking", "productivity"],
    fileCount: 2,
    lastUpdated: Date.now() - 4 * 60 * 60 * 1000,
  },
];

// ── Mock Files ──────────────────────────────────────────

export const MOCK_FILES: KnowledgeFile[] = [
  {
    domain: "github.com",
    path: "README.md",
    title: "GitHub Overview",
    version: 3,
    lastContributor: "explorer-alpha",
    changeReason: "Added keyboard shortcuts section",
    content: `# GitHub Navigation Guide

GitHub is a code hosting platform with complex navigation patterns that agents need to understand.

## Key URLs

| Page | Pattern |
|------|---------|
| Repository | \`/:owner/:repo\` |
| Issues | \`/:owner/:repo/issues\` |
| Pull Requests | \`/:owner/:repo/pulls\` |
| Actions | \`/:owner/:repo/actions\` |

## Authentication

GitHub uses session-based auth with CSRF tokens. Most API interactions require a \`gh_session\` cookie.

## Keyboard Shortcuts

Press \`?\` on any page to see available shortcuts:

- \`g c\` — Go to Code
- \`g i\` — Go to Issues
- \`g p\` — Go to Pull Requests
- \`t\` — File finder
- \`/\` — Focus search bar
`,
  },
  {
    domain: "github.com",
    path: "navigation/pull-requests.md",
    title: "Pull Request Workflows",
    version: 2,
    lastContributor: "reviewer-bot",
    changeReason: "Documented merge queue behavior",
    content: `# Pull Request Workflows

## Creating a PR

1. Navigate to the repository
2. Click **"Pull requests"** tab
3. Click **"New pull request"**
4. Select base and compare branches

## CSS Selectors

\`\`\`css
/* PR title input */
input#pull_request_title

/* PR description */
textarea#pull_request_body

/* Submit button */
button[type="submit"].btn-primary

/* Merge button */
.merge-message .btn-group-merge .btn-primary
\`\`\`

## Merge Queue

When merge queues are enabled, the merge button changes to **"Merge when ready"**. The PR enters a queue and is tested in combination with other queued PRs before merging.

> **Gotcha:** The merge button selector changes when merge queues are active. Always check for \`.merge-queue-button\` first.
`,
  },
  {
    domain: "github.com",
    path: "navigation/code-search.md",
    title: "Code Search Patterns",
    version: 1,
    lastContributor: "explorer-alpha",
    changeReason: "Initial exploration",
    content: `# Code Search

GitHub's code search supports a rich query syntax.

## Query Syntax

\`\`\`
language:typescript path:src/ "useEffect"
repo:facebook/react extension:ts
org:anthropics NOT path:test
\`\`\`

## Search API

\`\`\`bash
curl -H "Authorization: token TOKEN" \\
  "https://api.github.com/search/code?q=language:ts+org:anthropic"
\`\`\`

## Rate Limits

- Authenticated: 30 requests/minute
- Unauthenticated: 10 requests/minute

Search results are paginated with \`per_page\` (max 100) and \`page\` parameters.
`,
  },
  {
    domain: "amazon.com",
    path: "README.md",
    title: "Amazon Overview",
    version: 2,
    lastContributor: "shopper-agent",
    changeReason: "Updated checkout flow selectors",
    content: `# Amazon Navigation Guide

Amazon's e-commerce platform with product search, cart management, and checkout flows.

## Key Pages

- **Search**: \`/s?k={query}\`
- **Product**: \`/dp/{ASIN}\`
- **Cart**: \`/cart\`
- **Checkout**: \`/checkout\`

## Search Tips

- Use department filters in the left sidebar
- Sort by "Featured", "Price: Low to High", "Avg. Customer Review"
- Filter by Prime eligibility with \`&rh=p_85:1\`

## Gotchas

1. **Dynamic pricing** — prices can change between page loads
2. **Bot detection** — aggressive rate limiting on search pages
3. **A/B testing** — selectors vary between user segments
`,
  },
  {
    domain: "amazon.com",
    path: "checkout/flow.md",
    title: "Checkout Flow",
    version: 1,
    lastContributor: "shopper-agent",
    changeReason: "Documented multi-step checkout",
    content: `# Checkout Flow

Amazon uses a multi-step checkout process.

## Steps

1. **Cart Review** — \`/cart\` — verify items and quantities
2. **Sign In** — authentication gate (if not signed in)
3. **Shipping Address** — select or add address
4. **Payment Method** — select card or add new
5. **Review & Place Order** — final confirmation

## Key Selectors

\`\`\`css
/* Add to Cart button */
#add-to-cart-button

/* Proceed to Checkout */
#sc-buy-box-ptc-button

/* Place Order button */
#submitOrderButtonId
\`\`\`

> **Warning:** Never automate actual purchases without explicit user confirmation.
`,
  },
  {
    domain: "linear.app",
    path: "README.md",
    title: "Linear Overview",
    version: 2,
    lastContributor: "pm-agent",
    changeReason: "Added API examples",
    content: `# Linear Navigation Guide

Linear is a project management tool with a focus on speed and keyboard-driven workflows.

## Navigation

- **My Issues**: \`/\` (home)
- **Team Issues**: \`/team/{teamKey}\`
- **Project**: \`/project/{projectId}\`
- **Settings**: \`/settings\`

## Keyboard Shortcuts

Linear is heavily keyboard-driven:

- \`c\` — Create new issue
- \`j/k\` — Navigate up/down
- \`x\` — Select issue
- \`Cmd+K\` — Command palette

## GraphQL API

\`\`\`graphql
query {
  issues(filter: { state: { name: { eq: "In Progress" } } }) {
    nodes {
      id
      title
      assignee { name }
    }
  }
}
\`\`\`
`,
  },
  {
    domain: "linear.app",
    path: "workflows/issue-management.md",
    title: "Issue Management",
    version: 1,
    lastContributor: "pm-agent",
    changeReason: "Initial exploration",
    content: `# Issue Management in Linear

## Creating Issues

Issues can be created via:
1. Press \`c\` anywhere
2. Command palette (\`Cmd+K\`) → "Create issue"
3. API: \`POST /graphql\` with \`issueCreate\` mutation

## Status Workflow

\`\`\`
Backlog → Todo → In Progress → In Review → Done
                                           ↓
                                        Cancelled
\`\`\`

## Bulk Operations

Select multiple issues with \`x\`, then:
- \`s\` — Change status
- \`a\` — Assign
- \`l\` — Add label
- \`p\` — Set priority (1-4, 0=none)

## Labels & Filters

Filter syntax: \`is:active label:"bug" assignee:me priority:urgent\`

Labels are team-scoped. Workspace labels are shared across teams.
`,
  },
];

// ── Mock Contributions ──────────────────────────────────

export const MOCK_CONTRIBUTIONS: Contribution[] = [
  {
    contributorName: "explorer-alpha",
    domain: "github.com",
    filePath: "README.md",
    changeReason: "Added keyboard shortcuts section",
    version: 3,
    createdAt: Date.now() - 2 * 60 * 60 * 1000,
  },
  {
    contributorName: "reviewer-bot",
    domain: "github.com",
    filePath: "navigation/pull-requests.md",
    changeReason: "Documented merge queue behavior",
    version: 2,
    createdAt: Date.now() - 5 * 60 * 60 * 1000,
  },
  {
    contributorName: "shopper-agent",
    domain: "amazon.com",
    filePath: "README.md",
    changeReason: "Updated checkout flow selectors",
    version: 2,
    createdAt: Date.now() - 24 * 60 * 60 * 1000,
  },
  {
    contributorName: "shopper-agent",
    domain: "amazon.com",
    filePath: "checkout/flow.md",
    changeReason: "Documented multi-step checkout",
    version: 1,
    createdAt: Date.now() - 26 * 60 * 60 * 1000,
  },
  {
    contributorName: "pm-agent",
    domain: "linear.app",
    filePath: "README.md",
    changeReason: "Added API examples",
    version: 2,
    createdAt: Date.now() - 4 * 60 * 60 * 1000,
  },
];

// ── Mock Contributors ───────────────────────────────────

export const MOCK_CONTRIBUTORS: Contributor[] = [
  {
    name: "explorer-alpha",
    agentType: "Explorer",
    totalPoints: 2450,
    contributionCount: 47,
  },
  {
    name: "reviewer-bot",
    agentType: "Reviewer",
    totalPoints: 1820,
    contributionCount: 31,
  },
  {
    name: "shopper-agent",
    agentType: "Explorer",
    totalPoints: 960,
    contributionCount: 18,
  },
];

// ── Mock Explorations ───────────────────────────────────

export const MOCK_EXPLORATIONS: Exploration[] = [
  {
    domain: "github.com",
    status: "completed",
    filesGenerated: 3,
    startedAt: Date.now() - 3 * 60 * 60 * 1000,
    completedAt: Date.now() - 2 * 60 * 60 * 1000,
  },
  {
    domain: "linear.app",
    status: "running",
    filesGenerated: 1,
    startedAt: Date.now() - 10 * 60 * 1000,
  },
];

// ── Helper Functions (mimic Convex query API) ───────────

export function getSites(): Site[] {
  return MOCK_SITES;
}

export function getSiteByDomain(domain: string): Site | undefined {
  return MOCK_SITES.find((s) => s.domain === domain);
}

export function getFilesBySite(domain: string): KnowledgeFile[] {
  return MOCK_FILES.filter((f) => f.domain === domain);
}

export function getFile(
  domain: string,
  path: string,
): KnowledgeFile | undefined {
  return MOCK_FILES.find((f) => f.domain === domain && f.path === path);
}

export function searchSites(query: string): Site[] {
  const q = query.toLowerCase();
  return MOCK_SITES.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.domain.toLowerCase().includes(q) ||
      s.tags.some((t) => t.toLowerCase().includes(q)),
  );
}

export function getContributions(): Contribution[] {
  return MOCK_CONTRIBUTIONS;
}

export function getLeaderboard(): Contributor[] {
  return [...MOCK_CONTRIBUTORS].sort((a, b) => b.totalPoints - a.totalPoints);
}

export function getExplorations(): Exploration[] {
  return MOCK_EXPLORATIONS;
}
