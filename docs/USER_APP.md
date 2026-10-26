# Installable CivicBridge app

Open `/app` on the CivicBridge deployment. This Progressive Web App uses the existing accounts, role permissions, APIs, and MongoDB Atlas database. It does not require a separate backend, APK, app-store submission, or native build.

## Install

- Android/desktop: choose **Install app** when offered, or use the browser menu's **Install app / Add to Home screen** action.
- iPhone/iPad: open the site in Safari, tap **Share**, and choose **Add to Home Screen**.
- Prompts depend on browser eligibility and prior choices; manual instructions are available. The manifest starts installed sessions at `/app` and supplies problem/solution shortcuts where supported. Use the deployed HTTPS site; plain HTTP LAN addresses are not secure installation origins. Localhost works for testing.

## Post and follow progress

The app and website now use the shared [minimal interface system](DESIGN_SYSTEM.md). Choose English, Hindi, Marathi, Bengali, Tamil, or Telugu from the header. The preference persists through navigation and relaunch. Interface labels are translated; community posts retain their original language.

Problem posting is split into **Problem → Location → Review**. Solution posting is split into **Your idea → The plan → Review**. Continue validates the current step, and Back retains your entries. Switching language also retains entries and attached files. Submission remains online-only.

Citizens can post problems with description, category, urgency, locality, coordinates, and up to four JPEG/PNG/WebP images (5 MB each). **Take a photo** requests the environment camera where supported; gallery selection remains available. Unsupported formats such as HEIC must be exported to a supported format. Camera behavior varies by device/browser.

**Use my current location** requests permission only when tapped. It fills coordinates and recenters the map. Check the estimated accuracy/pin and enter city/locality yourself. No reverse-geocoding provider is called. Permission failures and out-of-India coordinates lead to manual entry. Hosted geolocation requires HTTPS. The initial pin is explicitly labeled Mumbai until changed.

Researchers/institutions can propose a solution to an open challenge with approach, technology, feasibility, expected impact, resources, an optional accepted team, and attachments. Action links respect the account role; server authorization remains authoritative. Citizens can browse solutions; researchers can respond to open problems.

Submissions retain existing privacy/review rules. **My activity** opens the dashboard for status, notifications, and collaboration. The feed has problem/solution tabs, search, categories, refresh, and problem pagination. Public solutions are capped at the latest 100 reviewed entries and disclose the limit.

## Connectivity and privacy

Production registers `/sw.js` and precaches only `/offline.html` and two public icons. It never caches accounts, API responses, RSC payloads, uploaded files, or submissions. A connection warning appears when offline; failed navigation shows a generic reconnect screen.

**There is no offline posting queue or background sync.** A network error is never reported as success. Keep an open form tab and retry after reconnecting; reloading can lose unsubmitted input. Drafts are not stored in localStorage. Offline report access/submission is not provided.

Service workers are disabled in ordinary `next dev` to avoid stale development behavior. Use `npm.cmd run build` and `npm.cmd start` for production testing. `NEXT_PUBLIC_ENABLE_DEV_SW=true` explicitly enables development registration if needed. Preserve `/sw.js` no-store headers; bump its app-owned cache version when offline assets change.

## Verify

`npm.cmd run test:app` runs browser checks against an optimized production build and isolated loopback test database. It rejects Atlas/application database names and verifies the actual server's test identity before writes. Build/seed the isolated database as described in the README and stop the normal app first. Windows uses installed Microsoft Edge; Linux/macOS uses Playwright Chromium (`npx playwright install chromium`). `TEST_BASE_URL` can target an existing test server using the same database and `CIVICBRIDGE_TEST_MODE=true`.

Tests cover real submissions with synthetic test data, mocked GPS, responsive widths, manifest/icons, feed filters, and offline cache boundaries. Physical-device camera capture, iOS installation, and native permission/standalone behavior still need device review. Push notifications and app-store builds are not included.
