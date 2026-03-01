import { BrowserUse } from "browser-use-sdk/v3";
import { parse } from "csv-parse/sync";
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { gymOutputSchema, type GymOutput } from "./schema.js";
import { buildPrompt, type GymRow } from "./prompt.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const CSV_PATH = resolve(ROOT, "gyms.csv");

function makeRunDir(): string {
  const now = new Date();
  const ts = now.toISOString().replace(/[:]/g, "-").replace(/\.\d+Z$/, "Z");
  const dir = resolve(ROOT, "results", `run-${ts}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

const CONCURRENCY = 5;

// Hardcoded target venues — the 5 gyms with richest schedule data
const TARGET_VENUES: Record<string, string> = {
  "57191": "crossfit_jensen_beach",
  "44293": "brickhouse_gym",
  "203435": "gym_sports_loisirs_bellecour",
  "72715": "power_boxing_and_fitness",
  "57387": "precision_dance_company",
};

function parseCSV(): GymRow[] {
  const raw = readFileSync(CSV_PATH, "utf-8");
  const records: Record<string, string>[] = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
  });

  return records
    .filter((row) => row["Venue ID"]! in TARGET_VENUES)
    .map((row) => ({
      venueId: row["Venue ID"]!,
      venueName: row["Venue Name"]!,
      website: row["Website"]!,
    }));
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
}

async function runGym(client: BrowserUse, gym: GymRow, runDir: string): Promise<void> {
  const cleanGym: GymRow = {
    ...gym,
    venueName: decodeHtmlEntities(gym.venueName),
  };

  const slug = TARGET_VENUES[gym.venueId]!;
  const prompt = buildPrompt(cleanGym);
  console.log(`[START] ${cleanGym.venueName} (${slug})`);

  const startTime = Date.now();

  const run = client.run(prompt, {
    model: "bu-max",
  });

  try {
    const result = await run;

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const outputPath = resolve(runDir, `${slug}.json`);

    let parsed: GymOutput | null = null;
    const raw = result.output;
    if (raw != null) {
      try {
        if (typeof raw === "object") {
          // SDK already parsed it as an object
          parsed = gymOutputSchema.parse(raw);
        } else if (typeof raw === "string") {
          // Try to extract JSON — agent may include text before/after or wrap in markdown fences
          const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
          const braceMatch = raw.match(/\{[\s\S]*\}/);
          const jsonStr = fenceMatch ? fenceMatch[1]!.trim() : braceMatch ? braceMatch[0] : raw.trim();
          parsed = gymOutputSchema.parse(JSON.parse(jsonStr));
        }
      } catch {
        console.warn(`[WARN]  ${cleanGym.venueName} — failed to parse structured output, saving raw`);
      }
    }

    writeFileSync(
      outputPath,
      JSON.stringify(
        {
          venueId: gym.venueId,
          venueName: cleanGym.venueName,
          website: gym.website,
          sessionId: run.sessionId,
          status: result.status,
          totalInputTokens: result.totalInputTokens,
          totalOutputTokens: result.totalOutputTokens,
          totalCostUsd: result.totalCostUsd,
          createdAt: result.createdAt,
          updatedAt: result.updatedAt,
          output: parsed,
          rawOutput: parsed ? undefined : raw,
        },
        null,
        2,
      ),
    );

    const classCount = parsed?.classes.length ?? "?";
    const cost = result.totalCostUsd ?? "?";

    console.log(
      `[DONE]  ${cleanGym.venueName} — ${classCount} classes, $${cost}, ${elapsed}s → ${outputPath}`,
    );
  } catch (err) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[ERROR] ${cleanGym.venueName} (${elapsed}s): ${message}`);

    // Fetch session details for cost data even on error
    let sessionMeta: { totalInputTokens?: number; totalOutputTokens?: number; totalCostUsd?: string; createdAt?: string; updatedAt?: string } = {};
    try {
      const session = await client.sessions.get(run.sessionId);
      sessionMeta = {
        totalInputTokens: session.totalInputTokens,
        totalOutputTokens: session.totalOutputTokens,
        totalCostUsd: session.totalCostUsd,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      };
    } catch {
      // Session metadata unavailable
    }

    const outputPath = resolve(runDir, `${slug}.json`);
    writeFileSync(
      outputPath,
      JSON.stringify(
        {
          venueId: gym.venueId,
          venueName: cleanGym.venueName,
          website: gym.website,
          sessionId: run.sessionId,
          status: "error",
          error: message,
          ...sessionMeta,
        },
        null,
        2,
      ),
    );
  }
}

