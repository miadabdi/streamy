# Streamy design system

Streamy is a self-hosted video platform, and this is the system its app is built from: a cinematic near-black ground, Archivo for text, JetBrains Mono for anything a machine produced — IDs, stream keys, counters, ffmpeg output — and one red-orange accent that only ever means *attention here, now*. The chrome recedes so thumbnails and video carry the page. It is an operator's tool and a small audience's player, not a growth product: no marketing surfaces, no aspirational UI, nothing that claims data the API does not return.

## How to use this

- Link the one stylesheet from every page — `<link rel="stylesheet" href="styles.css">` (adjust the relative path) — and take every color, font, spacing, radius and shadow from its variables (`var(--color-*)`, `var(--font-*)`, `var(--space-*)`, `var(--radius-*)`, `var(--shadow-*)`). Never hard-code a hex, a font name or a px value the tokens already carry.
- In React, consume the **shadcn/ui aliases** instead: `styles.css` maps `--background`, `--foreground`, `--card`, `--popover`, `--primary`, `--secondary`, `--muted(-foreground)`, `--accent`, `--destructive`, `--success`, `--warning`, `--border`, `--input`, `--ring`, `--radius`, `--font-sans`, `--font-mono` onto the tokens above, so shadcn components inherit the theme with no per-component overrides.
- The component pages are plain HTML — view source and copy the markup.
- `templates/` holds starting points a consuming project can copy whole.
- To change the look, edit the tokens at the top of `styles.css` — every page, the thumbnail and this guide read from them — and keep `theme.json` and this file in step.

## Themes

Dark is the default and the designed case. A light theme is derived from the same token names under `[data-theme="light"]` on `<html>`; the accent darkens to `#d1341c` there to hold AA on a light ground. Both themes set `color-scheme`, so form controls and scrollbars follow.

## Density

Two settings, one variable. `--density: 0.7` is the default — studio tables, ops tiles, forms, anything an operator scans. Put `data-density="roomy"` on a viewer region (browse, watch, channel pages) to move it to `1`; the whole `--space-*` scale scales with it. Don't hand-tune paddings per screen.

## Color

Ground: `--color-bg` #0b0c0f, `--color-surface` #14161a for cards and inputs, `--color-raised` #1c1f24 for menus, drawers and hovered rows. Only three grounds — deeper stacking is a shadow, not a fourth color. Text is `--color-text` #e8e9ec (15.5:1) with `--color-muted` #a3a7b2 (7.4:1) for secondary copy, both safe for body sizes.

The accent is `--color-accent` #ff4a32 at 5.8:1 on the ground — enough for text, not just chrome. It is the live state, the primary action, the focus ring, and failure. That is deliberate: all four mean the same thing to the person looking at the screen. Nothing decorative takes the accent except the dot in the wordmark.

Green (`--color-ok`) and amber (`--color-warn`) are health colors only: green says a thing worked, amber says a machine is working or waiting. Neutrals carry everything else. Each role has a 100–900 ramp on one shared lightness scale; on this dark ground use 700–900 for tinted fills and hairlines, 500 as the base, 100–300 for text on those tints.

## Type

Archivo throughout — 600 for headings (tight, broad, slightly compressed), 400/500 for text. JetBrains Mono is not decorative: it marks machine-authored strings, so video IDs, stream keys, timecodes, view counts, status pills, log output and section kickers are all mono. If a human wrote it, it is Archivo.

## Wordmark & icons

`STREAMY` in JetBrains Mono 700, all caps, 0.26em tracking, closed by an accent dot — a rack label, not a logotype. Use the `.wordmark` class (`.wordmark-sm` in chrome); the dot comes from `::after`. The domain icon set (play, live, vod, upload, release, queue, processing, encoder, storage, stream key, elapsed, subtitle, quality, tag, channel, views, like, copy, ok, failed) is drawn on a 24px grid with 1.75px strokes and square joins; Phosphor covers everything outside that vocabulary. See `foundations/brand.html`.

## Vocabulary

Use the product's words exactly: **channel** (the identity unit; a user owns several and has a *current channel*), **video** of type `vod` or `live`, the lifecycle `ready_for_upload → ready_for_processing → waiting_in_queue → processing → done | failed_in_processing`, **release** as the separate act that makes a `done` video public, **playlist** (custom, plus the hidden system playlists likes/dislikes/watched), **tag**, **subtitle**, **comment**. Never say "publish" where the API says release, and never show an unreleased video outside the studio.

## Honesty rules

- A live video's ID doubles as its stream key. Mask it (`.secret[data-masked="true"]`), offer reveal and copy, and say it should be treated like a password.
- Concurrent viewer counts do not exist in the API. Live surfaces show elapsed time instead of inventing a number.
- Lists come back as plain arrays with `offset`/`limit` and no totals, so pagination is a **Load more** button — never numbered pages or "page 3 of 12".
- Failures show raw ffmpeg output in the log drawer, unedited.
- Thumbnails are an optional upload, so the derived fallback is the normal state, not an error.

## Interaction states

Every interactive element gets a themed hover and pressed state (`--color-raised`, or one ramp step past the accent for filled buttons), and keyboard focus is always `outline: 2px solid var(--color-accent); outline-offset: 2px` via `:focus-visible` — including the player, which must be fully operable from the keyboard. Disabled controls drop to 40% opacity. `::selection` is an accent tint. Don't restyle these per page.

## Components

