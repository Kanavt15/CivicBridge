# Deployment

Deploy CivicBridge as a Node.js application with a reachable MongoDB replica set, such as MongoDB Atlas. Do not use static hosting: Auth.js, APIs, live queries, and Server Actions need a server runtime. A standalone MongoDB server cannot run the required multi-document transactions.

Start with the [Atlas setup and connection guide](ATLAS.md) for cluster creation, database-user permissions, IP access, local verification, and Vercel/Node-host configuration. Run `npm run db:check` before index synchronization or deployment. The real Atlas URI is required to complete the connection; the repository's environment template is not a live cluster.

## Node.js host, Render, Railway, or similar

The workspace's Atlas connection, schema synchronization, and 71-record transfer are verified. No cloud application has been published. Commit the source to your Git repository, then connect it to your hosting account.

- **Render:** deploy a Blueprint from `render.yaml`. Supply `DATABASE_URL` and the exact public HTTPS `AUTH_URL`; the Blueprint generates `AUTH_SECRET`. The start command runs `release` before Next.js, including on the selected free plan without a paid pre-deploy hook. Review host limits before choosing a production plan.
- **Railway:** deploy the repository using `railway.json`. Set `DATABASE_URL`, a random `AUTH_SECRET`, the public HTTPS origin as `AUTH_URL`, `AUTH_TRUST_HOST=true`, and `ALLOW_DEMO_ACCOUNTS=false`. Generate a public domain and redeploy after setting its exact origin. The pre-deploy command runs `release`.
- Admit the host's outbound network in Atlas. A developer IP entry alone does not admit the host. Store credentials in host secret settings. Create a real administrator through the interactive CLI below; copied demo accounts cannot sign in under production defaults.

`npm run release` runs `deploy:check`, `db:check`, and `db:push`. It rejects placeholder/short secrets and non-HTTPS/non-canonical origins, verifies database access and transactions, and synchronizes indexes. It does not accept destructive schema changes automatically. Future document backfills need an explicit reviewed script.

Both manifests use `build:deploy`, listen on the host's `PORT`, and probe `/api/health/ready`. Liveness is `/api/health`; readiness returns 200 when MongoDB responds and 503 when unavailable, without database details or credentials. Probes coalesce and cache for five seconds. Still run an authenticated smoke test on the actual host.

1. Provision an authenticated MongoDB replica set or Atlas cluster and store its database-qualified connection string in secret settings as `DATABASE_URL`, for example `mongodb+srv://USER:PASSWORD@CLUSTER/civicbridge?retryWrites=true&w=majority`. Use TLS and restrict the database user's permissions and allowed network clients. Do not use the unauthenticated local development configuration in production.
2. Set a random `AUTH_SECRET` with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`. Set `AUTH_URL` to the exact HTTPS origin of the deployment. The configured origin must match the browser origin for mutation CSRF checks.
3. Set `AUTH_TRUST_HOST=true` only behind a host/proxy you control. Configure the proxy to forward the original host/protocol consistently.
4. Use Node.js 24 (`.node-version` pins the tested version). Build with `npm run build:deploy`, which clean-installs build dependencies and builds Next.js. Run `npm run release` before serving. MongoDB uses index synchronization rather than Prisma SQL migration files; future document changes need a reviewed backfill.
5. Start with `npm run start:hosted`. It binds to `0.0.0.0` and honors your platform's `PORT`. The default `npm start` intentionally binds to loopback for local development.
6. Demo accounts are disabled by default in production. Seed only an isolated demonstration database: temporarily supply a strong `DEMO_PASSWORD` and explicitly set `ALLOW_DEMO_ACCOUNTS=true` before `npm run db:seed`. Omit the seed and demo flag for a real deployment.
7. Create the first real administrator through the documented CLI: `npm run admin:create -- admin@example.org "Administrator Name"`. It prompts for the password without displaying it; it never upgrades an existing account. This is a trusted operator action, not a public registration option.

For Vercel, configure the same variables and a MongoDB Atlas connection string including the database name. Configure Atlas network access for the deployment host and reuse the Prisma singleton to limit connection churn. Synchronize indexes in a release job before serving new code. `next start` is not needed on Vercel. Uploads are database-backed and work without a persistent application filesystem.

## Production checks

- Run `npm test`, `npm run typecheck`, and `npm run test:e2e` against a separate disposable development database before release. The integration suite requires seeded demo accounts and removes only records created by its exact test prefix. Never point it at an account/customer production database.
- Back up MongoDB, including uploaded binary fields, using Atlas backups or MongoDB Database Tools (`mongodump`/`mongorestore`).
- Terminate HTTPS at a trusted proxy. Keep production `AUTH_URL` on HTTPS and retain security headers.
- Monitor application logs, database connections, authentication failures, and uploaded file storage growth. Never print secrets.
- Schedule `npm run maintenance` for expired rate-limit rows and unattached uploads older than 24 hours. It does not delete attached report/proposal files.
- Add email verification and password reset, malware scanning, human moderation operations, and retention policies appropriate to your deployment before an unrestricted public launch.

## Docker deployment

The Dockerfile builds without application secrets, runs as the unprivileged `node` user, and keeps Prisma/tsx operator tools for `release`, `admin:create`, and `maintenance`. Docker is optional; the Render/Railway Node manifests remain available. The container runs the release checks before serving, so schema/index changes should be coordinated with other replicas. A failed release exits rather than serving partially prepared code.

```powershell
docker build --tag civicbridge:latest .
# Create .env.production locally with real host settings; never commit it.
docker run --detach --name civicbridge --restart unless-stopped --env-file .env.production --publish 127.0.0.1:3000:3000 civicbridge:latest
# Provision a non-demo administrator interactively, after the container starts.
docker exec -it civicbridge npm run admin:create -- admin@example.org "Administrator Name"
# Schedule this command with the deployment platform or an external scheduler.
docker exec civicbridge npm run maintenance
```

Supply `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `AUTH_TRUST_HOST=true`, and `ALLOW_DEMO_ACCOUNTS=false` in that runtime env file using Docker's `KEY=value` syntax. Terminate public HTTPS at a reverse proxy forwarding to the published loopback port. Admit the container host in Atlas network access. No upload volume is needed because files live in MongoDB. The Docker health check uses readiness, not just process liveness. Docker availability and the actual image build must be verified on a Docker-capable machine or in CI before relying on this recipe.

