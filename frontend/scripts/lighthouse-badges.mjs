// Turn Lighthouse CI results (.lighthouseci/lhr-*.json) into shields.io
// endpoint JSON files + a one-line summary of the median category scores.
//
// Usage: node scripts/lighthouse-badges.mjs <outDir>
// Writes: <outDir>/<category>.json (shields endpoint schema) and
//         <outDir>/summary.json ({ performance, accessibility, ... } as 0-100).

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const LHCI_DIR = ".lighthouseci";
const CATEGORIES = {
  performance: "Performance",
  accessibility: "Accessibility",
  "best-practices": "Best Practices",
  seo: "SEO",
};

const outDir = process.argv[2];
if (!outDir) {
  console.error("usage: node scripts/lighthouse-badges.mjs <outDir>");
  process.exit(1);
}

const lhrs = readdirSync(LHCI_DIR)
  .filter((f) => /^lhr-.*\.json$/.test(f))
  .map((f) => JSON.parse(readFileSync(join(LHCI_DIR, f), "utf8")));
if (lhrs.length === 0) {
  console.error(`no lhr-*.json found in ${LHCI_DIR}`);
  process.exit(1);
}

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

// Same thresholds Lighthouse uses for its score gauge.
const color = (score) =>
  score >= 90 ? "brightgreen" : score >= 50 ? "orange" : "red";

mkdirSync(outDir, { recursive: true });
const summary = {};
for (const [key, label] of Object.entries(CATEGORIES)) {
  const score = Math.round(
    median(lhrs.map((r) => r.categories[key].score * 100)),
  );
  summary[key] = score;
  writeFileSync(
    join(outDir, `${key}.json`),
    JSON.stringify({
      schemaVersion: 1,
      label: `Lighthouse ${label}`,
      message: String(score),
      color: color(score),
    }) + "\n",
  );
}
writeFileSync(join(outDir, "summary.json"), JSON.stringify(summary) + "\n");
console.log(`Median of ${lhrs.length} runs:`, summary);
