// Agent instructions for using Radar
// "Before visiting an unfamiliar site, check Radar. After learning something new, contribute back."
export const RADAR_CONTEXT = `
You have access to Radar, a shared knowledge base for web agents.

Before visiting an unfamiliar website:
1. Call radar_get_context with the domain to check if knowledge exists
2. If available, read the relevant files to understand the site structure

After learning something new about a website:
1. Call radar_submit to contribute your findings back
2. Include structured information about navigation, forms, selectors, and gotchas
`;
