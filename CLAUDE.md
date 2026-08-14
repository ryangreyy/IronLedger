# IronGladiator (IronLedger repo)

A fitness tracker web app — vanilla HTML/CSS/JS, no build tools, no framework. Firebase (Auth, Firestore, Storage) backend via the compat SDK. Hosted on GitHub Pages at irongladiator.app via `.github/workflows/pages.yml`. Installable as a PWA (manifest + icons, no App Store) with an optional WebAuthn Face ID lock (`applock.js`, off by default).

**The user (Ryan) is non-technical** — a finance background, not an engineer. Explain things in plain language, not jargon. He relies on Claude to actually write and ship the code, not just advise.

## Standing rules — do not violate these

- **Claude handles all git commits and pushes automatically.** Don't ask permission for routine commits; just do them and report what shipped.
- **Before every commit**, run `git fetch origin main` + `git log HEAD..origin/main --oneline` to check for remote divergence — other sessions sometimes push to this same repo concurrently, and local state can silently drift from actual current values.
- **Cache-busting**: static assets (`app.js`, `styles.css`, `challenges.js`, `nav.js`, `pwa-update.js`) are referenced with a `?v=N` query string across every HTML page. Whenever you edit one of these files, bump its version **consistently across every page that references it** — grep current values first, never trust a remembered number, since concurrent sessions move them. `pwa-update.js` additionally has internal constants (`VERSION`, `EXPECTED_UPDATER`, `EXPECTED_MANIFEST`, `EXPECTED_APP`) that must stay in lockstep with the real `?v=` values in the HTML and with `manifest.json`'s `start_url` — a mismatch here has caused the installed PWA to get stuck in an infinite reload loop more than once. Always do a full consistency audit (grep every `?v=` reference + pwa-update.js's constants + manifest.json) before pushing anything that touches these files.
- **No redundant nav buttons.** Signed-in pages get no CTA/nav buttons in the page body — the bottom nav bar and hamburger menu already cover navigation. Don't add "Go to X" buttons to signed-in views.
- **Dark mode is the default theme and must stay pixel-identical** to how it's always looked. Light mode is additive via `[data-theme="light"]` overrides layered on top — never restructure dark-mode CSS to accommodate light mode.
- **Always preview/verify in dark mode** unless the user is specifically asking about light mode.
- Don't reintroduce per-category color-coding on the training/cardio log filter pills — tried and explicitly reverted; the "distinct" feeling comes from per-pill background/border + spacing, not color.
- Leaderboards: a strength/volume category has been rejected by the user roughly six times across sessions. Don't re-suggest it without a genuinely new angle.

## Known gotchas

- **CSS specificity traps**: shared base classes (`.stat-tile .st-value`, `h2.title`, etc.) reused across many contexts in `styles.css` can silently beat a more specific-looking page-level override, either because they're defined later at equal specificity, or because a compound selector (`h2.title`) outranks a single-class one (`.feed-head-title`) regardless of source order. When a style change doesn't seem to apply, check for this before assuming the edit was wrong — verify with `getComputedStyle()`, not just a visual/bounding-box check.
- **Nav avatar has 4 separate render implementations** (top nav, bottom nav, feed cards, comments/reactions) — any avatar-related change needs all of them checked, not just one.
- **`.reveal` class gotcha** with the reusable `.page-tabs` component — check `project_page_tabs` context if resurrecting old memory, or just test carefully when adding tabs to a new page.
- **Flexbox `min-width:0`**: needed on flex children that contain text that should wrap/truncate instead of forcing horizontal overflow (bit the Goals/Trackers card layout before).
- Photo avatars: the shared `buildAvatarEl`/`applyPhotoAvatars` renderer hardcodes a 32px positioning box — don't resize an avatar container via CSS without accounting for this, or photo (not icon/initial) avatars will render mispositioned.
- No `firestore.rules` file exists in this repo — Firestore security rules are Firebase-Console-only, out of reach from this codebase. Several features (reactions, comments, friend requests) are enforced client-side only for visibility filtering; genuine write permissions live in rules the user pastes into Firebase Console directly (ask for the current rules text before proposing additions, don't guess).

## Feature map

- **Social**: usernames, friends (`friendRequests` collection), a friends activity feed (`feed.html`) with per-post comments and a single "like" reaction (avatar-list of likers visible via long-press, post-owner only), leaderboards (streak/best-streak/rank), and head-to-head lift challenges (`headToHead` collection) with a "face-off" card design (avatars + VS + a split bar showing relative lead).
- **QR add-friend flow**: `add-friend.html` — scan a friend's QR (encodes `?u=<uid>`) to land on a confirm-request page; handles the signed-out sign-in-then-return flow via a `sessionStorage` bridge.
- **Login wall**: signed-out users are hard-gated. `index.html` hosts the sign-in/create-account gate; every other page redirects there if not signed in, via a `data-authredirect` head-guard + `nav-auth.js`/`app.js` `onAuthStateChanged` checks. Anti-flash guards read a `ig-signedin-guess` localStorage flag to avoid a flash of signed-out UI on reload.
- **Seamless navigation**: `soft-nav.js` is an opt-in client-side router that swaps page content without a full reload (View Transitions API is disabled — it looked janky).
- **PWA + Face ID**: installable home-screen app; `applock.js` shows a biometric lock screen before first paint if enabled in Settings. It's a privacy gate, not a real security boundary (client-side trust only, documented as such in the file's own header comment).
- **Rank/XP system**: 8 ranks (Recruit → Gladiator), each with a hand-built SVG shield badge (`challenges.js`, `rankHexBadge`) that gets progressively more ornamented at higher ranks, plus a roman-numeral sub-tier indicator.

## Working style notes

- The user often asks for a **visual preview before implementation** on design-y requests (e.g. "give me a preview of X redesign") — build these as a self-contained Artifact using the app's real fonts/colors (embed Google Fonts as base64 data URIs, since Artifacts can't reach font CDNs), not a generic mockup.
- Browser-based screenshot verification has been unreliable in Claude Code sessions on this machine — when it fails, fall back to `getComputedStyle()` checks, pixel-sampling via an offscreen canvas, or a scratch test file copied temporarily into the project root and served via the local dev server, rather than giving up on verification entirely.
- When the user reports a bug, prefer rewriting the affected logic cleanly over patching around it if the surrounding code is already being touched — several real bugs here were fixed this way rather than root-caused line-by-line.
