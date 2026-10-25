import { mkdirSync, writeFileSync, renameSync } from "node:fs";
const endpoint = new URL("https://data.cityofnewyork.us/resource/erm2-nwe9.json");
endpoint.searchParams.set("$select", "complaint_type,descriptor,count(*) AS records");
endpoint.searchParams.set(
  "$where",
  "created_date >= '2025-01-01T00:00:00' AND created_date < '2026-01-01T00:00:00' AND descriptor IS NOT NULL",
);
endpoint.searchParams.set("$group", "complaint_type,descriptor");
endpoint.searchParams.set("$order", "complaint_type,descriptor");
endpoint.searchParams.set("$limit", "10000");
const response = await fetch(endpoint, { signal: AbortSignal.timeout(120000) });
if (!response.ok) throw new Error(`Public dataset returned HTTP ${response.status}`);
const rows = await response.json();
if (!Array.isArray(rows) || !rows.length || rows.length >= 10000)
  throw new Error("Unexpected or truncated data response.");
if (
  rows.some(
    (row) =>
      !row ||
      typeof row.complaint_type !== "string" ||
      typeof row.descriptor !== "string" ||
      !/^\d+$/.test(String(row.records)) ||
      Number(row.records) < 1,
  )
)
  throw new Error("Unexpected source schema; the existing snapshot was retained.");
mkdirSync("data/sources", { recursive: true });
writeFileSync(
  "data/sources/nyc311-2025-descriptors.json.tmp",
  JSON.stringify(
    {
      source: "NYC Open Data / NYC311",
      dataset: "erm2-nwe9",
      sourceUrl: "https://data.cityofnewyork.us/d/erm2-nwe9",
      queryUrl: endpoint.href,
      retrievedAt: new Date().toISOString(),
      termsUrl: "https://data.cityofnewyork.us/stories/s/Terms-of-Use/k9k7-3cje",
      reusePolicyUrl: "https://www.nyc.gov/opendata/get-started/FAQs",
      fields: ["complaint_type", "descriptor", "records"],
      rows,
    },
    null,
    2,
  ) + "\n",
);
renameSync(
  "data/sources/nyc311-2025-descriptors.json.tmp",
  "data/sources/nyc311-2025-descriptors.json",
);
console.log(
  `Downloaded ${rows.length} aggregate descriptor pairs; no locations, names, or free-text reports.`,
);
console.log([...new Set(rows.map((r) => r.complaint_type))].join(" | "));
