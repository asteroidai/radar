# Gym Evals

Eval suite for the Radar hackathon. Uses [Browser Use](https://browser-use.com) agents to scrape gym class schedules from real websites, demonstrating that AI agents can extract structured data from diverse, complex web pages (iframes, images, dynamic widgets, multilingual sites).

## What it does

Sends a browser agent to each of 5 gym websites with a single prompt that instructs it to:

1. Find the venue's street address on the site
2. Scrape the class schedule for the next 7-14 days
3. Filter out excluded class types (kids, private, virtual, etc.)
4. Return structured JSON (classes, instructors, schedules)

The 5 target gyms were selected for variety of challenge:

| Gym | Challenge |
|---|---|
| Crossfit Jensen Beach | Wodify iframe widget, multi-week navigation |
| Brickhouse Gym | Static Squarespace page, address in JSON config |
| Gym Sports Loisirs Bellecour | French site, schedule is a PNG image |
| Power Boxing and Fitness | Schedule in footer, classes page 404s |
| Precision Dance Company | Table Master iframe, address on separate page |

## Setup

```sh
# From repo root
pnpm install

# Add your Browser Use API key
echo "BROWSER_USE_API_KEY=bu_..." > gymevals/.env
```

## Running

```sh
cd gymevals
pnpm start
```

Runs all 5 gyms concurrently via the Browser Use BU Agent API (v3) with the `bu-max` model. Each run creates a timestamped directory under `results/`:

```
results/
  run-2026-02-28T23-03-00Z/
    brickhouse_gym.json
    crossfit_jensen_beach.json
    gym_sports_loisirs_bellecour.json
    power_boxing_and_fitness.json
    precision_dance_company.json
```

## Analyzing results

Each result JSON contains:

```json
{
  "venueId": "44293",
  "venueName": "Brickhouse Gym",
  "website": "https://...",
  "sessionId": "1a26c6d8-...",
  "status": "stopped",
  "totalInputTokens": 234567,
  "totalOutputTokens": 12345,
  "totalCostUsd": "0.74",
  "createdAt": "2026-02-28T23:03:12Z",
  "updatedAt": "2026-02-28T23:06:45Z",
  "output": {
    "venue_address": "...",
    "schedule_url": "...",
    "classes": [...],
    "instructors": [...],
    "schedules": [...]
  }
}
```

- **`sessionId`** maps to the Browser Use dashboard for full replay: `https://cloud.browser-use.com/sessions/{sessionId}`
- **`totalInputTokens`/`totalOutputTokens`** — LLM token usage for the session
- **`totalCostUsd`** — total cost (LLM + proxy) in USD
- **`createdAt`/`updatedAt`** — session start and end timestamps (use to calculate duration)
- **`output`** is Zod-validated structured data (or `null` with `rawOutput` if parsing failed)

## Cost

Expect ~$0.75/gym ($3.75 total per run) with `bu-max`. Most cost is input tokens from screenshots fed back at each agent step. Complex sites with iframes/multi-page navigation cost more (~$1.40), simple sites cost less (~$0.35).

## Project structure

```
gymevals/
  src/
    run.ts       # Main entry: CSV parsing, concurrency pool, result saving
    prompt.ts    # buildPrompt() — single combined prompt for all 4 phases
    schema.ts    # Zod schema for structured output validation
  gyms.csv       # Source data (25 gyms, 5 used)
  results/       # Timestamped run directories
```
