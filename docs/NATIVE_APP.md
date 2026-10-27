# CivicBridge for Android and iPhone

`mobile/` is a separate React Native app using Expo SDK 58 and Expo Router. It renders native screens and controls; it does not embed the website in a WebView. The website and installable browser app remain available.

The interface uses white surfaces, grey borders, black actions, and five tabs: Home, Explore, Create, Solutions, Account. English, Hindi, Marathi, Bengali, Tamil, and Telugu reuse the website's reviewed message catalog. Posts, names and locations remain in the author's language. Native-speaker review is still recommended before a broad release.

The app and website use the same Atlas-backed API, with five-second foreground refresh and immediate local invalidation after edits. See [shared data, Android preview installation, and synchronization](DATA_SYNC.md). The local APK uses a localhost backend through USB forwarding, with no LAN exposure by default.

## Implemented

- Existing-account sign-in and citizen/researcher/institution/industry registration.
- Problem/solution discovery, search, categories, pagination, pull to refresh and detail screens.
- Role-authorized three-step reports/proposals; entries survive Back and language changes.
- Explicit camera/gallery selection, JPEG conversion/resizing, authenticated uploads, and on-demand foreground GPS with manual coordinate entry.
- Editable category/urgency assistance from the existing server classifier, with human review.
- Private submission status in My activity, notifications, profile editing, comments, support votes, public sharing, and sign-out.
- Keychain/Keystore-backed session storage and locale preference. No password storage, background GPS, offline posting queue, or cached private API responses.

Team management, administration, collaboration workspaces and full evidence tools remain in the web portal. These are not presented as implemented native screens. Notifications here are fetched in-app; push notifications are not configured.

## Run locally on Windows