| Class | What it is | Shown in |
| --- | --- | --- |
| `.vcard` (+ `.vcard-list`), `.vcard-thumb`, `.vcard-fallback`, `.vcard-dur`, `.vcard-flag`, `.vcard-title/-channel/-meta`, `.vgrid` | Video card in grid, list and live form, with the derived thumbnail fallback | components/video.html |
| `.pill` with `.pill-upload/-queue/-processing/-done/-released/-failed/-live` | The lifecycle status set plus the two publication states | components/video.html |
| `.avatar` (+ `.avatar-sm`, `.avatar-lg`) | Channel avatar with the monospace initials fallback | components/video.html |
| `.tag` with `.tag-accent`, `.tag-outline` | Tag chips | components/video.html |
| `.stat` with `.stat-ok`, `.stat-bad`, `.stat-flag-hw/-sw` | Ops health tiles — hardware encoding reads good, software reads fallback | components/ops.html |
| `.secret` + `[data-masked]` | The masked stream key with reveal and copy | components/ops.html |
| `.log` (`.err`, `.dim`) | The monospace ffmpeg log drawer | components/ops.html |
| `.steps`, `.dropzone`, `.progress` | The upload/go-live wizard parts | components/ops.html |
| `.empty`, `.empty-mark` | Empty-state frame — always carries the one action that matters | components/ops.html |
| `.toast` with `.toast-ok`, `.toast-err` | Mutation feedback | components/ops.html |
| `.player`, `.player-bar`, `.player-scrub`, `.player-time`, `.player-btn`, `.menu` + `.menu-item` | Player shell and the quality / subtitle menus | foundations/media.html |
| `.topbar`, `.wordmark`, `.navlinks`, `.sidenav` + `.sidenav-head`, `.tabs` | App chrome | components/navigation.html |
| `.searchbar`, `.filterrow`, `.seg` + `.seg-opt`, `.switch` | Search, the filter row and choices | components/forms.html |
| `.field` + `.input`, `.field-hint`, `.field-error`, `.radio` | Form fields and validation states | components/forms.html |
| `.btn` with `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-danger`, `.btn-icon`, `.btn-sm`, `.btn-block` | Actions — one solid accent primary per view | components/buttons.html |
| `.card`, `.table`, `.dialog`, `.comment*`, `.elev-sm/md/lg`, `.hr` | Surfaces, studio tables, dialogs, comment threads, elevation | components/cards.html, table.html, dialog.html |

## Do

- One solid accent action per view. Everything else is outlined or ghost.
- Mono for machine strings, Archivo for human ones.
- Let empty states say what to do next, in one button.
- Keep the three grounds; add depth with `--shadow-*`, not new fills.

## Don't

- Don't flood areas with the accent — a fill that large stops meaning "attention".
- Don't give live its own second color; live *is* the accent.
- Don't tint avatars per channel or invent per-channel brand colors.
- Don't use pure black or pure white; the ramps and the player ground cover both ends.
- Don't design features the API doesn't have: no notification bell, no chat, no recommendations, no analytics charts, no OAuth buttons, no watch-history page.

## Files

- `styles.css` — the only stylesheet: tokens, shadcn aliases, then the component layer.
- `readme.md` — this guide. `theme.json` — the machine-readable record. `theme.html` — the same parameters as a page.
- `thumbnail.html` — the project cover.
- `foundations/brand.html` — wordmark and the domain icon set.
- `foundations/color.html` — roles, ramps and the accent's meaning.
- `foundations/type.html` — the type scale and the Archivo / JetBrains Mono split.
- `foundations/layout.html` — spacing, grid and elevation.
- `foundations/media.html` — thumbnails, avatars, the player surface.
- `foundations/icons.html` — the Phosphor set for everything outside the domain vocabulary.
- `components/video.html` — video cards, status pills, avatars, tags.
- `components/ops.html` — health tiles, stream key, log drawer, wizard parts, empty states, toasts.
- `components/buttons.html`, `forms.html`, `cards.html`, `navigation.html`, `table.html`, `dialog.html` — the shadcn-aligned basics.
## Templates

Eleven starting points, one folder each; every one loads the system through its own `ds-base.js`, so a consuming project changes one line to repoint it.

| Folder | Screen | Tweaks |
| --- | --- | --- |
| `templates/auth/` | Sign in, sign up (creates the first channel), forgot password, reset password | screen |
| `templates/home-browse/` | Home / Browse grid with all/live/subscribed filters and load-more | state, showSidebar, showLiveStrip |
| `templates/search/` | Search results and the no-results state | state |
| `templates/watch/` | Watch — player, quality/subtitle menus, like/dislike, subscribe, tags, threaded comments | mode (vod/live/replay), showQualityMenu |
| `templates/channel/` | Channel page — avatar, description, subscriber count, video grid | state |
| `templates/my-videos/` | Studio table with lifecycle pills, release action, ffmpeg log drawer | state, showLogDrawer |
| `templates/upload/` | Upload wizard, four steps, with the 404 and 400 error paths | step, errorPath |
| `templates/video-edit/` | Video edit — metadata, tags, thumbnail, subtitles, soft delete | showDeleteDialog |
| `templates/go-live/` | Go live — create, RTMP + masked key, waiting, live, ended-with-replay | stage, revealKey |
| `templates/playlists/` | Playlists list, edit view, system playlists | view |
| `templates/settings/` | Profile, channel management, current-channel switch, sign out | — |
| `templates/ops/` | Ops console — worker health, dead letters, tags, admin promotion | state, encoder |

## App shell

Screens share four classes rather than re-inventing chrome: `.app` (page row), `.app-side` (the sticky 212px nav column, internally scrolled), `.app-col` (content column), `.app-page` (padded content stack), plus `.app-brand`, `.app-channel` (the current-channel block), `.page-head` and `.page-sub`. Viewer pages add `data-density="roomy"` on `.app-page`; studio and ops leave it dense. Watch drops the side column entirely — the player owns the width.
