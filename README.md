# CivicBridge

A full-stack societal innovation platform built from the supplied SIH 2026 brief. Citizens report local challenges, researchers propose solutions, institutions review academic teams, industries offer support, and administrators manage the journey to resolution.

Read the detailed [product, technology stack, and ETL guide](docs/PRODUCT_TECH_STACK_AND_ETL.md) for how each layer works, the complete data pipeline, model limitations, and production responsibilities. Repository: [Kanavt15/CivicBridge](https://github.com/Kanavt15/CivicBridge).

## Production operations phase

- `/system`: administrator-only database transaction checks, review counts, sanitized release settings, and bundled classifier lineage/metrics. Open it from the dashboard or operations room.
- `/operations`: search, urgency, review stage, overdue-only, and hide-demo filters, with CSV exports using the same filter policy and the latest queue.
- `npm run etl`: reproducible offline preparation, training, evaluation, quality gates, and pipeline report. `npm run etl -- --refresh` explicitly refreshes upstream data. `npm run etl:check` verifies fingerprints, deterministic weights, actual held-out metrics, and the bundled report; every production build runs it.
- Docker deployment recipe, secret-excluding build context, unprivileged runtime, readiness health check, and CI jobs for development/production HTTP verification and container builds. See [deployment instructions](docs/DEPLOYMENT.md).

## Run with MongoDB Atlas

The installable user app is at **`/app`**. It includes phone navigation, searchable problems/solutions, role-aware posting, photo capture, GPS pin selection, and home-screen installation. It uses the existing Atlas database. See [installation and posting](docs/USER_APP.md).

The redesigned website/app use a restrained white, grey, and blue interface with shorter pages and three-step posting forms. The header offers English, Hindi, Marathi, Bengali, Tamil, and Telugu; the preference persists while original posts and API values remain unchanged. See [the interface and localization guide](docs/DESIGN_SYSTEM.md).

Use the [Atlas setup guide](docs/ATLAS.md) to create/select a cluster, configure a database user and IP access, and obtain the driver URI. The app already supports Atlas through `DATABASE_URL`; no schema rewrite is needed.

```powershell
npm.cmd ci
# For a fresh checkout only; keep your existing .env if it contains working settings.
Copy-Item .env.example .env
# Replace the Atlas placeholders and AUTH_SECRET in .env.
npm.cmd run db:check
npm.cmd run db:push
npm.cmd run dev
```

The connection check never prints the URI and does not modify application records. Checked-in Render/Railway configurations and deployment steps are described in [the deployment guide](docs/DEPLOYMENT.md).

## Optional local MongoDB

Requires Node.js 24 (the tested version is in `.node-version`) and MongoDB 8.x configured as a replica set. Use the included local helper, MongoDB Atlas, or the Docker Compose service in `compose.yaml`. Transactions require a replica set, including for local development.

```powershell
npm.cmd ci
Copy-Item .env.local.example .env
# Edit DATABASE_URL and AUTH_SECRET in .env.
# Native MongoDB Community Server, detected automatically on Windows:
npm.cmd run local:db:start
# Alternatively: docker compose up -d --wait db
npm.cmd run db:push
npm.cmd run db:generate
# Set DEMO_PASSWORD in .env to opt into sample accounts.
npm.cmd run db:seed
npm.cmd run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). On Linux/macOS use `npm` instead of `npm.cmd`, and `cp .env.example .env`. For native MongoDB, put `mongod` on PATH or set `LOCAL_MONGOD_PATH` to the executable. Generate an authentication secret with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.

For the supplied Windows workspace, `.env` now points to the user's Atlas database. All 71 existing application records were transferred there and verified field by field; temporary transfer scripts were removed. The previous local MongoDB database is retained in ignored `.data/mongo` at `mongodb://127.0.0.1:27018/civicbridge?replicaSet=civicbridge-rs`. The local helper starts/stops only this project instance. It is unauthenticated and bound only to loopback. Hosted deployments must use authenticated, TLS-protected connections. The machine-wide MongoDB service is unchanged.

Prisma Migrate does not support the MongoDB connector used here. `db:push` applies the schema's collection indexes; `db:generate` generates the client. The one-time PostgreSQL-to-MongoDB transfer and schema/backfill scripts were executed, verified, and removed as requested, together with the obsolete SQL migration files. The original PostgreSQL data directory is retained as a rollback copy; the application no longer uses it.

## Demo accounts

The seed is repeatable and creates visibly labeled demonstration content. It does not imply a real relationship with the named illustrative institutions. All five accounts use the `DEMO_PASSWORD` supplied when seeding; the example/local default is **`CivicBridge@2026`**.

| Role                 | Email                             | Start here                                                   |
| -------------------- | --------------------------------- | ------------------------------------------------------------ |
| Citizen              | `citizen@demo.civicbridge.in`     | Report a challenge, track its status, comment                |
| Student / researcher | `researcher@demo.civicbridge.in`  | Discover a challenge, propose a solution, manage teams       |
| Institution          | `institution@demo.civicbridge.in` | Review its teams and proposals, monitor contributions        |
| Industry / NGO       | `industry@demo.civicbridge.in`    | Offer mentorship, resources, expertise, or funding interest  |
| Administrator        | `admin@demo.civicbridge.in`       | Review reports/proposals, verify organizations, manage users |

In development, role buttons fill example credentials. If you changed `DEMO_PASSWORD`, enter that password. Demo accounts, existing demo sessions, and demo buttons are **disabled by default in production**. Only an isolated demonstration deployment should explicitly set `ALLOW_DEMO_ACCOUNTS=true`. New public registrations support the four non-administrator roles. Institution/industry registrations create organizations awaiting admin verification.

## Demonstrate the core journey

1. Sign in as Citizen and report a problem. Add a location and optionally upload up to four photos. The report is initially private to its author and admins.
2. Sign in as Administrator. In **Administration → Problems**, open the report. Move it to **Under review**, then **Open**.
3. Sign in as Researcher. Find the report through search, city/category filters, list, grid, or map. Submit a proposed approach with feasibility, resources, impact, team, and optional documents.
4. Sign in as Administrator. Review the proposal through **Under review → Shortlisted → Approved**. Approval opens a private collaboration workspace and awards a unique verified contribution.
5. Sign in as Industry. Open the approved innovation and offer support. The workspace stays private while the request is pending.
6. Sign in as the researcher lead. Open **Collaborations**, accept the partner, add milestones/tasks, and share updates. The accepted partner can now join the workspace discussion.
7. The admin moves the report through **Collaboration → Pilot → Resolved** and the proposal through **Pilot → Completed**. Notifications, timelines, impact metrics, and recognition update from the database.

The seed also includes active projects and a researcher team for a shorter demo.

## Implemented

- Next.js App Router, React, TypeScript, Tailwind v4, shadcn-style Radix/CVA button, Lucide icons, light/dark themes, loading/error/empty states, Sonner toasts, responsive layouts.
- Auth.js credentials sessions, bcrypt password hashes, active-user checks, server role authorization, Zod validation, database-backed rate limiting, mutation origin checks.
- MongoDB/Prisma collections with indexed references, repeatable opt-in seed, transactional lifecycle updates, audit history, image/document binary data in the database.
- Public discovery with search/category/city/urgency/status filters, sorting, pagination, grid/list/maps, Leaflet location selection with coordinate fallback, OpenStreetMap attribution.
- Complete citizen reporting, moderation, research proposals, academic review, role-scoped dashboards, admin verification and user activation controls, Recharts analytics from database aggregates.
- Teams/invitations, explicit membership acceptance, private project workspaces, partner requests/review, milestones, self-assigned tasks, progress discussions, support commitments, in-app notifications.
- Editable AI assistance with labeled rule fallback, approximate text/location duplicate detection, skills/interests matching, explainable estimated impact scores, portfolios, recognition badges, unique verified rewards, leaderboard.

## Verification

New standout workflows include:

- `/intelligence`: a trained public NYC311 classifier, separate synthetic Hindi/English demo, source attribution, fingerprints, model/rule comparison, vocabulary cues, and abstention. Training-only five-fold selection improved held-out accuracy from 59.8% to 63.4% on 112 descriptors; this is not Indian field validation. See [the model card](docs/AI_MODEL_CARD.md).
- `/evidence`: teams record baseline/observed outcomes, sample size, dates, method, and supporting links in private workspaces. A different administrator reviews each measurement; only verified entries appear publicly, with an audit trail and contributor notification.
- `/operations`: administrator review priorities with visible score components, internal review targets, overdue and unserved reports, geographic hotspots, and formula-safe CSV export.
- Render/Railway manifests, release preflight, liveness/readiness probes, safe errors, bounded streamed requests, production demo-account controls, and GitHub Actions checks.

```powershell
npm.cmd run typecheck
npm.cmd test
# Use a disposable local database, never the Atlas app.
$env:DATABASE_URL='mongodb://127.0.0.1:27018/civicbridge_test?replicaSet=civicbridge-rs'
$env:AUTH_URL='http://127.0.0.1:3000'
$env:ALLOW_DEMO_ACCOUNTS='true'
$env:DEMO_PASSWORD='CivicBridge@Test2026'
npm.cmd run db:push
npm.cmd run db:seed
npm.cmd run test:e2e
# Stop the dev server before building on Windows.
npm.cmd run build
npm.cmd start
```

`test:e2e` uses Playwright HTTP request contexts; it requires no browser downloads. It covers the core journey, evidence privacy/review, operations access/export, AI provenance, and health, then removes its own records. It rejects Atlas and normal application database names. The default launcher starts a fresh test server and refuses to reuse port 3000. Close the ordinary dev server first. To use `TEST_BASE_URL`, launch the test server with `CIVICBRIDGE_TEST_MODE=true` and the same disposable database; the suite checks its database identity before writes. Open a fresh terminal or clear test environment overrides before returning to Atlas.

For a clean installation followed by a production build, use `npm.cmd run build:deploy` on Windows or `npm run build:deploy` on Render/Railway. This single command works in Windows PowerShell 5.1, installs build dependencies even in production environments, and stops if installation fails. Stop the dev server before running a clean install on Windows. Use `npm.cmd run build` when dependencies are already installed. The `&&` command separator only works in PowerShell 7+, cmd.exe, and compatible Unix shells.

Automated HTTP verification does not replace visual browser testing. Responsive styling, forms, map rendering, charts, dark mode, and keyboard behavior still warrant browser review before release. Optional remote LLM behavior needs testing with your selected provider; the default rule-based path is covered.

## Project guide

```text
src/app/             Pages, API routes, Auth.js route, notification Server Action
src/components/      Reusable UI, maps, charts, uploads, review controls
src/lib/             Database, validation, queries, authorization, domain policies
prisma/              MongoDB schema and demo seed
scripts/             Local MongoDB replica set, trusted admin provisioning, maintenance
tests/unit/          Domain and validation tests
tests/integration/   Authenticated HTTP/database workflow tests
docs/                Architecture, permissions, deployment, operational limits
```

See [architecture and permission rules](docs/ARCHITECTURE.md), [deployment instructions](docs/DEPLOYMENT.md), and the [verification record](docs/VALIDATION.md). This is an independent demonstrator; it does not process payments or send email. There are no built-in email verification/reset flows, malware scanning, real-time push updates, or external institution identity checks. The maintained [Auth.js credentials reference](https://authjs.dev/getting-started/authentication/credentials), [Next.js route-handler documentation](https://nextjs.org/docs/app/api-reference/file-conventions/route), and [Prisma MongoDB connector documentation](https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/mongodb) describe the underlying frameworks; this project pins Prisma 6.19.3.
