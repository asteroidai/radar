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
  "path": "<file path, e.g. README.md or flows/checkout.md>",
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

### Files to submit

Submit the following files (adapt based on what you actually found):

1. **README.md** — Site overview in llms.txt format
   - path: \`README.md\`
   - Include: site name, purpose, key URLs, tech stack observations
   - intent.coreQuestion: "What is this website and what can you do on it?"

2. **navigation/sitemap.md** — Pages and URLs discovered
   - path: \`navigation/sitemap.md\`
   - Include: all discovered pages with URLs, organized by section
   - intent.coreQuestion: "What pages exist on this site and how are they organized?"

3. **flows/<slug>.md** — One file per discovered user flow
   - path: \`flows/<slug>.md\` (e.g. \`flows/search.md\`, \`flows/login.md\`)
   - Include: step-by-step instructions, URLs, form fields, expected outcomes
   - intent.coreQuestion: "How do I complete <flow name> on this site?"

4. **gotchas.md** — Known issues for automated agents
   - path: \`gotchas.md\`
   - Include: CAPTCHAs, auth walls, dynamic content, popups, rate limits
   - intent.coreQuestion: "What obstacles might an agent encounter on this site?"
   - tags should include "gotchas", "obstacles"

5. **tips.md** — Agent shortcuts and useful patterns
   - path: \`tips.md\`
   - Include: direct URLs, URL patterns, API endpoints, useful selectors
   - intent.coreQuestion: "What shortcuts and patterns can an agent use on this site?"
   - tags should include "tips", "shortcuts"

### Submission rules

- Submit ALL files, even if some have limited content
- Set \`confidence\` to "high" for things you verified directly, "medium" for reasonable inferences, "low" for guesses
- Set \`requiresAuth\` to true only for files describing auth-gated content
- The \`content\` field should contain full markdown — write thorough, useful documentation
- Include \`relatedFiles\` references between files (e.g. a flow file should reference README.md)
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
