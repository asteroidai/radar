# Radar - Claude Code Guidelines

## Git Safety

- **NEVER force push** (`git push --force`, `git push -f`) without triple-checking that no work will be lost. Verify with `git log` on both local and remote before any force push.
- When rebasing onto a force-updated remote, always check `git reflog` to ensure no commits are being silently dropped.
- Prefer `git pull --rebase` over force pushing to resolve divergence.

## Project Structure

- **Monorepo**: pnpm workspaces + Turborepo
- `packages/web/` — Frontend (Vite + React 19 + TanStack Router + Tailwind v4)
- `packages/mcp/` — MCP server (Cloudflare Workers)
- `packages/cli/` — CLI tool
- `packages/explorer/` — Explorer agent
- `convex/` — Convex backend (schema, queries, mutations)

## Convex

- Convex deployment: `tough-bird-920`
- Frontend env var: `VITE_CONVEX_URL` in `packages/web/.env.local`
- Run `npx convex dev` from repo root (requires interactive login)
- If compiled `.js`/`.d.ts` artifacts appear in `convex/`, delete them — they conflict with the `.ts` source files

## Deploy

- CI: `.github/workflows/deploy.yml` runs `pnpm --filter @radar/web run deploy` on push to main
- Requires `CLOUDFLARE_API_TOKEN` secret in GitHub repo settings
- pnpm version is read from `package.json` `packageManager` field — do not hardcode in CI