## Data artifacts and administrator checks

Run `npm run etl:check` before release. `npm run etl` regenerates the model/report offline; `npm run etl -- --refresh` intentionally changes the upstream snapshot. Commit the source, dataset, model, and report together after review. The production build rejects stale lineage, changed weights, fabricated metrics, partition leakage, or failed baseline quality gates. These gates do not establish field accuracy.

After administrator sign-in, visit `/system` to inspect database transaction readiness, pending reviews, production-configuration issues, demo sign-in mode, and bundled data fingerprints. Only administrators can call `/api/system`, and its response is not cached. This checks current configuration and a read-only transaction, not external backups, monitoring, email delivery, or malware scanning. The full [stack and ETL guide](PRODUCT_TECH_STACK_AND_ETL.md) explains each boundary.

GitHub Actions now includes HTTP/database verification against both development and optimized production servers, reproducible model checks, formatting, and a separate secret-free Docker build. The workflow needs to run in the remote repository before its result can be claimed. No automatic deployment or push is configured by these changes.

## Optional AI endpoint

The [local classifier and AI lab](AI_MODEL_CARD.md) require no provider key. Report assistance defaults to `AI_CLASSIFIER_MODE=rules`; `local-model` opts into the public-data baseline after review of its limitations. The synthetic demo remains separate in the lab. [Dataset preparation and reuse terms](../data/README.md) document reproducible training.

Set `LLM_API_KEY`, `LLM_BASE_URL`, and `LLM_MODEL` to a compatible server-side endpoint. The user's problem text is sent to that configured provider when they press the assistance button. The report form explains this when AI is enabled. Do not prefix secrets with `NEXT_PUBLIC_`. Responses are suggestions requiring human acceptance; timeouts, invalid output, or provider errors fall back to local rules.

## Troubleshooting

- **Prisma EPERM on Windows:** stop the running Next.js process before `prisma generate` or `npm run build`; the active process may hold its native engine DLL open.
- **`&&` is not a valid statement separator:** Windows PowerShell 5.1 cannot run the Linux-style combined command directly. Use `npm.cmd run build:deploy` to clean-install and build, or `npm.cmd run build` to build with already installed dependencies.
- **Build dependency missing:** the deployment command includes dev dependencies explicitly; do not replace it with a production-only installation before compilation. Prisma, TypeScript, and Tailwind's PostCSS tooling are build dependencies.
- **Mutation returns 403:** make `AUTH_URL` match the app's exact scheme, hostname, and port. Local development supports both localhost and 127.0.0.1. Production supports only the configured canonical origin.
- **Database unavailable:** confirm `DATABASE_URL` includes a database name, credentials/TLS settings, network access, and replica-set configuration. For the local instance run `npm run local:db:start`, then `npm run db:push` and `npm run db:generate` before serving pages.
- **Transactions not supported:** use a replica set. The native helper and Compose service initialize `civicbridge-rs` on port 27018. Atlas already provides replica sets.
- **Auth.js credentials fail:** run the seed explicitly, use the configured `DEMO_PASSWORD`, and check the active flag. Ten attempts per account per 15-minute window are allowed. Wait for the rate-limit window after repeated failures.
- **Map tiles unavailable:** Leaflet loads OpenStreetMap tiles in the browser. Ensure that network is reachable; reporting also accepts numeric coordinates without tiles.
