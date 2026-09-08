repo: miadabdi/streamy
branch: main
path: apps/api/src

## Last sync

date: 2026-09-08T19:20:00Z

### Updated in this project

- Rebranded the design system from Nocturne to Streamy: near-black grounds, #ff4a32 accent, Archivo + JetBrains Mono, shadcn/ui variable aliases and a derived light theme.
- Added the Streamy component layer — video cards with derived thumbnail fallback, the seven status pills, ops health tiles, masked stream key, ffmpeg log drawer, wizard parts, empty states, toasts.
- Added the STREAMY wordmark and a 24px geometric icon set for video, live and ops concepts.
- Built all 15 screens as 11 copyable templates: auth (4 states), browse, search, watch, channel, my videos, upload wizard, video edit, go live, playlists, settings, ops console.
- Added the shared app shell (.app / .app-side / .app-col / .app-page) so every screen uses one chrome.

## Screen map

| Screen / file | Built from |
| --- | --- |
| templates/auth/Auth.dc.html | apps/api/src/drizzle/schema.ts (users, channels), apps/api/src/channel/dto/create-channel.dto.ts |
| templates/home-browse/HomeBrowse.dc.html | apps/api/src/video/dto/get-videos.ts, apps/api/src/drizzle/schema.ts |
| templates/search/Search.dc.html | apps/api/src/video/dto/search-videos.dto.ts, apps/api/src/search/video-search.service.ts |
| templates/watch/Watch.dc.html | apps/api/src/drizzle/schema.ts (videos, comments, subtitles), apps/api/src/video/dto/like-dislike-video.dto.ts |
| templates/channel/Channel.dc.html | apps/api/src/drizzle/schema.ts (channels, subscriptions) |
| templates/my-videos/MyVideos.dc.html | apps/api/src/drizzle/schema.ts (videoProccessingStatus, isReleased, ffmpegProcessLogs) |
| templates/upload/Upload.dc.html | apps/api/src/video/dto/get-video-presigned-put-url.dto.ts, confirm-upload.dto.ts, send-video-to-process-video.dto.ts |
| templates/video-edit/VideoEdit.dc.html | apps/api/src/video/dto/update-video.dto.ts, set-video-thumbnail.dto.ts, apps/api/src/subtitle |
| templates/go-live/GoLive.dc.html | apps/api/src/video/dto/get-live-by-video-id.dto.ts, docker/srs/srs.conf |
| templates/playlists/Playlists.dc.html | apps/api/src/drizzle/schema.ts (playlists, playlistType, playlistPrivacy) |
| templates/settings/Settings.dc.html | apps/api/src/user/dto/set-current-channel.dto.ts, apps/api/src/channel/dto |
| templates/ops/Ops.dc.html | apps/worker (readiness/health), apps/api/src/tag, apps/api/src/drizzle/schema.ts (users.isAdmin) |

## Earlier screen map

| Screen / file | Built from |
| --- | --- |
| templates/home-browse/HomeBrowse.dc.html | apps/api/src/video/dto/get-videos.ts, apps/api/src/drizzle/schema.ts (videos, channels) |
| components/video.html | apps/api/src/drizzle/schema.ts (videoProccessingStatus, videoType, videos, channels) |
| components/ops.html | apps/api/src/drizzle/schema.ts (videos.ffmpegProcessLogs), worker readiness surface (apps/worker) |
| readme.md (vocabulary, honesty rules) | apps/api/src/drizzle/schema.ts, apps/api/src/video/dto/*.ts, apps/api/src/video/dto/search-videos.dto.ts |
