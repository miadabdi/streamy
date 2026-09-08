# Streamy — design system brief

## What Streamy is

Streamy is a self-hosted video platform — think "my own private YouTube/Twitch". One operator runs it for themselves and a small group via docker compose. Upload videos, transcode to HLS, watch in the browser; go live from OBS; search; subscribe to channels; comment. The design voice is **utilitarian and calm**: this is an operator's tool and a small audience's cozy player, not a growth-hacked consumer product. No marketing site — app only.

## Visual direction

- **Dark-first, video-forward.** The chrome recedes; thumbnails and video dominate. Cinematic near-black surfaces, quiet borders, one confident accent color (you propose it) used sparingly: live states, primary actions, focus.
- Distinctive, not a template: avoid the generic Bootstrap/Tailwind demo look. Propose a simple **wordmark** for "Streamy" (no logo exists) and a small icon-language for video/live/ops concepts.
- Define tokens as CSS variables compatible with **shadcn/ui + Tailwind** (the FE will be React + shadcn). Include a secondary light theme derived from the same token names.
- WCAG AA contrast on dark, visible focus rings, full keyboard navigation (including the player).

## Core concepts (use this exact vocabulary)

- **Channel** — the identity unit. A user account owns multiple channels and switches between them (a "current channel" concept). Signup creates the first channel.
- **Video** — two types: `vod` (upload) and `live`. A live video's ID doubles as its **stream key** (secret — copy, don't display plainly).
- **Video lifecycle**: `ready_for_upload → ready_for_processing → waiting_in_queue → processing → done | failed_in_processing`. `done` is not public: a separate **Release** action publishes it. Failures carry raw ffmpeg logs.
- **Live lifecycle**: created → `processing` while broadcasting → ended (`done`); the same URL then serves the replay.
- **Playlist** — custom (private/public) plus hidden system playlists: likes, dislikes, watched.
- **Tag**, **Subtitle** (language-tagged, RFC 5646), threaded **Comment** (editable, shows "edited").

## Screens to design (full surface)

### Auth (4)

- **Sign in** — email + password. **Sign up** — email, password, _plus first-channel fields: channel username, display name, description_ (they're part of signup).
- **Forgot password** — email only. **Reset password** — email + new password + token (arrives by email link).

### Viewer (4)

- **Home / Browse** — grid of released video cards: thumbnail, name, channel + avatar, views, likes. Filters: all / live / subscribed-only. Pagination is "load more" (API returns plain lists, no page totals — design accordingly).
- **Search results** — same grid; fuzzy text search over name + description.
- **Watch** — the centerpiece. HLS player (hls.js) with quality menu (1080p/720p/360p auto-variants) and subtitle track menu; like/dislike; subscribe to channel; view count; tags; threaded comments below (reply, edit, "edited" badge). If the video is live: LIVE badge, viewer count nuance not available — keep it honest. Video card thumbnails are **optional user uploads** — design a graceful fallback (derived gradient/initials) since missing thumbnails are the common case.
- **Channel page** — avatar (400×400), description, subscriber count, subscribe button, video grid.

### Creator studio (5)

- **My videos** — per-channel table/grid incl. unreleased; status pill per lifecycle state; release action on `done`; "failed" opens a monospace **ffmpeg log drawer**; soft-deleted hidden.
- **Upload wizard** — stepped, mirroring the real flow: (1) metadata (name, description, tags, channel), (2) drop file → direct-to-storage presigned upload with progress, (3) confirm, (4) queue for processing → live status updates. Real error paths to design: confirm-before-upload-finished (404), queue-before-confirm (400).
- **Video edit** — metadata, tags, thumbnail upload (becomes 1280×720), subtitle upload per language, delete (soft).
- **Go live** — wizard: create live video → show **RTMP URL + stream key** (key masked, reveal + copy buttons, "treat it like a password" hint) → "waiting for your stream" state → live → ended-with-replay state.
- **Playlists** — list, create/edit, add videos, privacy toggle.

### Settings (1)

- Profile (first/last name), channel management (create, edit avatar, **switch current channel**), sign out.

### Ops console (1) — the self-hosted page

- Worker health tiles from the readiness API: message queue ✓/✗, storage ✓/✗, dead-letter count, **encoder** (hardware vaapi/nvenc/qsv vs software libx264 — make hardware feel "good", software visibly "fallback"), active job (video ID + elapsed time). Tag management (create/delete). Promote user to admin by email. Calm, dashboard-y, honest-empty.

### System-wide

- Empty states everywhere (a fresh self-hosted instance is mostly empty — make empties feel inviting, with the one action that matters: "upload your first video").
- Toasts for mutations; confirmation dialogs for destructive actions; form validation states (channel username has format rules — show them).

## Component inventory (shadcn-aligned)

Video card (grid / list / live variants) · status pill set (5 lifecycle + live + released) · player shell with quality + subtitle menus · upload dropzone with progress · stepped wizard · comment thread item · channel card · tag chip · search bar with filter row · studio table · monospace log drawer · health stat tile · avatar with initials fallback · copy-to-clipboard secret field (masked) · empty-state frames · toast · dialog · tabs · form field with validation.

## Do NOT design (features that don't exist — no aspirational UI)

- No notification bell, no live chat, no recommendations/trending rail, no watch-history page, no analytics charts, no mobile app frames (responsive web only), no marketing landing page, no OAuth buttons.
