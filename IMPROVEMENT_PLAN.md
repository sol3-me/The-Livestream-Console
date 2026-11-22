# Improvement Plan

Living tracker for the testability and UX work on The Livestream Console. Tick items off as they land and link the PR next to them.

## 1. The original request

Recorded as given so the scope doesn't drift:

1. Review the repo and say what should be improved.
2. Make the app's service dependencies mockable, so the YouTube Live service can be **swapped out entirely**. Playwright tests must not depend on a real YouTube connection.
3. Use that swap to test the **live, upcoming and completed** stream behaviour.
4. **No persistence database.** Hardcoded JSON fixtures are fine for all data.
5. **TDD.** Current behaviour must not change unless a bug is found. Bugs get logged here before they're fixed.
6. **Unit tests around every method call on every API route**, with mocked dependencies. Each test is verified by **commenting out the logic it covers first**, so it is proven to fail when that logic is missing.
7. After that groundwork: an improved dashboard, a better CRUD modal, and a full UX/UI review (Phase 2).
8. Keep all of this in a document at the repo root (this file).

## 2. Current state (review, 2026-11-15)

### Architecture as it stands

- Next.js 14 App Router, next-auth v4 (JWT strategy, Google provider), Tailwind, `googleapis@^67`.
- YouTube access lives in two modules of free functions: `lib/youtube.ts` (broadcasts, stream keys) and `lib/playlists.ts`. Each function builds its own `google.youtube()` client from an access token. `getYoutubeClient` is duplicated across both files.
- Callers import those functions directly:
  - **13 route handlers** under `app/api/**`.
  - **3 server components** (`app/dashboard`, `app/streams`, `app/playlists`), which call YouTube during SSR.
- **No tests, no test runner and no `test` script.** CI (`livestream-deploy.yml`) builds and deploys on every push to `master`, with no lint or test gate.

### Why this is hard to test today

The YouTube calls happen **on the server**, during RSC rendering and in route handlers. Playwright's `page.route()` only intercepts requests the *browser* makes, so it can't see them. Server-side interception exists through MSW and Next's experimental `testmode`, but reports say MSW can't reliably mock server-side calls in **Next 14** App Router, and `testmode` is still experimental. The robust option is a seam we own: an interface with a real implementation and a fake one, picked at startup.

### Bugs and risks found

These are logged rather than fixed silently. Each fix gets its own red test, then a green commit.

| # | Severity | Where | Issue |
|---|---|---|---|
| B1 | Medium | all `app/api/**` catch blocks | `NextResponse.json(e, { status: 500 })` serialises the raw Gaxios error and returns it to the client. **Confirmed** on the installed gaxios 4.3.2: `JSON.stringify(gaxiosError)` includes the `Authorization: Bearer …` header from `error.config`. The same object is also `console.error`'d into the Docker logs. Fix: return a sanitised `{ errors: [{ message }] }`. |
| B2 | Medium | `api/streams/create` | A missing or empty `startTime` throws `RangeError: Invalid time value` from `new Date(undefined).toISOString()` and returns a **500**. It should be a 400 validation error, like `title`. |
| B3 | Medium | `api/streams/edit/[id]` | The route ignores the `[id]` URL segment and trusts `body.id`, so the URL and the body can disagree. Also, if `bindBroadcastToStream` fails, the request returns 500 **after the edit has already been applied**. The create route treats binding as best-effort, so the two behave inconsistently. |
| B4 | Low | `api/playlists/membership`, `lib/playlists.ts` | There's no pagination (`maxResults: 50`, `nextPageToken` ignored). A playlist with more than 50 items can report false "not a member" results. The route also makes one YouTube call per playlist, which costs quota. |
| B5 | Low | `app/dashboard/page.tsx` | `RefreshAccessTokenError` isn't handled, though `/streams` and `/playlists` both handle it. The `catch {}` also swallows every error, so an expired token shows an empty dashboard instead of sending the user to re-auth. |
| B6 | Low | `Navbar.tsx`, `api/releases/latest` | Both still point at the old `sol3uk/...` repo path. It works only because GitHub redirects renamed repos. The Navbar also calls GitHub straight from the browser, so `/api/releases/latest` is never used. |
| B7 | Low | `middleware.ts` | The matcher covers `/dashboard` and `/streams` but not `/playlists`. The page redirects on its own, so this is only an inconsistency. |
| B8 | Cleanup | `components/DashboardActions.tsx` | Dead code: nothing imports it. |
| B10 | Low | `lib/utils.ts` | `toLocalDatetime('garbage')` returns `"Invalid Date"`, and `toDatetimeLocalValue('garbage')` returns `"NaN-NaN-NaNTNaN:NaN"`. `new Date()` never throws on bad input, so neither `try/catch` ever runs. |
| B9 | Cleanup | `lib/youtube.ts`, `lib/playlists.ts` | `getYoutubeClient` is duplicated. `googleapis@^67` is many majors behind. |
| B11 | Low | `components/DashboardClient.tsx` | Issue #50. The shortest timeframe was labelled "Today", but it is a rolling 24 hours, and the heading rendered "Completed in today". Relabelled "24 Hours". **Fixed.** |
| B12 | Low | `components/StreamCard.tsx` | Issue #51. The card view showed no privacy status, though the table view does. The badge is now a shared `PrivacyBadge` used by both. **Fixed.** |

