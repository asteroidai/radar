import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GymResult {
  venueId: string;
  venueName: string;
  website: string;
  withRadar?: boolean;
  sessionId: string;
  status: string;
  error?: string;
  totalInputTokens?: number;
  totalOutputTokens?: number;
  totalCostUsd?: string;
  createdAt?: string;
  updatedAt?: string;
  output?: {
    venue_address: string | null;
    schedule_url: string | null;
    classes: { name: string; description: string }[];
    instructors: { first_name: string; last_name: string }[];
    schedules: {
      class_name: string;
      start_date: string;
      duration_in_minutes: number;
      instructor_first_name: string;
      instructor_last_name: string;
      is_recurring: boolean;
      recurrence_days: string[] | null;
    }[];
  };
  rawOutput?: unknown;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadRun(dirName: string): GymResult[] {
  const dir = resolve(ROOT, "results", dirName);
  const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
  return files.map((f) => JSON.parse(readFileSync(resolve(dir, f), "utf-8")));
}

function parseRunTimestamp(dirName: string): string {
  const m = dirName.match(/^run-(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})Z$/);
  return m ? `${m[1]} ${m[2]}:${m[3]}:${m[4]} UTC` : dirName;
}

function runLabel(dirName: string, results: GymResult[]): string {
  const ts = parseRunTimestamp(dirName);
  const radar = results.some((r) => r.withRadar);
  return `${ts}${radar ? " (with Radar)" : ""}`;
}

function duration(r: GymResult): number {
  if (r.createdAt && r.updatedAt)
    return (new Date(r.updatedAt).getTime() - new Date(r.createdAt).getTime()) / 1000;
  return 0;
}

