# Streamy Monorepo

A self-hosted video platform: **`apps/api`** (NestJS — users, channels, uploads, search, the SRS
hooks), **`apps/worker`** (ffmpeg process node — VOD transcoding to HLS, live stream re-serving
with hardware encoding) and **`packages/queues`** (`@miadabdi/streamy-queues` — the queue names
and message shapes both apps compile against).

![streamy architecture](Streamy.drawio.png)

```
rtmp ──> srs ──on_publish──> api ──q.video/live.process──> worker ──ffmpeg──> hls bucket
                                  ^                                        │
                                  └────────q.set.video.status──────────────┘
             postgres (drizzle) · rabbitmq · seaweedfs s3 · elasticsearch
```

## Layout

| Path                                   | What                                             |
| -------------------------------------- | ------------------------------------------------ |
| `apps/api`                             | the NestJS api (swagger at `/api`)               |
| `apps/worker`                          | the ffmpeg worker (health at `/api/v1/health/*`) |
| `packages/queues`                      | shared queue names + message contracts           |
| `docker-compose-dev.yml` / `-prod.yml` | full stack from the repo root                    |

## Everyday commands (repo root)

```bash
npm ci                                   # installs all workspaces + links packages/queues
npm run verify:api / verify:worker       # lint + build + unit tests per app
npm test                                 # both apps' unit suites
npm run test:db                          # real-postgres integration specs (needs streamy_db_test up)
docker compose -f docker-compose-dev.yml up -d --build   # the whole stack
npm run db:run:migrate                   # after first boot (dev compose bypasses the entrypoint)
npm run test:e2e:vod                     # full pipeline e2e (asserts hardware encoder is in use)
npm run test:e2e:live                    # pushes a real rtmp broadcast and asserts live hls serving
npm run requeue:dead-letter              # replay failed messages from q.dead_letter
```

`.env` at the root feeds compose; `apps/api/.env` (a copy) feeds host-run scripts.

Consoles: api swagger `:3000/api` · worker swagger `:3001/api` · readiness
`:3001/api/v1/health/readiness` (rmq/storage/deadLetters/encoder/activeJob) · rabbitmq `:15677` ·
mailpit `:8025` · rtmp ingest `rtmp://localhost:1935/live/<stream-key>`.

## Notes

- Transcoding probes `h264_vaapi` → `h264_nvenc` → `h264_qsv` with real mini-encodes and falls
  back to libx264 (`FFMPEG_ENCODER` forces a choice). The worker image compiles ffmpeg 8.x from
  source for this — distro packages are old, static builds ship without hardware encoders.
- SRS only relays H.264; HEVC publishers must transcode on push (OBS sends H.264 by default).
- Queue consumers dead-letter failed messages to `q.dead_letter` via the `dlx` fanout exchange.
- CI: `tests.yml` (matrix lint/tsc/vitest per app + worker docker build), `e2e.yml` (nightly
  full-stack pipeline), `api-image.yml` / `worker-image.yml` (publish on main; need
  `DOCKER_USERNAME`/`DOCKER_PASSWORD` secrets).

## License

[GNU General Public License v3.0](https://www.gnu.org/licenses/gpl-3.0.html)
