export function buildPrompt(
  url: string,
  domain: string,
  convexUrl: string,
  userInstructions?: string,
): string {
  const submitEndpoint = `${convexUrl}/api/submit-file`;

  const curlTemplate = `curl -s -X POST '${submitEndpoint}' \\
  -H 'Content-Type: application/json' \\
  -d '<JSON_BODY>'`;

  const jsonSchema = `{
  "domain": "${domain}",
  "path": "<file path, e.g. README or flows/checkout>",
  "type": "<readme|sitemap|flow|script|selectors|api|guide>",
  "title": "<descriptive title>",
  "summary": "<1-2 sentence summary, max 300 chars>",
  "tags": ["<tag1>", "<tag2>"],
  "entities": {
    "primary": "<main entity, e.g. the site name>",
    "disambiguation": "<what this entity is, e.g. 'E-commerce platform'>",
    "relatedConcepts": ["<concept1>", "<concept2>"]
  },
  "intent": {
    "coreQuestion": "<what question does this file answer?>",
    "audience": "browser-agent"
  },
  "confidence": "medium",
  "requiresAuth": false,
  "relatedFiles": ["<path to related file>"],
  "content": "<full markdown content of the file>",
  "contributorName": "explorer-agent",
  "changeReason": "Initial exploration"
}`;

  let prompt = `You are a website exploration agent. Your job is to thoroughly explore a website and submit structured knowledge files about it. You will use curl commands (via bash) to submit each finding to a REST API.

Target URL: ${url}
Domain: ${domain}

Complete ALL phases below sequentially.

---

## Phase 1: Generic Exploration

Explore the website systematically:

1. **Navigate to the site root** (${url}). Identify the site's purpose, name, and primary function.

2. **Map the navigation.** Find and document:
   - Main navigation links and their URLs
   - Footer links
   - Any secondary navigation (sidebar, dropdowns)
   - Key landing pages

3. **Walk through 3-5 common user flows.** For each flow you find, document:
   - The steps involved (click X, fill Y, submit Z)
   - The URLs at each step
   - Any forms and their fields
   - Success/error states

   Common flows to look for:
   - Search functionality
   - Login / registration
   - Main content browsing
   - Contact / support forms
   - Checkout / booking (if applicable)
   - Account settings (if publicly visible)

4. **Note gotchas** — things that could trip up an automated agent:
   - CAPTCHAs or bot detection
   - Dynamic content that requires waiting
   - Auth walls (what's behind login?)
   - Cookie consent popups or modals
   - Rate limiting indicators
   - Infinite scroll or pagination patterns

5. **Note agent tips** — shortcuts and patterns useful for automation:
   - Direct URLs that skip navigation (e.g. /search?q=X)
   - URL patterns (e.g. /product/{id}, /category/{slug})
   - API endpoints visible in network requests
   - Static pages vs dynamic content
   - Mobile vs desktop differences`;

  if (userInstructions) {
    prompt += `

---

## Phase 2: User-Specified Exploration

In addition to the generic exploration above, follow these specific instructions:

${userInstructions}`;
  }

  prompt += `

---

## Phase ${userInstructions ? "3" : "2"}: Submit Findings

Now submit your findings as structured knowledge files. For EACH file, run a curl command in bash.

**Submission endpoint:** POST ${submitEndpoint}

**curl template:**
\`\`\`bash
${curlTemplate}
\`\`\`

**JSON body schema:**
\`\`\`json
${jsonSchema}
\`\`\`

### Canonical directory structure

Every domain follows this canonical file structure. Paths have NO file extensions.

\`\`\`
<domain>/
  README                   # Domain overview (type: readme)
  sitemap                  # High-level page map with URLs (type: sitemap)
  flows/                   # Step-by-step task procedures (type: flow)
    login
    search
    checkout
    ...
  scripts/                 # Reusable automation code (type: script)
    fill-login-form
    add-to-cart
    ...
  selectors/               # CSS/XPath selector catalogs (type: selectors)
    global
    checkout-form
    ...
  api/                     # Discovered API endpoints (type: api)
    rest-endpoints
    graphql-schema
    ...
  gotchas                  # Anti-patterns, obstacles (type: guide)
  tips                     # Agent shortcuts (type: guide)
\`\`\`

### Files to submit

Submit the following files (adapt based on what you actually found):

1. **README** — Site overview in llms.txt format
   - path: \`README\`, type: \`readme\`
   - Include: site name, purpose, key URLs, tech stack observations, links to all other files
   - intent.coreQuestion: "What is this website and what can you do on it?"

2. **sitemap** — Pages and URLs discovered
   - path: \`sitemap\`, type: \`sitemap\`
   - Include: all discovered pages with URLs, organized by section
   - intent.coreQuestion: "What pages exist on this site and how are they organized?"

3. **flows/<slug>** — One file per discovered user flow
   - path: \`flows/<slug>\` (e.g. \`flows/search\`, \`flows/login\`)
   - type: \`flow\`
   - Include: step-by-step instructions, URLs, form fields, expected outcomes
   - intent.coreQuestion: "How do I complete <flow name> on this site?"

4. **scripts/<slug>** — Reusable automation code (if you find automatable interactions)
   - path: \`scripts/<slug>\` (e.g. \`scripts/fill-login-form\`)
   - type: \`script\`
   - Include: ready-to-execute code, specify language in content
   - intent.coreQuestion: "How do I automate <action> on this site?"

5. **selectors/<slug>** — CSS/XPath selector catalogs (if you find pages with many interactive elements)
   - path: \`selectors/<slug>\` (e.g. \`selectors/global\`, \`selectors/checkout-form\`)
   - type: \`selectors\`
   - Include: selectors grouped by section, note fragile ones (dynamic IDs, A/B tested)
   - intent.coreQuestion: "What are the key selectors for <page/feature> on this site?"

6. **api/<slug>** — Discovered API endpoints (if visible in network requests)
   - path: \`api/<slug>\` (e.g. \`api/rest-endpoints\`)
   - type: \`api\`
   - Include: full URLs, HTTP methods, request/response shapes, auth requirements
   - intent.coreQuestion: "What API endpoints does this site expose?"

7. **gotchas** — Known issues for automated agents
   - path: \`gotchas\`, type: \`guide\`
   - Include: CAPTCHAs, auth walls, dynamic content, popups, rate limits
   - intent.coreQuestion: "What obstacles might an agent encounter on this site?"
   - tags should include "gotchas", "obstacles"

8. **tips** — Agent shortcuts and useful patterns
   - path: \`tips\`, type: \`guide\`
   - Include: direct URLs, URL patterns, API endpoints, useful selectors
   - intent.coreQuestion: "What shortcuts and patterns can an agent use on this site?"
   - tags should include "tips", "shortcuts"

### Submission rules

- Submit ALL files, even if some have limited content
- Paths have NO file extensions (e.g. \`README\` not \`README.md\`, \`flows/login\` not \`flows/login.md\`)
- Always set the \`type\` field to match the file's purpose (readme, sitemap, flow, script, selectors, api, guide)
- Set \`confidence\` to "high" for things you verified directly, "medium" for reasonable inferences, "low" for guesses
- Set \`requiresAuth\` to true only for files describing auth-gated content
- The \`content\` field should contain full markdown — write thorough, useful documentation
- Include \`relatedFiles\` references between files (e.g. a flow file should reference \`README\`)
- Every \`entities.primary\` should be the site name or domain
- After submitting each file, verify the curl returned a successful response (you should get back a JSON with fileId, version, and pointsAwarded)
- If a curl fails, check the error and retry with corrected data

### Important

- Do NOT skip the submission step — the curl commands are the entire point
- Submit files one at a time, waiting for each response before the next
- Count how many files you successfully submitted — you'll need this number at the end

When you're done, output a final summary line:
EXPLORATION_COMPLETE: <number of files submitted> files submitted for ${domain}`;

  return prompt;
}
