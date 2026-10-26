# CivicBridge interface and regional languages

The website and installable app share one interface system. The redesign uses white surfaces, soft grey canvas, graphite text, and one blue accent. Green/red appear only for meaningful outcome/error states; unrelated category colours, decorative gradients, large slogans, and repeated promotional sections were removed from the main experience.

## Layout and components

`src/app/redesign.css` defines the visual layer over the existing functional layout. Tokens are surface `#ffffff`, canvas `#f8f9fc`, primary text `#182230`, muted text `#667085`, borders `#e5e8ef`, and accent `#335cde`. Dark-mode tokens preserve hierarchy and readable controls. The font stack uses Aptos for Latin text and Nirmala UI/system script fallback for regional text, without a network font dependency.

The desktop website has compact navigation, a short introductory section, current community posts, and a brief explanation of the process. The app foregrounds two posting actions and its searchable feed. Forms, workspace navigation, review tables, charts, cards, dialogs, and empty/loading/error states share spacing, typography, border, focus, and button treatments. The bridge mark and install icons match the accent.

Problem and solution forms use three visible steps. Previous-step values remain mounted, so back navigation and language changes retain input and attachment identifiers. Each step validates before advancing; final submission still uses the existing authorized API and server validation. Uploading disables final submission. Reports and proposals retain their existing review/privacy rules.

Extra discovery filters, installation help, AI selection/performance tables, and detailed methodology use explicit disclosure. Short card previews lead to complete original content on detail pages. Essential model-review and privacy notices remain available. The mobile app has safe-area navigation and keyboard-accessible controls; reduced-motion preferences are respected.

## Languages

English, Hindi, Marathi, Bengali, Tamil, and Telugu are available from the persistent header selector, including on phones. The `civicbridge_locale` cookie stores only the validated interface preference. Server layout reads it for the initial document language; React context updates the interface immediately when changed. UI pages are consequently rendered per request rather than sharing language-independent static HTML.

`src/lib/i18n/messages.ts` holds explicit translations for navigation, main page headings, browsing, registration/sign-in, posting, categories/statuses, common workspace actions, and notices. `Text`, localized field/link wrappers, and `LocalDate` apply them through React. Dates retain the Asia/Kolkata timezone. There is no DOM-text replacement, external translation API, or automatic transmission of post content.

Form enum values, route paths, IDs, and database content remain canonical. A displayed translated category still submits its original English enum. Reports, names, locations, proposals, and measurement evidence remain in the author's language. The offline screen also supports the six language choices and caches only generic public text/icons. Technical model/source descriptions and uncatalogued operator copy fall back to English; the locale selector does not claim to translate user-generated posts. Native-speaker review is recommended before broad public rollout.

## Verification

Unit tests check catalog completeness, duplicate keys, supported preferences, core translations, fallback, and whitespace. Browser tests verify all six languages through navigation/reload, narrow layouts, three-step posting, back navigation, category-value stability, preserved original regional content, keyboard menu closure, and offline cache boundaries. Screenshots are captured by the browser suite for visual inspection. Physical-device camera capture, platform-native installation menus, and native permission dialogs still require device testing.