The ready-to-install Android APK is `artifacts/CivicBridge-preview.apk`. It contains both arm64 phone and x86_64 emulator builds, uses a local testing certificate, and needs no Expo account or Metro server. Follow [USB installation and the shared backend](DATA_SYNC.md#connect-the-installable-android-preview-locally). This preview is distinct from a store-signed release.

To work on the source, install the server dependencies and update the additive MongoDB schema from the repository root using its existing Atlas `.env`:

```powershell
npm.cmd ci
npm.cmd run db:generate
npm.cmd run db:push
npm.cmd run mobile:connect
npm.cmd run build
npm.cmd run start:shared
```

`db:push` adds the `MobileSession` collection and indexes without a SQL migration. It is also part of the documented server release workflow. Keep Atlas credentials on the server; the phone never connects directly to Atlas.

In a second PowerShell window:

```powershell
cd mobile
npm.cmd ci
npm.cmd start
```

`mobile:connect` creates an ignored `mobile/.env.local` with the public localhost origin and local-preview flag. Use `adb reverse tcp:3000 tcp:3000` for a USB-connected Android phone or emulator. On a Mac, an iOS simulator can reach `http://localhost:3000`. Use a compatible Expo development client; the `development` EAS profile includes `expo-dev-client`. A local Android build requires Android Studio/SDK; local iOS compilation requires a Mac/Xcode. [Expo development-build setup](https://docs.expo.dev/develop/development-builds/create-a-build/).

The local preview keeps Atlas access on a localhost-only server and disables demo-account sign-in. Optional LAN access requires separate authorization; it has not been enabled. Distributable EAS builds require a deployed HTTPS backend. The server retains browser CSRF checks and permits origin-less writes only with a verified native bearer session.

## Build and distribute

The backend is currently **not deployed**. Before distributing the app:

1. Deploy the existing Next.js backend using [Atlas/Render/Railway instructions](ATLAS.md), run the release/schema checks, and verify `/api/health/ready` over HTTPS.
2. Set `EXPO_PUBLIC_API_URL` to that HTTPS origin in the relevant EAS environment. It is a public URL, not an Atlas URI or secret. Restart/rebuild after changes; Expo embeds this value in the bundle.
   Set `EXPO_PUBLIC_LOCAL_PREVIEW=false` for release builds so local `.env.local` settings do not select the preview identifier or HTTP transport.
3. In `mobile/`, run `npx.cmd eas-cli@latest login`, then `npx.cmd eas-cli@latest init` to link your own Expo project. Review `in.civicbridge.community` package/bundle identifiers before registering them with the stores.
4. Build with one of the supplied profiles:

```powershell
# Installable Android APK for testing
npx.cmd eas-cli@latest build --platform android --profile preview

# iOS simulator, without device provisioning
npx.cmd eas-cli@latest build --platform ios --profile simulator

# Android AAB / signed iOS release for store distribution
npx.cmd eas-cli@latest build --platform all --profile production
```

The app configuration rejects distributable EAS builds without a valid HTTPS origin. The `preview` Android profile produces an APK; production uses the platform's store format. EAS manages developer build numbers remotely and increments production builds, while the app's user-facing version stays explicit in its configuration. [Expo APK profiles](https://docs.expo.dev/build-reference/apk/), [EAS signing/build setup](https://docs.expo.dev/build/setup/), [build version management](https://docs.expo.dev/build-reference/app-versions/).

Cloud and store builds need your Expo account and platform signing credentials. Apple device distribution/TestFlight also needs Apple Developer provisioning. An installable Android preview APK has been built locally with the generated Android debug certificate; no cloud build, IPA or store submission has been produced. Android is the current priority; iPhone signing is deferred until the required accounts are available. Complete physical-device camera/GPS/accessibility review and store privacy/account-management requirements before submission.

## Sessions and server maintenance

`POST /api/mobile/register` shares web registration validation and rate limits. `POST /api/mobile/session` shares credential checks and login throttling. These endpoints accept bounded native JSON requests with `X-CivicBridge-Client: native`; browser origins must still be allowed. No cross-origin browser access is enabled.

Native sign-in returns a random 256-bit opaque token valid for seven days. MongoDB stores its SHA-256 digest, user relation, and expiry. API requests use `Authorization: Bearer …`; active/demo/role checks run against the current user record. Invalid authorization never falls back to a browser cookie. `DELETE /api/mobile/session` revokes the token, and `GET` verifies the session. Passwords and raw tokens are not logged or stored in Atlas. Expired records are removed by `npm.cmd run maintenance`.

Temporary network failures preserve the encrypted on-device session. A 401 clears it. Offline sign-out removes the local credential and explains that server revocation was not confirmed; the server session still expires automatically. There is no silent refresh token or indefinite session.

## Verification and current limits

From `mobile/`: `npm.cmd run typecheck`, `npm.cmd run lint`, `npx.cmd expo-doctor`, and `npm.cmd run export:native` validate configuration and Android/iOS JavaScript/Hermes bundles. These exports are not signed native binaries.

The root integration suite tests native credentials, private reports/uploads, researcher proposals, role denials, expiry, disabled accounts, revocation, and browser-origin rejection against an isolated loopback database. It never tests writes against Atlas.

For native-component UI review, export with `EXPO_PUBLIC_API_URL=https://civicbridge.example.test` using `npm.cmd run export:web` in `mobile/`, then run `npm.cmd run test:native:ui` at the repository root. This test mocks the API and verifies native component rendering, sign-in, preserved form state and bearer submission. It does not replace Android/iOS device tests. Browser review does not persist credentials to localStorage.

Expo Doctor reports compatible dependencies. On 27 October 2026, the Expo CLI dependency tree reports four upstream high-severity npm advisories involving `node-forge`/CLI `zod`. A compatible `npm audit fix` did not resolve them; forcing npm's proposed Expo downgrade is not appropriate. These are tooling dependencies, but audit findings still need upstream resolution/review before a release pipeline is trusted. See `npm.cmd audit` inside `mobile/`.