## 3. Phase 1: Testability groundwork

Order matters. Characterisation tests lock in today's behaviour **before** any refactor, so the refactor is provably behaviour-preserving.

### 1A. Test tooling

- [x] Add **Vitest** for unit tests. Route handlers are plain async functions, so they can be called directly with a `NextRequest` and need no HTTP server.
- [x] Add `npm test`, `npm run test:watch` and `npm run test:verify` scripts.
- [ ] Add `npm run test:e2e` (lands with 1E).
- [x] Shared test helpers: a `mockSession()` that stubs `getServerSession` from `next-auth`, and JSON fixture loaders.

### 1B. Characterisation unit tests (mocking at the module boundary)

Mock `@/lib/youtube`, `@/lib/playlists` and `next-auth` with `vi.mock`. Verification protocol for **every** test:

1. Comment out the logic the test covers.
2. Write the test and watch it fail **on the assertion**, not on setup.
3. Uncomment the logic and watch it pass.
4. Commit.

**This is automated and repeatable** with `npm run test:verify` (`scripts/verify-tests.mjs` driven by `tests/unit/mutations.json`). Each entry comments out one block of route logic with `//`, runs that route's tests, and must be **KILLED**: at least one test fails on an assertion. A **SURVIVED** result (no test noticed) or an **INVALID** result (the file failed to load, so the failure isn't an assertion) fails the run. The source file is always restored byte-for-byte. The tool was self-checked against a known survivor (a `console.error`-only line) and a deliberate syntax break; both were reported correctly. If logic is added to a route, add a mutation entry for it. Side note: Stryker automates the same idea if this ever outgrows the hand-picked list.

Bugs are characterised, not fixed, in this phase. Tests assert current behaviour and are labelled with the bug ID, so the later fix shows up as a deliberate red, then green, test change.

Per route, at minimum: 401 when there's no session; the happy path calls the dependency with the exact arguments and maps the response; validation 400s; the dependency throwing gives a 500; and every best-effort branch (binding, playlist add) swallows its own failure.

- [x] `GET /api/health`
- [x] `GET /api/releases/latest`
- [x] `GET /api/streams/keys`
- [x] `GET /api/streams/[id]/streamkey` (found / 404 / 500)
- [x] `POST /api/streams/create` (title validation, time normalisation, autoStart/autoStop coercion, bind best-effort, playlists best-effort plus bad JSON in `playlistIds`)
- [x] `POST /api/streams/edit/[id]` (404 when not found, merge via `Stream`, bind, playlists)
- [x] `POST /api/streams/stop/[id]`
- [x] `DELETE /api/streams/delete/[id]`
- [x] `GET` / `POST /api/playlists`
- [x] `PUT` / `DELETE /api/playlists/[id]`
- [x] `GET` / `POST /api/playlists/[id]/items`
- [x] `DELETE /api/playlists/[id]/items/[itemId]`
- [x] `GET /api/playlists/membership` (missing videoId, partial failures through `allSettled`, the swallowed error returning `[]` with 200)
- [x] Pure lib units: `formatStreams`, `formatPlaylists`, `formatPlaylistItems`, `toLocalDatetime`, `toDatetimeLocalValue`, `parallelAsync`, the `Stream` merge class, the `jwt` callback (including refresh) and the `session` callback.
- [x] The `lib/youtube.ts` and `lib/playlists.ts` wrappers, with `googleapis` mocked: the exact request shape for every YouTube call.