function cost(r: GymResult): number {
  return Number(r.totalCostUsd) || 0;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function delta(a: number, b: number): string {
  const diff = b - a;
  if (diff === 0) return '<span style="color:#8e8e93">—</span>';
  const sign = diff > 0 ? "+" : "";
  const color = diff < 0 ? "#30d158" : "#ff453a"; // green = lower is better
  return `<span style="color:${color}">${sign}${diff.toFixed(2)}</span>`;
}

function deltaPct(a: number, b: number): string {
  if (a === 0) return "";
  const pct = ((b - a) / a) * 100;
  const sign = pct > 0 ? "+" : "";
  const color = pct < 0 ? "#30d158" : "#ff453a";
  return `<span style="color:${color};font-size:0.85em"> (${sign}${pct.toFixed(0)}%)</span>`;
}

function deltaInt(a: number, b: number, higherIsBetter = true): string {
  const diff = b - a;
  if (diff === 0) return '<span style="color:#8e8e93">—</span>';
  const sign = diff > 0 ? "+" : "";
  const good = higherIsBetter ? diff > 0 : diff < 0;
  const color = good ? "#30d158" : "#ff453a";
  return `<span style="color:${color}">${sign}${diff}</span>`;
}

function statusBadge(r: GymResult): string {
  if (r.output) return '<span class="badge success">success</span>';
  if (r.status === "error") return '<span class="badge error">error</span>';
  return '<span class="badge warn">parse error</span>';
}

function sessionLink(r: GymResult): string {
  return `<a href="https://cloud.browser-use.com/experimental/session/${esc(r.sessionId)}" target="_blank" class="session-link">replay</a>`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const args = process.argv.slice(2);
  if (args.length !== 2) {
    console.error("Usage: tsx src/compare.ts <run-dir-A> <run-dir-B>");
    console.error("Example: tsx src/compare.ts run-2026-02-28T23-49-13Z run-2026-03-01T03-16-06Z");
    console.error("\nAvailable runs:");
    const runs = readdirSync(resolve(ROOT, "results")).filter((d) => d.startsWith("run-"));
    for (const r of runs) console.error(`  ${r}`);
    process.exit(1);
  }

  const [dirA, dirB] = args as [string, string];
  const runsA = loadRun(dirA);
  const runsB = loadRun(dirB);

  // Index by venueId
  const mapA = new Map(runsA.map((r) => [r.venueId, r]));
  const mapB = new Map(runsB.map((r) => [r.venueId, r]));

  // Validate same gyms
  const idsA = new Set(mapA.keys());
  const idsB = new Set(mapB.keys());
  const missing = [...idsA].filter((id) => !idsB.has(id));
  const extra = [...idsB].filter((id) => !idsA.has(id));
  if (missing.length > 0 || extra.length > 0) {
    console.error("Runs must contain the same gyms.");
    if (missing.length) console.error(`  In A but not B: ${missing.map((id) => mapA.get(id)!.venueName).join(", ")}`);
    if (extra.length) console.error(`  In B but not A: ${extra.map((id) => mapB.get(id)!.venueName).join(", ")}`);
    process.exit(1);
  }

  const venueIds = [...idsA];
  const labelA = runLabel(dirA, runsA);
  const labelB = runLabel(dirB, runsB);

  // Totals
  const totalCostA = runsA.reduce((s, r) => s + cost(r), 0);
  const totalCostB = runsB.reduce((s, r) => s + cost(r), 0);
  const totalDurA = runsA.reduce((s, r) => s + duration(r), 0);
  const totalDurB = runsB.reduce((s, r) => s + duration(r), 0);
  const totalClassesA = runsA.reduce((s, r) => s + (r.output?.classes.length ?? 0), 0);
  const totalClassesB = runsB.reduce((s, r) => s + (r.output?.classes.length ?? 0), 0);
  const totalSchedulesA = runsA.reduce((s, r) => s + (r.output?.schedules.length ?? 0), 0);
  const totalSchedulesB = runsB.reduce((s, r) => s + (r.output?.schedules.length ?? 0), 0);
  const successA = runsA.filter((r) => r.output).length;
  const successB = runsB.filter((r) => r.output).length;

  // Per-gym comparison rows
  let comparisonRows = "";
  for (const id of venueIds) {
    const a = mapA.get(id)!;
    const b = mapB.get(id)!;
    const cA = cost(a), cB = cost(b);
    const dA = duration(a), dB = duration(b);
    const clsA = a.output?.classes.length ?? 0;
    const clsB = b.output?.classes.length ?? 0;
    const schA = a.output?.schedules.length ?? 0;
    const schB = b.output?.schedules.length ?? 0;

    comparisonRows += `<tr>
      <td class="gym-name">${esc(a.venueName)}</td>
      <td>${statusBadge(a)}</td>
      <td>${statusBadge(b)}</td>
      <td class="num">$${cA.toFixed(2)}</td>
      <td class="num">$${cB.toFixed(2)}</td>
      <td class="num">${delta(cA, cB)}${deltaPct(cA, cB)}</td>
      <td class="num">${formatDuration(dA)}</td>
      <td class="num">${formatDuration(dB)}</td>
      <td class="num">${delta(dA, dB)}${deltaPct(dA, dB)}</td>
      <td class="num">${clsA}</td>
      <td class="num">${clsB}</td>
      <td class="num">${deltaInt(clsA, clsB)}</td>
      <td class="num">${schA}</td>
      <td class="num">${schB}</td>
      <td class="num">${deltaInt(schA, schB)}</td>
    </tr>`;
  }

  // Per-gym detail cards (side-by-side schedules)
  let detailCards = "";
  for (const id of venueIds) {
    const a = mapA.get(id)!;
    const b = mapB.get(id)!;

    const classesA = new Set(a.output?.classes.map((c) => c.name) ?? []);
    const classesB = new Set(b.output?.classes.map((c) => c.name) ?? []);
    const allClasses = [...new Set([...classesA, ...classesB])].sort();

    let classRows = "";
    for (const cls of allClasses) {
      const inA = classesA.has(cls);
      const inB = classesB.has(cls);
      let badge = "";
      if (inA && inB) badge = '<span class="badge" style="background:#1c3a4f;color:#64d2ff">both</span>';
      else if (inA) badge = '<span class="badge" style="background:#3a2e0a;color:#ffd60a">A only</span>';
      else badge = '<span class="badge" style="background:#1a2f1a;color:#30d158">B only</span>';
      classRows += `<tr><td>${esc(cls)}</td><td>${badge}</td></tr>`;
    }

    detailCards += `
    <div class="card">
      <div class="card-header" onclick="toggle('detail-${esc(id)}', this)">
        <div class="card-title-row">
          <h2>${esc(a.venueName)}</h2>
        </div>
        <div class="card-meta">
          <a href="${esc(a.website)}" target="_blank">${esc(a.website)}</a>
          <span>A: ${sessionLink(a)}</span>
          <span>B: ${sessionLink(b)}</span>
        </div>
        <span class="chevron">&#9654;</span>
      </div>
      <div class="card-body" id="detail-${esc(id)}" style="display:none">
        <div class="detail-section">
          <h3>Address</h3>
          <div class="side-by-side">
            <div class="side"><strong>A:</strong> ${esc(a.output?.venue_address ?? "—")}</div>
            <div class="side"><strong>B:</strong> ${esc(b.output?.venue_address ?? "—")}</div>
          </div>
        </div>
        <div class="detail-section">
          <h3>Classes (${allClasses.length} unique)</h3>
          <table class="compact">
            <thead><tr><th>Class</th><th>Found in</th></tr></thead>
            <tbody>${classRows}</tbody>
          </table>
        </div>
      </div>
    </div>`;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Eval Comparison — A vs B</title>
<style>
  *, *::before, *::after { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 20px; background: #111; color: #e5e5ea; }
  h1 { margin: 0 0 4px; font-size: 1.6em; color: #f5f5f7; }
  .subtitle { color: #8e8e93; font-size: 0.9em; margin-bottom: 16px; }
  .run-labels { display: flex; gap: 32px; margin-bottom: 20px; font-size: 0.9em; }
  .run-labels .run-label { display: flex; align-items: center; gap: 8px; }
  .run-labels .dot { width: 12px; height: 12px; border-radius: 3px; }
  .dot-a { background: #ff9f0a; }
  .dot-b { background: #bf5af2; }

  .summary { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 28px; }
  .summary-card { background: #1c1c1e; border-radius: 12px; border: 1px solid #2c2c2e; padding: 16px 20px; flex: 1; min-width: 160px; }
  .summary-card .label { font-size: 0.78em; color: #8e8e93; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 8px; }
  .summary-card .vals { display: flex; gap: 16px; align-items: baseline; }
  .summary-card .val { font-size: 1.3em; font-weight: 700; color: #f5f5f7; }
  .summary-card .val-a { color: #ff9f0a; }
  .summary-card .val-b { color: #bf5af2; }
  .summary-card .vs { color: #636366; font-size: 0.85em; }
  .summary-card .diff { font-size: 0.85em; margin-top: 4px; }

  .section-title { font-size: 1.15em; font-weight: 700; margin: 28px 0 12px; color: #f5f5f7; }

  table.comparison { width: 100%; border-collapse: collapse; font-size: 0.82em; margin-bottom: 28px; }
  table.comparison th { text-align: left; border-bottom: 2px solid #3a3a3c; padding: 6px 8px; font-weight: 600; color: #8e8e93; font-size: 0.9em; text-transform: uppercase; letter-spacing: 0.03em; }
  table.comparison th.group-a { color: #ff9f0a; }
  table.comparison th.group-b { color: #bf5af2; }
  table.comparison th.group-d { color: #636366; }
  table.comparison td { padding: 6px 8px; border-bottom: 1px solid #2c2c2e; color: #d1d1d6; }
  table.comparison tr:last-child td { border-bottom: none; }
  table.comparison .gym-name { font-weight: 600; color: #f5f5f7; white-space: nowrap; }
  table.comparison .num { text-align: right; font-variant-numeric: tabular-nums; }

  .card { background: #1c1c1e; border-radius: 12px; margin-bottom: 12px; border: 1px solid #2c2c2e; overflow: hidden; }
  .card-header { padding: 16px 20px; cursor: pointer; position: relative; }
  .card-header:hover { background: #232326; }
  .card-title-row { display: flex; align-items: center; gap: 10px; }
  .card-title-row h2 { margin: 0; font-size: 1.15em; color: #f5f5f7; }
  .card-meta { margin-top: 6px; font-size: 0.85em; color: #8e8e93; display: flex; gap: 16px; flex-wrap: wrap; align-items: center; }
  .card-meta a { color: #64d2ff; text-decoration: none; }
  .card-meta a:hover { text-decoration: underline; }
  .session-link { font-weight: 500; }
  .chevron { position: absolute; right: 20px; top: 18px; font-size: 0.8em; color: #636366; transition: transform .2s; }
  .chevron.open { transform: rotate(90deg); }
  .card-body { padding: 0 20px 16px; }

  .badge { font-size: 0.72em; font-weight: 600; padding: 2px 8px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.03em; display: inline-block; }
  .badge.success { background: #0d3318; color: #30d158; }
  .badge.error { background: #3a1215; color: #ff453a; }
  .badge.warn { background: #3a2e0a; color: #ffd60a; }

  .detail-section { margin-top: 12px; }
  .detail-section h3 { font-size: 0.95em; color: #aeaeb2; margin: 0 0 6px; }
  .side-by-side { display: flex; gap: 24px; font-size: 0.88em; }
  .side-by-side .side { flex: 1; }

  table.compact { width: 100%; border-collapse: collapse; font-size: 0.85em; }
  table.compact th { text-align: left; border-bottom: 2px solid #3a3a3c; padding: 4px 8px; font-weight: 600; color: #8e8e93; font-size: 0.85em; text-transform: uppercase; }
  table.compact td { padding: 4px 8px; border-bottom: 1px solid #2c2c2e; color: #d1d1d6; }
  table.compact tr:last-child td { border-bottom: none; }


  @media (max-width: 768px) {
    .summary { flex-direction: column; }
    .chart-label { width: 120px; font-size: 0.78em; }
    table.comparison { font-size: 0.72em; }
  }
</style>
</head>
<body>
  <h1>Eval Comparison</h1>
  <div class="run-labels">
    <div class="run-label"><div class="dot dot-a"></div> <strong>A:</strong> ${esc(labelA)}</div>
    <div class="run-label"><div class="dot dot-b"></div> <strong>B:</strong> ${esc(labelB)}</div>
  </div>

  <div class="summary">
    <div class="summary-card">
      <div class="label">Total Cost</div>
      <div class="vals">
        <span class="val val-a">$${totalCostA.toFixed(2)}</span>
        <span class="vs">vs</span>
        <span class="val val-b">$${totalCostB.toFixed(2)}</span>
      </div>
      <div class="diff">${delta(totalCostA, totalCostB)}${deltaPct(totalCostA, totalCostB)}</div>
    </div>
    <div class="summary-card">
      <div class="label">Total Duration</div>
      <div class="vals">
        <span class="val val-a">${formatDuration(totalDurA)}</span>
        <span class="vs">vs</span>
        <span class="val val-b">${formatDuration(totalDurB)}</span>
      </div>
      <div class="diff">${delta(totalDurA, totalDurB)}${deltaPct(totalDurA, totalDurB)}</div>
    </div>
    <div class="summary-card">
      <div class="label">Classes Found</div>
      <div class="vals">
        <span class="val val-a">${totalClassesA}</span>
        <span class="vs">vs</span>
        <span class="val val-b">${totalClassesB}</span>
      </div>
      <div class="diff">${deltaInt(totalClassesA, totalClassesB)}</div>
    </div>
    <div class="summary-card">
      <div class="label">Schedules Found</div>
      <div class="vals">
        <span class="val val-a">${totalSchedulesA}</span>
        <span class="vs">vs</span>
        <span class="val val-b">${totalSchedulesB}</span>
      </div>
      <div class="diff">${deltaInt(totalSchedulesA, totalSchedulesB)}</div>
    </div>
    <div class="summary-card">
      <div class="label">Success Rate</div>
      <div class="vals">
        <span class="val val-a">${successA}/${runsA.length}</span>
        <span class="vs">vs</span>
        <span class="val val-b">${successB}/${runsB.length}</span>
      </div>
    </div>
  </div>

  <div class="section-title">Per-Gym Comparison</div>
  <table class="comparison">
    <thead>
      <tr>
        <th>Gym</th>
        <th class="group-a">A</th>
        <th class="group-b">B</th>
        <th class="group-a num">Cost A</th>
        <th class="group-b num">Cost B</th>
        <th class="group-d num">&Delta;</th>
        <th class="group-a num">Time A</th>
        <th class="group-b num">Time B</th>
        <th class="group-d num">&Delta;</th>
        <th class="group-a num">Cls A</th>
        <th class="group-b num">Cls B</th>
        <th class="group-d num">&Delta;</th>
        <th class="group-a num">Sch A</th>
        <th class="group-b num">Sch B</th>
        <th class="group-d num">&Delta;</th>
      </tr>
    </thead>
    <tbody>
      ${comparisonRows}
    </tbody>
  </table>

  <div class="section-title">Gym Details</div>
  ${detailCards}

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

  const outPath = resolve(ROOT, "results", `compare-${dirA}--vs--${dirB}.html`);
  writeFileSync(outPath, html, "utf-8");
  console.log(`Comparison dashboard written to ${outPath}`);
}

main();