async function runPool(client: BrowserUse, gyms: GymRow[], runDir: string): Promise<void> {
  let index = 0;
  const total = gyms.length;

  async function next(): Promise<void> {
    while (index < total) {
      const gym = gyms[index++]!;
      await runGym(client, gym, runDir);
    }
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY, total) }, () => next());
  await Promise.all(workers);
}

function generateDashboard(runDir: string): void {
  const files = readdirSync(runDir).filter((f) => f.endsWith(".json"));
  const results = files.map((f) => JSON.parse(readFileSync(resolve(runDir, f), "utf-8")));

  // Derive run timestamp from directory name
  const dirName = runDir.split("/").pop() ?? "";
  // run-2026-02-28T23-49-13Z → 2026-02-28 23:49:13 UTC
  const tsMatch = dirName.match(/^run-(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})Z$/);
  const runTimestamp = tsMatch ? `${tsMatch[1]} ${tsMatch[2]}:${tsMatch[3]}:${tsMatch[4]} UTC` : dirName;

  // Compute totals
  const totalGyms = results.length;
  const totalClasses = results.reduce((s: number, r: Record<string, unknown>) => s + ((r["output"] as Record<string, unknown[]> | null)?.["classes"]?.length ?? 0), 0);
  const totalSchedules = results.reduce((s: number, r: Record<string, unknown>) => s + ((r["output"] as Record<string, unknown[]> | null)?.["schedules"]?.length ?? 0), 0);
  const totalCost = results.reduce((s: number, r: Record<string, unknown>) => s + (Number(r["totalCostUsd"]) || 0), 0);
  const totalDuration = results.reduce((s: number, r: Record<string, unknown>) => {
    const created = r["createdAt"] as string | undefined;
    const updated = r["updatedAt"] as string | undefined;
    if (created && updated) return s + (new Date(updated).getTime() - new Date(created).getTime()) / 1000;
    return s;
  }, 0);
  const maxCost = Math.max(...results.map((r: Record<string, unknown>) => Number(r["totalCostUsd"]) || 0), 0.001);
  const maxDuration = Math.max(...results.map((r: Record<string, unknown>) => {
    const c = r["createdAt"] as string | undefined;
    const u = r["updatedAt"] as string | undefined;
    return c && u ? (new Date(u).getTime() - new Date(c).getTime()) / 1000 : 0;
  }), 1);

  function esc(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function statusBadge(status: string, hasOutput: boolean): string {
    if (hasOutput) return `<span class="badge success">success</span>`;
    if (status === "error") return `<span class="badge error">error</span>`;
    return `<span class="badge warn">parse error</span>`;
  }

  function formatDuration(seconds: number): string {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}m ${s}s`;
  }

  function formatTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "UTC" });
  }

  function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
  }

  // Build gym cards
  let cardsHtml = "";
  let chartRowsHtml = "";

  for (const r of results) {
    const output = r["output"] as Record<string, unknown> | null;
    const classes = (output?.["classes"] as Record<string, string>[] | undefined) ?? [];
    const instructors = (output?.["instructors"] as Record<string, string>[] | undefined) ?? [];
    const schedules = (output?.["schedules"] as Record<string, unknown>[] | undefined) ?? [];
    const venueAddress = output?.["venue_address"] as string | null;
    const cost = Number(r["totalCostUsd"]) || 0;
    const inputTokens = (r["totalInputTokens"] as number) ?? 0;
    const outputTokens = (r["totalOutputTokens"] as number) ?? 0;
    const created = r["createdAt"] as string | undefined;
    const updated = r["updatedAt"] as string | undefined;
    const duration = created && updated ? (new Date(updated).getTime() - new Date(created).getTime()) / 1000 : 0;
    const sessionId = r["sessionId"] as string | undefined;
    const cardId = esc((r["venueId"] as string) ?? "");

    // Sort schedules chronologically
    const sortedSchedules = [...schedules].sort((a, b) =>
      String(a["start_date"]).localeCompare(String(b["start_date"])),
    );

    let scheduleRows = "";
    for (const s of sortedSchedules) {
      const sd = String(s["start_date"]);
      const instrName = [s["instructor_first_name"], s["instructor_last_name"]].filter((n) => n && n !== "N/A").join(" ") || "—";
      const recDays = (s["recurrence_days"] as string[] | null)?.join(", ") ?? "—";
      scheduleRows += `<tr>
        <td>${esc(formatDate(sd))}</td>
        <td>${esc(formatTime(sd))}</td>
        <td>${esc(String(s["class_name"]))}</td>
        <td>${s["duration_in_minutes"]}m</td>
        <td>${esc(instrName)}</td>
        <td>${esc(recDays)}</td>
      </tr>`;
    }

    const sessionLink = sessionId
      ? `<a href="https://cloud.browser-use.com/experimental/session/${esc(sessionId)}" target="_blank" class="session-link">Session replay</a>`
      : "";

    cardsHtml += `
    <div class="card">
      <div class="card-header" onclick="toggle('sched-${cardId}', this)">
        <div class="card-title-row">
          <h2>${esc(r["venueName"] as string)}</h2>
          ${statusBadge(r["status"] as string, output != null)}
        </div>
        <div class="card-meta">
          <a href="${esc(r["website"] as string)}" target="_blank">${esc(r["website"] as string)}</a>
          ${venueAddress ? `<span class="addr">${esc(venueAddress)}</span>` : ""}
          ${sessionLink}
        </div>
        <div class="card-stats">
          <span>${cost ? "$" + cost.toFixed(4) : "—"}</span>
          <span>${inputTokens ? inputTokens.toLocaleString() + " in" : "—"} / ${outputTokens ? outputTokens.toLocaleString() + " out" : "—"}</span>
          <span>${duration ? formatDuration(duration) : "—"}</span>
          <span>${classes.length} classes</span>
          <span>${instructors.length} instructors</span>
          <span>${schedules.length} schedules</span>
        </div>
        <span class="chevron">&#9654;</span>
      </div>
      <div class="card-body" id="sched-${cardId}" style="display:none">
        ${schedules.length > 0
          ? `<table>
              <thead><tr><th>Date</th><th>Time</th><th>Class</th><th>Duration</th><th>Instructor</th><th>Recurring</th></tr></thead>
              <tbody>${scheduleRows}</tbody>
            </table>`
          : `<p class="empty">No schedule data</p>`
        }
      </div>
    </div>`;

    const costPct = maxCost > 0 ? (cost / maxCost) * 100 : 0;
    const latPct = maxDuration > 0 ? (duration / maxDuration) * 100 : 0;
    chartRowsHtml += `
    <div class="chart-row">
      <span class="chart-label">${esc(r["venueName"] as string)}</span>
      <div class="chart-bars">
        <div class="bar-line">
          <div class="bar-track"><div class="bar-fill cost" style="width:${costPct.toFixed(1)}%"></div></div>
          <span class="bar-value">${cost ? "$" + cost.toFixed(4) : "—"}</span>
        </div>
        <div class="bar-line">
          <div class="bar-track"><div class="bar-fill latency" style="width:${latPct.toFixed(1)}%"></div></div>
          <span class="bar-value">${duration ? formatDuration(duration) : "—"}</span>
        </div>
      </div>
    </div>`;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Gym Eval Dashboard — ${esc(dirName)}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 20px; background: #111; color: #e5e5ea; }
  h1 { margin: 0 0 4px; font-size: 1.6em; color: #f5f5f7; }
  .subtitle { color: #8e8e93; font-size: 0.9em; margin-bottom: 16px; }
  .summary { display: flex; gap: 24px; flex-wrap: wrap; margin-bottom: 28px; padding: 16px 20px; background: #1c1c1e; border-radius: 12px; border: 1px solid #2c2c2e; }
  .summary .stat { text-align: center; }
  .summary .stat .val { font-size: 1.5em; font-weight: 700; color: #f5f5f7; }
  .summary .stat .label { font-size: 0.78em; color: #8e8e93; text-transform: uppercase; letter-spacing: 0.04em; }
  .card { background: #1c1c1e; border-radius: 12px; margin-bottom: 12px; border: 1px solid #2c2c2e; overflow: hidden; }
  .card-header { padding: 16px 20px; cursor: pointer; position: relative; }
  .card-header:hover { background: #232326; }
  .card-title-row { display: flex; align-items: center; gap: 10px; }
  .card-title-row h2 { margin: 0; font-size: 1.15em; color: #f5f5f7; }
  .badge { font-size: 0.72em; font-weight: 600; padding: 2px 8px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.03em; }
  .badge.success { background: #0d3318; color: #30d158; }
  .badge.error { background: #3a1215; color: #ff453a; }
  .badge.warn { background: #3a2e0a; color: #ffd60a; }
  .card-meta { margin-top: 6px; font-size: 0.85em; color: #8e8e93; display: flex; gap: 16px; flex-wrap: wrap; align-items: center; }
  .card-meta a { color: #64d2ff; text-decoration: none; }
  .card-meta a:hover { text-decoration: underline; }
  .session-link { font-weight: 500; }
  .addr { font-style: italic; }
  .card-stats { display: flex; gap: 16px; margin-top: 8px; font-size: 0.82em; color: #aeaeb2; flex-wrap: wrap; }
  .card-stats span { white-space: nowrap; }
  .chevron { position: absolute; right: 20px; top: 18px; font-size: 0.8em; color: #636366; transition: transform .2s; }
  .chevron.open { transform: rotate(90deg); }
  .card-body { padding: 0 20px 16px; }
  table { width: 100%; border-collapse: collapse; font-size: 0.85em; }
  th { text-align: left; border-bottom: 2px solid #3a3a3c; padding: 6px 8px; font-weight: 600; color: #8e8e93; font-size: 0.9em; text-transform: uppercase; letter-spacing: 0.03em; }
  td { padding: 5px 8px; border-bottom: 1px solid #2c2c2e; color: #d1d1d6; }
  tr:last-child td { border-bottom: none; }
  .empty { color: #636366; font-style: italic; }
  .section-title { font-size: 1.15em; font-weight: 700; margin: 28px 0 12px; color: #f5f5f7; }
  .chart-legend { display: flex; gap: 20px; margin-bottom: 14px; font-size: 0.82em; color: #aeaeb2; }
  .chart-legend span::before { content: ""; display: inline-block; width: 12px; height: 12px; border-radius: 3px; margin-right: 6px; vertical-align: -1px; }
  .chart-legend .leg-cost::before { background: #30d158; }
  .chart-legend .leg-latency::before { background: #0a84ff; }
  .chart-row { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
  .chart-label { width: 220px; font-size: 0.88em; text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex-shrink: 0; color: #d1d1d6; }
  .chart-bars { flex: 1; display: flex; flex-direction: column; gap: 3px; }
  .bar-line { display: flex; align-items: center; gap: 8px; }
  .bar-track { flex: 1; height: 14px; background: #2c2c2e; border-radius: 4px; overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 4px; min-width: 2px; }
  .bar-fill.cost { background: linear-gradient(90deg, #28a745, #30d158); }
  .bar-fill.latency { background: linear-gradient(90deg, #0a84ff, #5ac8fa); }
  .bar-value { width: 80px; font-size: 0.8em; color: #8e8e93; flex-shrink: 0; }
  @media (max-width: 640px) {
    .summary { gap: 12px; }
    .chart-label { width: 120px; font-size: 0.78em; }
    .card-stats { gap: 8px; }
  }
</style>
</head>
<body>
  <h1>Gym Eval Dashboard</h1>
  <div class="subtitle">${esc(runTimestamp)}</div>
  <div class="summary">
    <div class="stat"><div class="val">${totalGyms}</div><div class="label">Gyms</div></div>
    <div class="stat"><div class="val">${totalClasses}</div><div class="label">Classes</div></div>
    <div class="stat"><div class="val">${totalSchedules}</div><div class="label">Schedules</div></div>
    <div class="stat"><div class="val">${totalCost ? "$" + totalCost.toFixed(4) : "—"}</div><div class="label">Total Cost</div></div>
    <div class="stat"><div class="val">${totalDuration ? formatDuration(totalDuration) : "—"}</div><div class="label">Duration</div></div>
  </div>

  <div class="section-title">Cost &amp; Latency</div>
  <div class="chart-legend"><span class="leg-cost">Cost</span><span class="leg-latency">Latency</span></div>
  ${chartRowsHtml}

  <div class="section-title">Gym Details</div>
  ${cardsHtml}

<script>
function toggle(id, header) {
  var el = document.getElementById(id);
  var chevron = header.querySelector('.chevron');
  if (el.style.display === 'none') {
    el.style.display = 'block';
    chevron.classList.add('open');
  } else {
    el.style.display = 'none';
    chevron.classList.remove('open');
  }
}
</script>
</body>
</html>`;

  const outPath = resolve(runDir, "dashboard.html");
  writeFileSync(outPath, html, "utf-8");
  console.log(`Dashboard written to ${outPath}`);
}

async function main(): Promise<void> {
  if (!process.env["BROWSER_USE_API_KEY"]) {
    console.error("Missing BROWSER_USE_API_KEY environment variable");
    process.exit(1);
  }

  const runDir = makeRunDir();

  const gyms = parseCSV();
  console.log(`Loaded ${gyms.length} gyms from CSV`);
  console.log(`Concurrency: ${CONCURRENCY}`);
  console.log(`Results dir: ${runDir}\n`);

  const client = new BrowserUse();
  const startTime = Date.now();

  await runPool(client, gyms, runDir);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nAll done in ${elapsed}s`);

  generateDashboard(runDir);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
