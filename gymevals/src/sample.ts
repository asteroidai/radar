import { parse } from "csv-parse/sync";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const CSV_PATH = resolve(ROOT, "gyms.csv");
const SAMPLES_DIR = resolve(ROOT, "samples");

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function main(): void {
  const countArg = process.argv[2];
  const count = countArg ? parseInt(countArg, 10) : 10;
  if (Number.isNaN(count) || count < 1) {
    console.error("Usage: tsx src/sample.ts [count]");
    console.error("Example: tsx src/sample.ts 10");
    process.exit(1);
  }

  const raw = readFileSync(CSV_PATH, "utf-8");
  const records: Record<string, string>[] = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
  });

  const allGyms = records
    .filter((row) => row["Venue ID"] && row["Website"])
    .map((row) => ({
      venueId: row["Venue ID"]!,
      venueName: row["Venue Name"]!,
      website: row["Website"]!,
    }));

  const sampled = shuffle(allGyms).slice(0, count);

  mkdirSync(SAMPLES_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:]/g, "-").replace(/\.\d+Z$/, "Z");
  const outPath = resolve(SAMPLES_DIR, `sample-${count}-${ts}.json`);
  writeFileSync(outPath, JSON.stringify(sampled, null, 2));

  console.log(`Sampled ${sampled.length} gyms → ${outPath}`);
  for (const g of sampled) {
    console.log(`  ${g.venueName} (${g.venueId})`);
  }
}

main();
