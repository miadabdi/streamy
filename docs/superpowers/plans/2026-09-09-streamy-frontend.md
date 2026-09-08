# Streamy Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `apps/web` — the Streamy frontend (React SPA) — from the Nocturne design package, in four milestones each ending in working, tested software.

**Architecture:** Nocturne's `styles.css` ports near-verbatim as the component/styling layer (tokens + shadcn alias block already inside it); shadcn/Radix are used headless for interaction machinery only. TanStack Query owns all server state including auth (`['me']` on `/user/me`) and status polling; react-router v7 with two layouts. Dev and prod both reach the API/storage same-origin via proxies (`/api`, `/storage`), which sidesteps cookie and HLS CORS entirely.

**Tech Stack:** React 19, Vite, TypeScript ~5.9, Tailwind CSS v4 (layout utilities only), shadcn/ui + Radix (headless), react-router v7, @tanstack/react-query v5, react-hook-form + zod, hls.js, Sonner, Phosphor icons, @fontsource (Archivo, JetBrains Mono). Tests: vitest (jsdom) + Testing Library + user-event + MSW.

**Spec:** `docs/design-prompt.md` (product/design brief) and `Nocturne/readme.md` (design-system usage rules — read both before starting).

## Global Constraints

- Repo: npm workspaces (`apps/*`, `packages/*`), GPL-3.0-only, conventional commits (commitlint enforced), husky + lint-staged runs prettier on `apps/**/*.{ts,js}` and `*.{json,md,yml}`.
- Prettier: tabs, width 100, singleQuote, trailingComma all (copy `apps/api/.prettierrc`). ESLint: mirror `apps/api`'s flat-config pattern + react-hooks plugin.
- Every app exposes `lint`, `build`, `test`, `verify` (= lint && build && test); root gains `verify:web`. CI (`.github/workflows/tests.yml`) matrix must gain `web`.
- Design honesty rules (from `Nocturne/readme.md`): never show unreleased videos outside studio; live shows elapsed time, never invented viewer counts; lists paginate with Load more, never page numbers; failures show raw ffmpeg logs; stream key is masked with reveal+copy and a "treat like a password" hint; thumbnail fallback is the normal state.
- API contract facts (verified): all routes `/api/v1/*`; auth = single JWT in httpOnly cookie `access_token` (sameSite strict, cookie-only — **no Bearer support**, so always `credentials: 'include'`); mutations return `{message}`; lists are plain arrays with `offset`/`limit`, no totals; `GET /video` **defaults `type=vod`** — live queries must pass `type=live` explicitly; comments arrive embedded in `GET /video/by-id` (no list endpoint); `video.duration` is never populated (omit the badge when null); playlist listing endpoint does not exist yet (Task M3-1 adds it).
- Video lifecycle enum: `ready_for_upload → ready_for_processing → waiting_in_queue → processing → done | failed_in_processing`, plus separate `isReleased` gating public visibility and `isActive` (false = live ended or soft-deleted). Live stream key = the video's `videoId`. Playback: `<storageBase>/hls/<videoId>/master.m3u8`.
- Ports (dev): API :3000, worker :3001, SeaweedFS S3 gateway :9002 (public buckets: `hls`, `videothumbnails`, `channelavatars`), rtmp :1935, mailpit :8025.
- No notification bell, chat, recommendations, analytics, OAuth buttons, or watch-history — the API has none of these. Do not design or build them.

---

## M0 — Scaffold, theme, shell

### Task 1: Workspace package + test harness + CI row

**Files:**
- Create: `apps/web/package.json`, `apps/web/tsconfig.json`, `apps/web/tsconfig.app.json`, `apps/web/tsconfig.node.json`, `apps/web/vite.config.ts`, `apps/web/index.html`, `apps/web/eslint.config.mjs`, `apps/web/.prettierrc`, `apps/web/src/main.tsx`, `apps/web/src/App.tsx`, `apps/web/src/index.css`, `apps/web/src/test/setup.ts`, `apps/web/src/test/server.ts`, `apps/web/src/test/render.tsx`, `apps/web/src/test/fixtures.ts`, `apps/web/src/smoke.test.tsx`
- Modify: root `package.json` (add `verify:web`), `.github/workflows/tests.yml` (matrix row)

