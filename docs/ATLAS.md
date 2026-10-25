# Connect CivicBridge to MongoDB Atlas

The app already uses Prisma's MongoDB connector. Switching to Atlas changes `DATABASE_URL`; it does not require changing document IDs, authentication, API routes, or the database schema.

## Create or select the cluster

1. Sign in to [MongoDB Atlas](https://cloud.mongodb.com/) and open or create a project for CivicBridge.
2. Create a cluster. Use a free cluster if offered for your account and region, and place it near the application server. Review Atlas pricing before choosing any paid capacity.
3. Under **Database & Network Access**, create a **database user** with password authentication and the `readWrite` role limited to the `civicbridge` database. This user is separate from your Atlas account login. Use a distinct user/database for development and production.
4. Add your current public IP for local development. For deployment, add the application's outbound IPs, or use a supported private network connection. A browser visitor's IP is not the application server's outbound IP. If the hosting provider uses changing outbound addresses, choose its static-egress/private-connectivity option before configuring the Atlas access list.
5. Choose **Connect → Drivers** and copy the MongoDB connection URI. Insert the database user's credentials and add `/civicbridge` before `?`. Encode reserved characters in the username/password individually; do not percent-encode the entire URI.

Example only:

```dotenv
DATABASE_URL="mongodb+srv://<db_username>:<db_password>@<cluster-host>.mongodb.net/civicbridge?retryWrites=true&w=majority&appName=CivicBridge"
```

Atlas supplies replica-set/sharded topology details. Do not carry the local `replicaSet=civicbridge-rs` or `directConnection=true` parameters into the Atlas URI. Keep Atlas's TLS and certificate validation enabled.

## Configure and verify

Save the real URI in the project's existing `.env` file. Keep the URI out of chat, Git, screenshots, command-line arguments, and logs. If the current local database is still needed, keep its URI in a private backup or use the local example template later. Avoid creating a separate `.env.local` with a conflicting database URL: Next.js loads it before `.env`, while the Prisma CLI and project scripts read `.env`.

```powershell
npm.cmd run db:check
npm.cmd run db:push
```

`db:check` validates the URI, pings the server, and performs a read-only transaction against the application database. It does not copy or seed data and never prints the URI. `db:push` synchronizes collection indexes; MongoDB does not use Prisma SQL migrations.

For a fresh isolated demo database, explicitly set a strong `DEMO_PASSWORD`, then run `npm.cmd run db:seed`. For production, use `npm.cmd run admin:create -- admin@example.org "Administrator Name"` from an interactive trusted terminal instead. Do not seed shared example credentials into production.

Changing the URI alone does **not** transfer the existing local records. To preserve them, pause application writes, copy all application collections to the intended Atlas database with IDs, timestamps, and binary fields intact, verify document contents and indexes, then switch the app. The local database stays available until the transfer is verified. Any one-time transfer scripts should be executed and removed afterward, matching this project's migration workflow. Do not copy test-only or expired rate-limit data into a real production launch.

## Deploy the application

Set these as server-only variables in the deployment host's settings:

| Variable          | Value                                              |
| ----------------- | -------------------------------------------------- |
| `DATABASE_URL`    | The real database-qualified Atlas URI              |
| `AUTH_SECRET`     | A new random secret generated for this environment |
| `AUTH_URL`        | The exact public HTTPS application origin          |
| `AUTH_TRUST_HOST` | `true` behind a trusted hosting proxy              |

Generate the authentication secret locally with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`, then save it in the host's secret settings. Keep deployment previews on their own database and authentication origin. None of these variables should use a `NEXT_PUBLIC_` prefix.

- **Vercel:** use the Next.js framework preset, `npm ci` for installation, and `npm run build` for the build. No custom start command or `vercel.json` is required for this project. Run `db:check` and `db:push` as a trusted release step with the target environment before deploying. Configure Atlas network access for Vercel's actual outbound connectivity.
- **Render/Railway or another Node host:** use `npm run build:deploy`, run the database check/index sync in the release process, and start with `npm run start:hosted` so the app binds to the host's network interface and `PORT`. The deployment script installs locked dependencies including build tools, then runs the production build, stopping immediately if either step fails.

## Render and Railway walkthrough

For the first demo deployment, Render provides documented outbound IP ranges directly in its dashboard. Railway is also supported, but its static outbound IP feature currently requires the Pro plan. These are hosting choices; neither changes the app's database schema.

### Atlas first

1. Open [Atlas](https://cloud.mongodb.com/), create a project named `CivicBridge`, and choose **Create** to create a cluster.
2. Choose **Free / M0** for a small demo if offered. Name the cluster `civicbridge` and choose an available region near the application server. Skip loading sample datasets; the project already has its own data.
3. Create a password-authenticated database user such as `civicbridge_app`. Under database-user privileges, grant `readWrite` on the `civicbridge` database. Save the generated password privately.
4. In the project's network/IP access settings, choose **Add My Current IP Address** so local verification and data transfer can connect. The hosting service's outbound addresses will be added separately when available.
5. From the cluster, choose **Connect → Drivers → Node.js**. Copy the URI to the existing project's `.env` as `DATABASE_URL`, fill in its username/password, and put `/civicbridge` before `?`. Keep the rest of the Atlas driver parameters. Percent-encode reserved password characters, such as `@` as `%40`.
6. Run `npm.cmd run db:check` locally. Once the connection works, the existing local data can be transferred and verified before switching the application. A new Atlas cluster does not automatically contain the local reports and accounts.

### Render

1. Put the source in a Git repository accessible to Render, excluding `.env`, `.data`, `node_modules`, and `.next`. This workspace is not currently initialized as a Git repository; do not publish the database files or credentials.
2. In Render, create a **Web Service** from that repository, select the Node runtime, and use these settings:

   | Setting       | Value                                  |
   | ------------- | -------------------------------------- |
   | Build command | `npm run build:deploy`                 |
   | Start command | `npm run start:hosted`                 |
   | Node version  | `24.14.1`, provided by `.node-version` |

3. Add `DATABASE_URL`, `AUTH_SECRET`, and `AUTH_TRUST_HOST=true` as service environment variables. Set `AUTH_URL` to the actual HTTPS service URL assigned by Render; update it if you later use a custom domain.
4. On the service page, open **Connect → Outbound** and copy all listed IP ranges into the Atlas project's IP access list. Render may use any address in those ranges.
5. Run `npm run db:push` as a trusted release step after allowing the host's network access, or run it locally against the same Atlas database before the first deployment. The normal app build command does not synchronize database indexes.
6. Deploy or redeploy the service, then check the homepage, login, and a database-backed challenge page. Atlas and the hosting service have not been provisioned from this workspace yet.

### Railway

1. Create a project from your repository and select the Next.js application service. Use the same build/start commands and four environment variables as Render.
2. Generate a public service domain and set its exact HTTPS origin as `AUTH_URL`.
3. On a Pro plan, open the service's **Settings → Networking**, enable **Static IPs**, add every assigned outbound IP to Atlas, and redeploy. If that option is unavailable on the selected plan, choose another supported egress solution or Render's documented outbound ranges.
4. Synchronize indexes against the target Atlas database, deploy, and verify database-backed pages.

The application database and user uploads live in Atlas, so a persistent application disk is not needed for their storage. Keep demo seeding separate from deployment; do not run the integration suite against the production database.

Hosting references: [Render Next.js web services](https://render.com/docs/deploy-nextjs-app), [Render outbound IP ranges](https://render.com/docs/outbound-ip-addresses), and [Railway static outbound IPs](https://docs.railway.com/networking/static-outbound-ips).

The application reuses a Prisma client per process. Monitor Atlas connection usage when scaling serverless instances and tune MongoDB driver connection settings to your chosen host and workload. Relational Prisma parameters such as `connection_limit` and `pool_timeout` are not MongoDB pool settings.

## Troubleshooting

- Authentication failure: check the database user, database name, percent-encoded password, and database access role. Your Atlas account password is not the database password.
- Timeout or unreachable cluster: check cluster availability, DNS/SRV resolution, and whether the machine or deployment server's outbound IP is allowed.
- Successful connection but no old reports: confirm the database name and whether the local records have actually been copied.
- Windows Prisma DLL lock: stop the dev server before `db:generate` or `build`. `db:push` intentionally skips client regeneration to avoid that lock.
- Windows PowerShell 5.1 does not support `&&`, and Windows execution policy can block `npm.ps1`. Use `npm.cmd run build:deploy` for the combined clean install/build, or `npm.cmd run build` if dependencies are already installed. Stop the dev server before a clean install on Windows so native modules are not locked.
- Missing Prisma, TypeScript, or Tailwind build tools on a host: keep `npm run build:deploy` as the build command. Its `ci --include=dev` explicitly installs build dependencies even when the host sets `NODE_ENV=production` or omits dev dependencies by default.
- Missing configuration: the real URI is still required; the checked-in `.env.example` contains placeholders only.

References: [Atlas connection prerequisites](https://www.mongodb.com/docs/atlas/connect-to-database-deployment/), [Atlas IP access lists](https://www.mongodb.com/docs/atlas/security/ip-access-list/), and [MongoDB connection options](https://www.mongodb.com/docs/manual/reference/connection-string-options/).
