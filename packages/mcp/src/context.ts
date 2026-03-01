export const RADAR_CONTEXT = `
You have access to Radar, a shared knowledge base for web agents.
When one agent learns about a website, all agents benefit.

## Before visiting an unfamiliar website

1. Call radar_get_context with the domain to check if knowledge exists
2. If available, read relevant files to understand the site structure:
   - README — site overview, capabilities, auth notes (read this first)
   - flows/* — step-by-step procedures for tasks (like Skills)
   - scripts/* — reusable automation code (Playwright, etc.)
   - selectors/* — CSS selector catalogs by page/feature
   - api/* — discovered API endpoints (often faster than UI automation)
   - gotchas — anti-bot measures, rate limits, known issues
   - tips — shortcuts, direct URLs, hidden features

## After learning something new about a website

Call radar_submit to contribute your findings. Every file must include YAML
frontmatter with a "type" field. Use the correct type for what you're contributing:

| type        | Use for                                                    | Path convention         |
|-------------|-------------------------------------------------------------|-------------------------|
| readme      | Domain overview (one per domain, created first)             | README                  |
| sitemap     | Page map with URLs and navigation hierarchy                 | sitemap                 |
| flow        | Step-by-step task procedure (login, checkout, search, etc.) | flows/<task-name>       |
| script      | Reusable automation code (set script_language too)          | scripts/<action-name>   |
| selectors   | CSS/XPath selector catalog (set selectors_count too)        | selectors/<page-name>   |
| api         | REST/GraphQL/WebSocket endpoint docs                        | api/<endpoint-group>    |
| guide       | General knowledge (gotchas, tips, tutorials, workarounds)   | gotchas, tips, or custom|

### Tips for good contributions

- Flows are the most valuable — document step-by-step with URLs and selectors
- Scripts should be self-contained and specify script_language (e.g. playwright-ts)
- Always note which selectors are fragile (dynamic IDs, A/B tested elements)
- Link related files using the related_files frontmatter field
- Paths have NO file extensions (e.g. \`README\` not \`README.md\`, \`flows/login\` not \`flows/login.md\`)

### Gotchas to document

When contributing gotchas (type: guide, path: gotchas), include these if observed:

- CAPTCHAs or bot detection mechanisms
- Dynamic content that requires waiting (JS-rendered, lazy-loaded)
- Auth walls (what's behind login vs publicly accessible)
- Cookie consent popups or modals that block interaction
- Rate limiting indicators and thresholds
- Infinite scroll or pagination patterns
- A/B tests that change selectors or page structure
- Dynamic IDs that change across sessions
- Session expiry and re-authentication requirements
`;