**Interfaces:**
- Produces: `renderWithApp(ui, {route})` — wraps Router + QueryClient(`retry: false`, `gcTime: 5_000`) + Sonner; `fixtures.ts` with `makeVideo(overrides)` / `makeChannel(overrides)` / `makeUser(overrides)` builders (shapes per `apps/api/src/drizzle/schema.ts` — read it first).

- [ ] **Step 1:** Scaffold Vite react-ts into `apps/web` (`npm create vite@latest web -- --template react-ts` from `apps/`, then align tsconfigs with `apps/api`'s TS ~5.9). Add deps: `react-router`, `@tanstack/react-query`, `react-hook-form`, `zod`, `hls.js`, `sonner`, `@phosphor-icons/react`, `@fontsource/archivo`, `@fontsource/jetbrains-mono`; dev: `tailwindcss`, `@tailwindcss/vite`, `vitest`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `jsdom`, `msw`.
- [ ] **Step 2:** `vite.config.ts` — react plugin + tailwind vite plugin, dev proxies: `'/api' → 'http://localhost:3000'`, `'/storage' → 'http://localhost:9002'` (rewrite off), and `test: { environment: 'jsdom', setupFiles: 'src/test/setup.ts' }`.
- [ ] **Step 3:** Scripts mirror api: `"lint": "eslint src --ext .ts,.tsx"`, `"build": "tsc -b && vite build"`, `"test": "vitest run"`, `"verify": "npm run lint && npm run build && npm run test"`. Copy `.prettierrc` verbatim from `apps/api`.
- [ ] **Step 4:** Test harness: `server.ts` (msw `setupServer(...[])` composed from `src/test/handlers/index.ts`), `setup.ts` (jest-dom, server listen/reset per test), `render.tsx` helper, `fixtures.ts` builders.
- [ ] **Step 5:** Failing test first (`smoke.test.tsx`: renders `App` and finds the wordmark `STREAMY`), then minimal `App.tsx` + `index.css` (`@import 'tailwindcss';`) to pass.
- [ ] **Step 6:** Root `package.json` += `"verify:web": "npm run verify -w apps/web"`; `tests.yml` matrix `app: [api, worker, web]` — verify each existing step command works for web (lint / `tsc --noEmit -p apps/web/tsconfig.json` / test).
- [ ] **Step 7:** `npm run verify -w apps/web` green locally. Commit `feat(web): scaffold apps/web workspace with test harness and CI row`.

### Task 2: Nocturne port — styles, fonts, theme/density

**Files:**
- Create: `apps/web/src/styles/nocturne.css` (copy of `Nocturne/styles.css`), `apps/web/src/lib/theme.ts`
- Modify: `apps/web/src/index.css`, `apps/web/src/App.tsx`
- Test: `apps/web/src/lib/theme.test.ts`

**Interfaces:**
- Produces: `useTheme()` → `{ theme: 'dark'|'light', density: 'compact'|'roomy', setTheme, setDensity }` — sets `data-theme` on `<html>`, persists to localStorage, applies before first paint via an inline script in `index.html`.

- [ ] **Step 1:** Copy `Nocturne/styles.css` → `src/styles/nocturne.css`; delete its line-3 Google Fonts `@import`. In `index.css`: `@import 'tailwindcss'; @import './styles/nocturne.css';` + `@theme inline { --font-sans: var(--font-body); --font-mono: var(--font-mono); }` + fontsource imports in `main.tsx`. Nothing else — do not duplicate tokens into Tailwind theme.
- [ ] **Step 2:** Failing test: `theme.test.ts` asserts `setTheme('light')` puts `data-theme="light"` on `<html>` and round-trips from localStorage. Then implement `lib/theme.ts` (~20 lines). Pass.
- [ ] **Step 3:** Eyeball check: dev server renders dark ground `#0b0c0f`, Archivo text; toggling works. Commit `feat(web): port Nocturne design system css with theme and density control`.

### Task 3: Domain icons + wordmark

**Files:**
- Create: `apps/web/src/components/icons/index.tsx` (20 icons: play, live, vod, upload, release, queue, processing, encoder, storage, stream key, elapsed, subtitle, quality, tag, channel, views, like, copy, ok, failed), `apps/web/src/components/Wordmark.tsx`
- Test: `apps/web/src/components/icons/icons.test.tsx`

- [ ] **Step 1:** Extract the inline SVGs from `Nocturne/foundations/brand.html` into React components (24px grid, `currentColor`, 1.75px stroke, square joins; only `play` filled). `Wordmark` = `STREAMY` mono 700 0.26em tracking + accent dot via the `.wordmark` class.
- [ ] **Step 2:** Test: every icon renders an `<svg>` accepting `className`; wordmark contains "STREAMY". Pass, commit `feat(web): add Nocturne domain icon set and wordmark`.

### Task 4: App shell + stubbed routes

**Files:**
- Create: `apps/web/src/routes/root.tsx`, `apps/web/src/routes/watch-layout.tsx`, one stub file per route under `apps/web/src/routes/` (`auth/SignIn|SignUp|ForgotPassword|ResetPassword`, `Browse`, `Search`, `Watch`, `Channel`, `studio/MyVideos|Upload|VideoEdit|GoLive`, `Playlists`, `Settings`, `Ops`, `NotFound`), `apps/web/src/lib/router.tsx`
- Test: `apps/web/src/routes/root.test.tsx`

**Interfaces:**
- Produces: `createBrowserRouter` config exported from `lib/router.tsx`; `RootLayout` renders `.app` / `.app-side` (212px sticky sidenav: wordmark, navlinks, current-channel block) / `.topbar` / `<Outlet/>`; `WatchLayout` drops the sidebar, 1020px centered column. Viewer routes wrap content in `data-density="roomy"`. Stub `useMe` returns a fixture user until Task M1-2.

- [ ] **Step 1:** Failing test: rendering `/` shows sidenav nav links (Home, Search, Studio, Playlists, Settings, Ops) and the fixture current-channel block; `/watch/:id` shows no sidenav.
- [ ] **Step 2:** Convert the chrome markup from any template's shell (e.g. `Nocturne/templates/home-browse/HomeBrowse.dc.html` — strip `x-dc`/`helmet`/`sc-if` wrappers, `class`→`className`) into `root.tsx`/`watch-layout.tsx`; register all routes as stubs. Pass.
- [ ] **Step 3:** `npm run verify -w apps/web` green. Commit `feat(web): app shell with sidenav, topbar, and stubbed routes`.

**M0 exit:** verify green; `/` looks pixel-close to the home-browse template with fixture data; CI web row passes.

---

## M1 — Viewer loop

### Task 5: API client + error normalization + 401 handling

**Files:** Create `apps/web/src/lib/api.ts`, `apps/web/src/types/api.ts`; Test `apps/web/src/lib/api.test.ts`.

**Interfaces:** Produces `api.get<T>(path, opts?) / api.post / api.patch / api.del` (relative `/api/v1/...`, `credentials: 'include'`, JSON, throws `ApiError {status, message}`); `types/api.ts` exports `Video`, `Channel`, `User`, `Comment`, `Playlist`, `Subtitle`, `Tag`, `VideoProcessingStatus`, `VideoType`, `isPending(status)` (= the four pre-terminal states). On 401 (any call except `GET /user/me`): `queryClient.setQueryData(['me'], null)`.

- [ ] Steps (TDD): tests for (a) JSON success, (b) `{message}` error → `ApiError`, (c) 401 sets `['me']` null and does not throw raw — against MSW handlers in `src/test/handlers/`. Implement ~60 lines, no axios. Commit `feat(web): api client with cookie auth and 401 handling`.

### Task 6: Auth — useMe, mutations, guards, 4 screens

**Files:** Create `src/lib/query.ts` (defaults: staleTime 30_000, retry 1), `src/lib/auth.ts` (`useMe()`, `useSignIn/SignUp/SignOut/ForgotPassword/ResetPassword`), `src/routes/RequireAuth.tsx`; screens from `Nocturne/templates/auth/Auth.dc.html` (4 `screen` prop states → 4 components with rhf+zod). Tests per screen.

- [ ] Behaviors: signup form includes first-channel fields (`username` 8–128 w/ regex, `name` 3–50, `description` 8–1024) matching DTOs in `apps/api/src/auth/dto/`; signin/signup invalidate `['me']`; signout clears query cache entirely; `RequireAuth` gates authenticated routes (loading → spinner shell, anonymous → `<Navigate to="/signin" state={{next}}>`);
reset screen reads `token` from URL. Tests: 4 screens render + validation errors + signin transition flips `['me']`. Commit `feat(web): auth flow with channel-creating signup`.

### Task 7: Browse + search

**Files:** Create `src/hooks/useVideos.ts` (`useInfiniteQuery`, offset += limit, Load more button), `src/components/VideoCard.tsx`, `VideoGrid.tsx`, `Thumb.tsx` (oklch gradient seeded from `videoId` hash + channel initials fallback), `LoadMore.tsx`; screens `Browse.tsx`, `Search.tsx` (debounced `useDebounced`). Tests for both.

- [ ] Behaviors: filter row all/live/subscribed (`type=live` explicit for the live strip; `onlySubbed` requires auth); cards show thumbnail-or-fallback, name, channel, views, likes; no duration badge when null; search hits `/video/search?text=` with no-results empty state. Commit `feat(web): browse and search with infinite load-more`.

### Task 8: Player — hls.js core, quality, subtitles, keyboard, live modes

**Files:** Create `src/components/player/VideoPlayer.tsx`, `menus.tsx`, `keyboard.ts`, `src/lib/env.ts` (`storageBase()` → `/storage`). Tests with `vi.mock('hls.js')`.

- [ ] Behaviors: URL `` `${storageBase()}/hls/${videoId}/master.m3u8` ``; Safari native HLS else hls.js (destroy on unmount, StrictMode-safe); quality menu from `hls.levels` (`${height}p` + bitrate + Auto → `currentLevel = -1`) in Nocturne `.menu` markup inside Radix DropdownMenu; subtitle tracks from `GET /subtitle/by-video-id` as native `<track>`s merged with `hls.subtitleTracks` deduped by language; modes vod (scrub) / live (no scrub, elapsed counter, jump-to-live via `liveSyncPosition`) / replay (vod + ended notice); keyboard map space/k, ←→ ±5s, jl ±10s, ↑↓ volume, m, f, c, 0–9, q; visually-hidden live region. Tests: levels → menu items, keyboard events drive mocked player, mode switching. Commit `feat(web): hls player with quality, subtitles, keyboard control`.

### Task 9: Watch page

**Files:** Create/expand `src/routes/Watch.tsx`, `src/components/CommentThread.tsx`. Tests.

- [ ] Behaviors: `useVideo(id)` polls 5s while `isPending` (`refetchInterval` as function); like/dislike (`aria-pressed`, counts, optimistic); subscribe to channel; tags; description show-more; comments threaded from embedded array (`replyTo` nesting, reply, edit own with `isEdited` chip — mutations invalidate `['video', id]`); watched beacon `POST /video/watched` once past 30s. Commit `feat(web): watch page with player, engagement, and comments`.

### Task 10: Channel page

**Files:** Create `src/routes/Channel.tsx` (+ reuse Task 7 grid). Test.

- [ ] Behaviors: fetch by username; avatar with initials fallback; subscriber count; subscribe/unsubscribe; video grid with load-more. Commit `feat(web): channel page`.

**M1 exit (manual):** against dev compose — anonymous browse → signup → watch → comment → subscribe all work.

---

## M2 — Studio

### Task 11: My videos table

**Files:** Create `src/routes/studio/MyVideos.tsx`, `src/components/StatusPill.tsx`, `LogDrawer.tsx`. Tests (pill per all 6 statuses + released).

- [ ] Behaviors: `GET /video/my-channels` (incl. unreleased — studio only); lifecycle pills; release action on `done`; failed rows open `.log` drawer rendering raw `ffmpegProcessLogs` (`.err`/`.dim` highlighting); 10s conditional polling while any row `isPending`. Commit `feat(web): studio my-videos table with lifecycle polling`.

### Task 12: Upload wizard (state machine)

**Files:** Create `src/routes/studio/Upload.tsx`, `src/components/upload/Dropzone.tsx`, `progress.tsx`, `src/lib/upload.ts`. Tests: happy path + 404 + 400 paths (MSW one-shot handlers).

- [ ] Behaviors: machine `idle → creating → uploading → confirming → queueing → done | error`; sequence `POST /video` → `GET /video/get-presigned-put-url` → **XHR PUT to the absolute presigned URL** (progress via `xhr.upload.onprogress`; bypasses `api.ts` — no credentials/JSON) → `POST /video/confirm-upload` (404 ⇒ "file not in storage yet" designed error state) → `POST /video/send-video-to-process-queue` (400 ⇒ "not confirmed") → navigate to my-videos. 1h expiry hint. Wizard state is component-local; recovery = `ready_for_upload` rows in my-videos (say so in the empty state). Commit `feat(web): upload wizard with presigned direct-to-storage upload`.

### Task 13: Video edit

**Files:** Create `src/routes/studio/VideoEdit.tsx` (+ tag picker, subtitle manager). Tests.

- [ ] Behaviors: metadata patch; tags (list from `/tag`, add-to-video; create/delete only if admin); thumbnail `PATCH /video/set-thumbnail` (multipart, resized server-side 1280×720); subtitles list/upload (`POST /subtitle` multipart + RFC5646 picker from `/subtitle/by-language-rfc5646/:identifier`)/delete; soft delete behind confirm dialog. Commit `feat(web): video edit with thumbnail, tags, subtitles`.

### Task 14: Go live

**Files:** Create `src/routes/studio/GoLive.tsx`, `src/components/SecretField.tsx`. Tests.

- [ ] Behaviors: create `type: 'live'` → show RTMP URL (`rtmp://<host from env>/1935 path`: `rtmp://<rtmpHost>/live/<videoId>`) + masked key with reveal/copy/password hint; poll `/video/live-by-video-id` 15s (public endpoint) for waiting → live → ended; embedded `VideoPlayer` self-monitor; elapsed time display (never viewer counts); ended state links to replay. Commit `feat(web): go-live wizard with stream key and live polling`.

**M2 exit (manual):** upload a real file via dev compose → row progresses to `done` → release → appears in browse.

---

## M3 — Long tail + production

### Task 15: Backend — playlist by-channel route

**Files:** Modify `apps/api/src/playlist/playlist.controller.ts` (+ DTO; service method `getPlaylistsOfChannel` already exists at `playlist.service.ts:201`). Test in api's vitest suite.

- [ ] `@Get('/by-channel')` with `channelId` query → run `npm run verify -w apps/api`. Commit `feat(api): playlist listing by channel`.

### Task 16: Playlists screens

**Files:** `src/routes/Playlists.tsx` (+ detail/edit view). Tests. — List via new by-channel route; system playlists (likes/dislikes/watched) surfaced read-only; CRUD + add-videos + privacy toggle. Commit `feat(web): playlists`.

### Task 17: Settings

**Files:** `src/routes/Settings.tsx`. Tests. — Profile update; channel create/edit (avatar upload); current-channel switcher (mutation invalidates `['me']` + channel-scoped keys); sign out. Commit `feat(web): settings`.

### Task 18: Ops console

**Files:** `src/routes/Ops.tsx`, `src/components/StatTile.tsx`, `src/hooks/useOpsHealth.ts`. Tests. — Readiness poll 30s (`GET :3001/api/v1/health/readiness` via `/api` proxy — note: worker is a separate origin/port; add a dev proxy `/worker-api → :3001` and route through `env.ts`); `.stat` tiles (rmq, storage, deadLetters, encoder hw-good/sw-fallback, activeJob with elapsed); tags admin + user promotion behind `RequireAdmin`. Commit `feat(web): ops console`.

### Task 19: Backend — CORS origins

**Files:** Modify `apps/api/src/main.ts` + `.env.example` (`CORS_ORIGINS` comma list, `credentials: true`). — Dev/prod are same-origin via proxies; this is defense for split deployments. `npm run verify -w apps/api`. Commit `feat(api): env-based cors origins`.

### Task 20: Production — Dockerfile, nginx, compose

**Files:** Create `apps/web/Dockerfile` (node build stage → nginx), `nginx.conf`, `entrypoint.sh`, `env.js.template`; Modify `docker-compose-prod.yml` (web service), `.github/workflows/tests.yml` (docker job builds web image).

- [ ] nginx: SPA `try_files … /index.html`; `/api/ → app:3000`; `/storage/ → seaweedfs:8333`; long `proxy_read_timeout` on `/api`. Entrypoint `envsubst` → `/env.js` (`window.__ENV__`), loaded before the bundle; `env.ts` prefers `window.__ENV__` with `VITE_*` fallbacks. Compose `web` service on the `local` network. Commit `feat(web): production image with nginx and runtime env injection`.

### Task 21: Hardening

**Files:** `src/routes/NotFound.tsx`, `src/routes/Error.tsx`, skeleton components, responsive breakpoints. Tests for error pages.

- [ ] 404/500 pages; surface-tinted loading skeletons (not shadcn defaults); responsive: sidenav → topbar drawer <1024px, single-column grids, stacked studio tables, full-width player; focus-order audit; `prefers-reduced-motion` spot-check. Commit `feat(web): error pages, skeletons, responsive layout`.

**M3 exit:** prod compose brings up web+api+worker+storage; full creator+viewer+ops flow on one host.

---

## Risks (read before starting a milestone)

1. Prod cookies work by topology (same-origin nginx); ports don't affect same-site status. Don't add CORS complexity.
2. Never build absolute `:9002` URLs — always `storageBase()`; the presigned PUT is the only absolute-URL exception.
3. Tailwind v4 + shadcn: nocturne.css imports AFTER tailwindcss; no `dark:` utilities (theme is `data-theme`); decline shadcn init's index.css theme write.
4. `GET /video` defaults `type=vod` — live content vanishes silently without explicit `type=live`.
5. MSW tests: `retry: false` + short `gcTime`, or handler misses look like hangs; storage PUT handler matches the absolute presigned URL.
6. StrictMode double-mount vs hls.js — cleanup + ref guard. Polling lives in query options, never component `setInterval`.
7. DC templates: strip every `sc-if`/`{{ }}`/`DCLogic` artifact or rendering breaks.

## Verification

- Per task: its test file, `npm run verify -w apps/web`.
- M1/M2 exits: manual flows against dev compose (`docker compose -f docker-compose-dev.yml up -d --build`, mailpit :8025 for reset emails).
- M3 exit: prod compose smoke.
