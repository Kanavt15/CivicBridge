import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
const source = JSON.parse(readFileSync("data/sources/nyc311-2025-descriptors.json", "utf8"));
// Explicit project taxonomy. School building maintenance is infrastructure, not learning.
// No labels are invented for agriculture, healthcare, education, or miscellaneous reports.
const mapping = {
  "Waste Management": [
    "Dirty Condition",
    "Missed Collection",
    "Illegal Dumping",
    "Litter Basket Complaint",
    "Litter Basket Request",
    "Recycling Basket Complaint",
    "Residential Disposal Complaint",
    "Commercial Disposal Complaint",
    "Institution Disposal Complaint",
    "Dumpster Complaint",
    "Street Sweeping Complaint",
    "Transfer Station Complaint",
    "Industrial Waste",
  ],
  "Water Conservation": [
    "Water Conservation",
    "Water Quality",
    "Water System",
    "Water Maintenance",
    "Drinking Water",
    "Building Drinking Water Tank",
    "WATER LEAK",
  ],
  Infrastructure: [
    "Street Condition",
    "Street Light Condition",
    "Bridge Condition",
    "Curb Condition",
    "Sidewalk Condition",
    "Highway Condition",
    "Highway Sign - Damaged",
    "Highway Sign - Missing",
    "Highway Sign - Dangling",
    "Street Sign - Damaged",
    "Street Sign - Missing",
    "Street Sign - Dangling",
    "Sewer",
    "Sewer Maintenance",
    "School Maintenance",
    "Building Condition",
    "Plumbing",
    "PLUMBING",
    "ELECTRIC",
    "Electrical",
    "Elevator",
    "ELEVATOR",
    "DOOR/WINDOW",
    "FLOORING/STAIRS",
    "PAINT/PLASTER",
    "HEAT/HOT WATER",
    "APPLIANCE",
    "Public Toilet",
    "Bench",
    "Tunnel Condition",
  ],
  Environment: [
    "Air Quality",
    "Indoor Air Quality",
    "Noise",
    "Noise - Commercial",
    "Noise - Residential",
    "Noise - Helicopter",
    "Noise - House of Worship",
    "Noise - Park",
    "Noise - Street/Sidewalk",
    "Noise - Vehicle",
    "Oil or Gas Spill",
    "Damaged Tree",
    "Dead/Dying Tree",
    "Illegal Tree Damage",
    "Overgrown Tree/Branches",
    "New Tree Request",
    "Standing Water",
    "Asbestos",
    "ASBESTOS",
    "Construction Lead Dust",
    "Hazardous Materials",
    "Poison Ivy",
  ],
  "Public Safety": [
    "SAFETY",
    "Non-Emergency Police Matter",
    "Illegal Fireworks",
    "Drug Activity",
    "Construction Safety Enforcement",
    "Scaffold Safety",
    "BEST/Site Safety",
    "Disorderly Youth",
    "Animal-Abuse",
    "Window Guard",
  ],
  Transportation: [
    "Traffic",
    "Traffic Signal Condition",
    "Illegal Parking",
    "Blocked Driveway",
    "Abandoned Vehicle",
    "Derelict Vehicles",
    "Broken Parking Meter",
    "Bus Stop Shelter Complaint",
    "Bus Stop Shelter Placement",
    "Taxi Complaint",
    "Taxi Report",
    "FHV Licensee Complaint",
    "For Hire Vehicle Complaint",
    "For Hire Vehicle Report",
    "Green Taxi Complaint",
    "Green Taxi Report",
    "Ferry Complaint",
    "Bike Rack",
    "E-Scooter",
    "Municipal Parking Facility",
  ],
};
const labels = new Map(
  Object.entries(mapping).flatMap(([label, types]) => types.map((t) => [t, label])),
);
const normalize = (text) =>
  text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}]/gu, "");
function clean(text) {
  return text
    .replace(/\([A-Z]{1,6}\d{0,3}\)/g, "") // Remove agency routing codes.
    .replace(/\(Use Comments\)/gi, "")
    .replace(/\s*-\s*(Other|Private Residence)\s*$/i, "") // Collapse obvious template variants before splitting.
    .replace(/\s+/g, " ")
    .trim();
}
const unique = new Map();
let mappedPairs = 0;
for (const row of source.rows) {
  const label = labels.get(row.complaint_type);
  if (!label) continue;
  mappedPairs++;
  const text = clean(row.descriptor),
    key = normalize(text);
  if (text.length < 5 || (text.match(/[\p{L}\p{M}]+/gu) ?? []).length < 2) continue;
  const item = unique.get(key) ?? { text, labels: new Set() };
  item.labels.add(label);
  unique.set(key, item);
}
const conflicts = [...unique.values()].filter((r) => r.labels.size > 1).length;
const groups = Object.keys(mapping).map((category) => {
  const examples = [...unique.entries()]
    .filter(([, r]) => r.labels.size === 1 && r.labels.has(category))
    .sort(([a], [b]) => a.localeCompare(b, "en"));
  const train = [],
    test = [];
  for (const [key, r] of examples) {
    const bucket =
      parseInt(
        createHash("sha256").update(`civicbridge-nyc311-v1:${key}`).digest("hex").slice(0, 8),
        16,
      ) % 5;
    (bucket === 0 ? test : train).push(r.text);
  }
  if (train.length < 2 || test.length < 1)
    throw new Error(`Insufficient independent examples for ${category}`);
  return { category, train, test };
});
const data = {
  name: "NYC311 2025 municipal descriptor baseline",
  provenance: "public-municipal-data",
  description:
    "Real NYC311 structured English issue descriptors from calendar year 2025, mapped to six CivicBridge categories. One example per cleaned descriptor; these are not free-form citizen narratives or individual service requests.",
  license: "NYC Open Data reuse policy and Terms of Use (not a CC0 designation)",
  sourceUrl: source.sourceUrl,
  termsUrl: source.termsUrl,
  retrievedAt: source.retrievedAt,
  sourceHash: createHash("sha256")
    .update(readFileSync("data/sources/nyc311-2025-descriptors.json"))
    .digest("hex"),
  limitations:
    "English NYC municipal descriptors only. Taxonomy mappings are project-authored, not independently reviewed labels. Descriptor-disjoint held-out scores do not establish accuracy on Indian citizen narratives, Hindi, or unsupported categories. Repeated template wording may remain. Scores are uncalibrated; human review is required.",
  preparation: {
    inputPairs: source.rows.length,
    mappedPairs,
    ambiguousDescriptorsExcluded: conflicts,
    split:
      "Fixed SHA-256 descriptor-group hash, 20% expected test; exact normalized duplicates and routing codes removed before splitting; request counts are not weights.",
    mapping,
  },
  groups,
};
writeFileSync("data/nyc311-civic.json", JSON.stringify(data, null, 2) + "\n");
console.log(
  groups.map((g) => `${g.category}: ${g.train.length} train / ${g.test.length} test`).join("\n"),
);
console.log(`Excluded ${conflicts} ambiguous descriptors. Saved data/nyc311-civic.json.`);