**Status (2026-11-15):** 162 unit tests, **103/103 comment-out mutations killed**. `tsc`, `next lint` and `next build` are all clean. One equivalent mutant was found and deliberately excluded: in `membership`, the `.filter(r => r.status === 'fulfilled')` line has no observable effect, because the `.filter(Boolean)` after it already drops rejected results. It is a candidate for simplification in 1C.
- [ ] Server page data loaders for dashboard, streams and playlists (after 1C extracts them into testable functions).

### 1C. Introduce the service seam (refactor, no behaviour change)

- [x] Define a `YouTubeService` interface (streams, stream keys, playlists) in `lib/services/youtube/`.
- [x] `googleYouTubeService` wraps the current `googleapis` calls by delegating to the existing `lib/youtube` and `lib/playlists` wrappers.
- [ ] One shared googleapis client factory (fixes B9's duplication). Deferred: moving `getYoutubeClient` also moves its mutation entries.
- [x] The `getYouTubeService()` factory chooses the implementation from `TLC_YOUTUBE_MODE`. Unset, empty or `google` gives Google. `fake` throws until 1D. Any other value throws rather than falling back to Google.
- [x] Routes and server pages depend on the factory rather than importing functions directly. The unit tests mock it through `tests/unit/helpers/youtube-service.ts`, and no assertion changed.

**Status (2026-11-15):** 187 unit tests and **109/109 mutations killed** (the 103 existing, plus 6 for the factory). `tsc`, `next lint` and `next build` are clean.
- [ ] Move the SSR data-loading out of `page.tsx` into `lib/loaders/*` so it can be unit tested.

### 1D. Fake YouTube service (JSON fixtures, no DB)

- [x] `createFakeYouTubeService` (`lib/services/youtube/fake/`): in-memory state seeded from a JSON scenario (`fake/scenarios/mixed.json`: live, ready, created and complete broadcasts, stream keys, playlists and items). The scenarios sit under `lib/` rather than `tests/fixtures/`, because the app itself loads them in fake mode. Times are minute offsets from load time, so upcoming streams never go stale. Mutations change the in-memory state, so a Playwright flow sees its own writes. The store lives on `globalThis`, so separately bundled routes share it.
- [x] **Strict:** it enforces the YouTube Data API's documented rules and rejects with the same error shape as googleapis (`code`, `errors[0].reason`). Where the docs are silent, it uses a conservative assumption, marked `Undocumented (assumption)` in the code. See the decisions log. 51 mutation entries cover the rules.
- [ ] Named scenarios (for example `empty`, `one-live`, `upcoming-only`, `mixed`, `api-error`) selected per test.
- [ ] A test-only `POST /api/__test__/scenario` endpoint to reset or switch the scenario. It returns 404 unless `TLC_YOUTUBE_MODE=fake`.
- [ ] `instrumentation.ts` logs a loud warning when fake mode is on.

### 1E. Playwright E2E

- [ ] Auth without Google: in `globalSetup`, mint a next-auth session cookie with `encode()` from `next-auth/jwt` and the test `NEXTAUTH_SECRET`, then save it as `storageState`. This needs **no auth code changes in the app**.
- [ ] `webServer` runs `next build && next start` with `TLC_YOUTUBE_MODE=fake`.
- [ ] Scenarios to cover:
  - Live stream: featured on the dashboard, Stop button, then moves to completed.
  - Upcoming: create, edit, delete, plus bulk delete.
  - Completed: embed shown, no stop/edit controls.
  - Stream key reveal and copy.
  - Playlists CRUD and membership.
  - Empty states.
  - YouTube API error display (`ErrorDisplay`).
  - Expired-token redirect.

### 1F. CI gate

**Constraint: the self-hosted runner only, at zero cost.** No GitHub-hosted runners.

- [x] Add a test job that runs on `[self-hosted, Linux, X64]`. It is the Dockerfile `test` stage (lint, `tsc`, unit tests and `test:verify`), run with `docker build --target test .`. The runner host has Docker but no Node. `setup-node` would re-download Node into a non-persistent tool cache, and `container:` jobs or bind mounts break unless the runner workdir path is identical on the host. A build stage needs neither. Locally: `npm run test:docker`.
- [ ] Add E2E in fake mode to the test job (lands with 1E).
- [x] Make the deploy job `needs:` the test job, so `master` can't deploy red.
- [x] Run the same job on PRs (`tests.yml`), but **only for same-repo branches**. Guard it with `github.event.pull_request.head.repo.full_name == github.repository` and never use `pull_request_target`. This is a public repo, and a fork PR running on a self-hosted runner executes the contributor's code on your machine. GitHub's own docs warn against self-hosted runners on public repos for exactly this reason. The existing deploy workflow already guards against this.
- [ ] Playwright browsers in the runner container: install them once into the runner's persistent volume (or run E2E in the official Playwright Docker image) so each run doesn't re-download them.

## 4. Phase 2: UX/UI improvements (to discuss after Phase 1)

These are initial observations only. Scope gets agreed before any work starts.

### Dashboard
- Not yet scoped. Candidates:
  - A clear "what's happening now" hero: live status, viewers if available, a stop action.
  - The next scheduled stream with a countdown.
  - Recent completed streams.
  - Quick create.
- Should surface API and auth errors instead of silently rendering empty (B5).

### CRUD modal
- `Modal.tsx` lacks `role="dialog"`, `aria-modal`, `aria-labelledby`, a focus trap, focus restore on close, and body scroll lock.
- Create and Edit are separate components with overlapping fields. Consider one `StreamForm` with create/edit modes, inline validation and dirty-state protection (warn before discarding).
- The fixed `max-w-md` is cramped for the edit modal (stream key, playlists, toggles). Consider a wider layout with sections, or a side drawer.

### General UX/UI review
- `StreamsClient.tsx` is 914 lines and mixes data mutations, optimistic state, sorting, pagination and rendering. Split it up before adding features.
- Loading and skeleton states for SSR pages (`loading.tsx`).
- Consistent error surface (toast vs inline vs `ErrorDisplay`).
- Accessibility pass: keyboard navigation, contrast in dark mode, icon-only buttons needing labels.
- Mobile layout check for tables vs cards.

## 5. Decisions log

| Date | Decision | Why |
|---|---|---|
| 2026-11-15 | Own the seam (interface + fake) rather than MSW or Next `testmode` | Server-side mocking in Next 14 App Router is unreliable or experimental. An owned seam also gives fast unit tests. |
| 2026-11-15 | JSON fixtures with in-memory mutation, no DB | Requested; no maintenance burden. |
| 2026-11-15 | Mint the JWT cookie for E2E auth | Avoids adding a test-only credentials provider to production auth config. |
| 2026-11-15 | Characterisation tests before the refactor | Proves the 1C refactor changes no behaviour. |
| 2026-11-15 | CI runs only on the self-hosted runner | Zero recurring cost. Same-repo PRs only, never forks. |
| 2026-11-15 | Vitest 5, `@types/node` bumped `^20` → `^24` | Vitest 5's peer range needs it, and it now matches the declared `engines.node >= 24`. |
| 2026-11-15 | Comment-out verification automated via `npm run test:verify` | The same proof as commenting out by hand, but repeatable and reviewable in the PR. |
| 2026-11-15 | Commented-out code is never committed | Red state is verified by the tool and visible in its output. Committing disabled production code would break the branch. |
| 2026-11-15 | `getYouTubeService()` takes no token. Methods keep `(accessToken, …)`, and callers destructure them | Every route assertion and all 103 mutation anchors stay unchanged. A stateless service is simpler for the 1D fake. Implementations must not use `this`. |
| 2026-11-15 | An unknown `TLC_YOUTUBE_MODE` throws rather than defaulting to Google | A typo shouldn't silently send test traffic to the real API. |
| 2026-11-22 | "Start" in E2E means **create with auto-start on** | The app has no start action. YouTube goes live by itself when the encoder sends video to the bound key, which no test can drive. |
| 2026-11-22 | The fake is strict: documented rules, plus conservative assumptions where the docs are silent | E2E against a lenient fake would pass where YouTube rejects. The assumptions: a new broadcast starts `created`; binding moves it to `ready`; only `live`/`testing` can be stopped; on-air broadcasts can't be deleted; list filters map upcoming to created/ready, active to live/testing, completed to complete. Revisit any of these if real YouTube disagrees. |
| 2026-11-22 | E2E against the fake proves the app, not YouTube | The request shapes are pinned by the wrapper unit tests. Whether YouTube still accepts them needs an optional smoke test on a real test channel, which costs quota and isn't run per CI build. |
| 2026-11-15 | The lockfile is checked with the deploy image's npm (`npm run lockfile:check`, plus the Lockfile Check workflow on PRs) | The 1A/1B merge broke the deploy. Windows npm 11.6.2 skipped the Linux-only nested `@emnapi` entries, and `npm ci` in node:24-alpine (npm 11.19.1) rejected the lockfile. To regenerate: `npx npm@<image npm> install --package-lock-only`. |
