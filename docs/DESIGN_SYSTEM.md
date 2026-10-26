# CivicBridge interface and regional languages

The website and installable app use white surfaces, a grey canvas, and black primary actions. Borders, status labels, charts, maps, the bridge mark, and installation icons use shades of grey. Status text and icons convey meaning without relying on colour. Community photographs retain their original colours.

## Layout and components

`src/app/redesign.css` defines shared components; `src/app/app-shell.css` defines the monochrome tokens and dedicated app layout. Tokens are surface `#ffffff`, canvas `#f7f7f7`, primary text/action `#171717`, secondary text `#333333`, muted text `#737373`, and borders `#e5e5e5`. Dark mode uses neutral grey surfaces and white actions. The font stack uses Aptos for Latin text and Nirmala UI/system script fallback for regional text, without a network font dependency.

The app uses a compact header and five phone tabs: Home, Explore, Create, Solutions, and Account. A left navigation rail replaces those tabs on desktop. The posting action is the strongest visual element; browsing is a quiet list of real community posts. The app has its own account, appearance and installation screens, without the website's marketing header/footer. The website keeps its compact public navigation.

The layout deliberately avoids a card dashboard filled with competing metrics: the home screen has two actions and a searchable feed. Account tools and installation instructions are available when needed. This follows the civic task—report, find help, follow progress—with short labels and limited initial choices.

The desktop website has compact navigation, a short introductory section, current community posts, and a brief explanation of the process. The app foregrounds two posting actions and its searchable feed. Forms, workspace navigation, review tables, charts, cards, dialogs, and empty/loading/error states share spacing, typography, border, focus, and button treatments. The bridge mark and install icons match the accent.

Problem and solution forms use three visible steps. Previous-step values remain mounted, so back navigation and language changes retain input and attachment identifiers. Each step validates before advancing; final submission still uses the existing authorized API and server validation. Uploading disables final submission. Reports and proposals retain their existing review/privacy rules.

Extra discovery filters, installation help, AI selection/performance tables, and detailed methodology use explicit disclosure. Short card previews lead to complete original content on detail pages. Essential model-review and privacy notices remain available. The mobile app has safe-area navigation and keyboard-accessible controls; reduced-motion preferences are respected.

## Languages

English, Hindi, Marathi, Bengali, Tamil, and Telugu are available from the persistent header selector, including on phones. The `civicbridge_locale` cookie stores only the validated interface preference. Server layout reads it for the initial document language; React context updates the interface immediately when changed. UI pages are consequently rendered per request rather than sharing language-independent static HTML.

`src/lib/i18n/messages.ts` holds explicit translations for navigation, main page headings, browsing, registration/sign-in, posting, categories/statuses, common workspace actions, and notices. `Text`, localized field/link wrappers, and `LocalDate` apply them through React. Dates retain the Asia/Kolkata timezone. There is no DOM-text replacement, external translation API, or automatic transmission of post content.

Form enum values, route paths, IDs, and database content remain canonical. A displayed translated category still submits its original English enum. Reports, names, locations, proposals, and measurement evidence remain in the author's language. The offline screen also supports the six language choices and caches only generic public text/icons. Technical model/source descriptions and uncatalogued operator copy fall back to English; the locale selector does not claim to translate user-generated posts. Native-speaker review is recommended before broad public rollout.

## Verification

Unit tests check catalog completeness, duplicate keys, supported preferences, core translations, fallback, and whitespace. Browser tests verify all six languages through navigation/reload, narrow layouts, three-step posting, back navigation, category-value stability, preserved original regional content, keyboard menu closure, and offline cache boundaries. Screenshots are captured by the browser suite for visual inspection. Physical-device camera capture, platform-native installation menus, and native permission dialogs still require device testing.
