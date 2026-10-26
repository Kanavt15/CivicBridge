# CivicBridge for Android and iPhone

`mobile/` is a separate React Native app using Expo SDK 58 and Expo Router. It renders native screens and controls; it does not embed the website in a WebView. The website and installable browser app remain available.

The interface uses white surfaces, grey borders, black actions, and five tabs: Home, Explore, Create, Solutions, Account. English, Hindi, Marathi, Bengali, Tamil, and Telugu reuse the website's reviewed message catalog. Posts, names and locations remain in the author's language. Native-speaker review is still recommended before a broad release.

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

Start the backend from the repository root using its existing Atlas `.env`:

```powershell
npm.cmd ci
npm.cmd run db:generate
npm.cmd run db:push
npm.cmd run dev
```

`db:push` adds the `MobileSession` collection and indexes without a SQL migration. It is also part of the documented server release workflow. Keep Atlas credentials on the server; the phone never connects directly to Atlas.

In a second PowerShell window:

```powershell
cd mobile
npm.cmd ci
Copy-Item .env.example .env
npm.cmd start
```

The example uses `EXPO_PUBLIC_API_URL=http://10.0.2.2:3000` for the Android emulator. On a Mac, the iOS simulator can use `http://localhost:3000`. Use a compatible Expo development client; the `development` EAS profile includes `expo-dev-client`. A local Android build requires Android Studio/SDK; local iOS compilation requires a Mac/Xcode. [Expo development-build setup](https://docs.expo.dev/develop/development-builds/create-a-build/).

For a physical phone, set the API URL to the computer's LAN IPv4 address and run the backend explicitly with `npx.cmd next dev --hostname 0.0.0.0`. Both devices need network access and appropriate firewall permission. This is a development setup; release/preview builds require a deployed HTTPS backend. The server retains browser CSRF checks and permits origin-less writes only with a verified native bearer session.

## Build and distribute

The backend is currently **not deployed**. Before distributing the app:

1. Deploy the existing Next.js backend using [Atlas/Render/Railway instructions](ATLAS.md), run the release/schema checks, and verify `/api/health/ready` over HTTPS.
2. Set `EXPO_PUBLIC_API_URL` to that HTTPS origin in the relevant EAS environment. It is a public URL, not an Atlas URI or secret. Restart/rebuild after changes; Expo embeds this value in the bundle.
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

The app configuration rejects distributable EAS builds without a valid HTTPS origin. The `preview` Android profile produces an APK; production uses the platform's store format. [Expo APK profiles](https://docs.expo.dev/build-reference/apk/), [EAS signing/build setup](https://docs.expo.dev/build/setup/).

Signed device/store builds need your Expo account and platform signing credentials. Apple device distribution/TestFlight also needs Apple Developer provisioning. No APK/IPA, signing credential, cloud build, or store submission has been created in this session. Complete physical-device camera/GPS/accessibility review and store privacy/account-management requirements before submission.

## Sessions and server maintenance

`POST /api/mobile/register` shares web registration validation and rate limits. `POST /api/mobile/session` shares credential checks and login throttling. These endpoints accept bounded native JSON requests with `X-CivicBridge-Client: native`; browser origins must still be allowed. No cross-origin browser access is enabled.

Native sign-in returns a random 256-bit opaque token valid for seven days. MongoDB stores its SHA-256 digest, user relation, and expiry. API requests use `Authorization: Bearer …`; active/demo/role checks run against the current user record. Invalid authorization never falls back to a browser cookie. `DELETE /api/mobile/session` revokes the token, and `GET` verifies the session. Passwords and raw tokens are not logged or stored in Atlas. Expired records are removed by `npm.cmd run maintenance`.

Temporary network failures preserve the encrypted on-device session. A 401 clears it. Offline sign-out removes the local credential and explains that server revocation was not confirmed; the server session still expires automatically. There is no silent refresh token or indefinite session.

## Verification and current limits

From `mobile/`: `npm.cmd run typecheck`, `npm.cmd run lint`, `npx.cmd expo-doctor`, and `npm.cmd run export:native` validate configuration and Android/iOS JavaScript/Hermes bundles. These exports are not signed native binaries.

The root integration suite tests native credentials, private reports/uploads, researcher proposals, role denials, expiry, disabled accounts, revocation, and browser-origin rejection against an isolated loopback database. It never tests writes against Atlas.

For native-component UI review, export with `EXPO_PUBLIC_API_URL=https://civicbridge.example.test` using `npm.cmd run export:web` in `mobile/`, then run `npm.cmd run test:native:ui` at the repository root. This test mocks the API and verifies native component rendering, sign-in, preserved form state and bearer submission. It does not replace Android/iOS device tests. Browser review does not persist credentials to localStorage.

Expo Doctor reports compatible dependencies. The current Expo CLI dependency tree still reports five upstream high-severity npm advisories involving `node-forge`/CLI `zod`. A compatible `npm audit fix` did not resolve them; forcing npm's proposed Expo downgrade is not appropriate. These are tooling dependencies, but audit findings still need upstream resolution/review before a release pipeline is trusted. See `npm.cmd audit` inside `mobile/`.
