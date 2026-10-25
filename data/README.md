# Training data and provenance

The default model uses **real public NYC311 structured English issue descriptors**, not synthetic reports. Source: [NYC Open Data, 311 Service Requests (erm2-nwe9)](https://data.cityofnewyork.us/d/erm2-nwe9), requests created during calendar year 2025. The retrieval timestamp, exact aggregate query, source attribution, and selected fields are stored in `sources/nyc311-2025-descriptors.json`.

Only complaint type, descriptor, and aggregate request count were downloaded. No addresses, coordinates, phone numbers, names, request identifiers, or individual narratives are included. Counts describe the source aggregation; they are **not** used as sample weights. The training set contains unique descriptor phrases, not hundreds of thousands of independent reports.

Reuse follows the [NYC Open Data Terms of Use](https://data.cityofnewyork.us/stories/s/Terms-of-Use/k9k7-3cje) and [official reuse FAQ](https://www.nyc.gov/opendata/get-started/FAQs). The official FAQ permits unrestricted use of Open Data; the City disclaims warranties. We retain attribution, retrieval version, and a description of modifications. We do not assert that this municipal dataset has a CC0 license, or imply NYC endorsement.

`scripts/prepare-civic-data.mjs` explicitly maps municipal complaint types to six CivicBridge categories. It removes routing codes, collapses obvious residence/other template variants, deduplicates normalized descriptors, excludes five descriptors with conflicting mapped labels, and partitions by a fixed SHA-256 descriptor-group hash. The source labels never appear as an added prefix in the model input. Shared words and other template similarities can still occur across partitions.

`nyc311-civic.json` contains 391 training and 112 held-out descriptor examples. Supported categories: Waste Management, Water Conservation, Infrastructure, Environment, Public Safety, Transportation. School building maintenance maps to Infrastructure. We do not fabricate training labels for Education, Agriculture, Healthcare, or Other. Category mappings are authored for this project and need independent review.

`civic-demo.json` is a separate authored English/Hindi synthetic demonstration, released under CC0 by this project. It contains 80 training and 20 held-out examples across ten categories. It is never mixed into the public-data evaluation. Its perfect small-demo score does not establish field performance.

Reproduce from the checked-in source snapshot, without network access:

```powershell
npm.cmd run ai:prepare
npm.cmd run ai:train
npm.cmd run ai:train:demo
```

`npm.cmd run ai:fetch` intentionally refreshes the upstream snapshot and changes its retrieval timestamp/hash. Review the source, mapping, split counts, and results before replacing checked-in artifacts. Training accepts `--dataset path.json` and `--output path.json`; every label must have distinct train/test examples. Do not train on private application records without permission and de-identification.

See [the model card](../docs/AI_MODEL_CARD.md) for evaluation, limitations, and next steps.

The combined offline runner is `npm run etl`; add `-- --refresh` only when intentionally updating the source. `npm run etl:check` reconstructs training/evaluation, verifies source and dataset fingerprints, checks the actual weights and metrics, enforces baseline regression gates, and compares the deterministic bundled pipeline report. Every production build includes this read-only check. See the [full ETL explanation](../docs/PRODUCT_TECH_STACK_AND_ETL.md#5-what-etl-means-in-this-project) for stage boundaries, failure recovery, and promotion policy.
