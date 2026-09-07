# Streamy

The Streamy Process Node is dedicated to handling long-running processes on separate servers, ensuring that these tasks are decoupled from user request handling. This architecture enhances performance and scalability by allowing any number of processing nodes to operate independently.

# How It Works

![streamy architecture](Streamy.drawio.png)

The Streamy project is responsible for handling user requests and managing various functionalities such as video creation, channels, comments, profiles, and more.

There is a different project, [Streamy Process Node](https://github.com/miadabdi/streamy_process_node) responsible for running long processes. It runs as the `process_node` service in this repo's docker compose files (build context `../streamy_process_node` — clone the two repos side by side).

The [Streamy Process Node](https://github.com/miadabdi/streamy_process_node) takes on the responsibility of executing long-running processes. Here's how it works:

Video Uploads:

1. The client uploads the video directly to object storage (SeaweedFS S3 gateway) using a presigned PUT URL, then calls `POST /video/confirm-upload`.
2. Confirming verifies the object exists and marks the video `ready_for_processing` (this replaces the old MinIO bucket-notification flow; SeaweedFS does not implement that API).
3. The owner sends the video to the process queue; Streamy publishes a message to the Process Node via RabbitMQ.
4. The Process Node downloads the video from object storage, transcodes it into HLS (HTTP Live Streaming) format and reports status back over the `q.set.video.status` queue.

Live Streaming:

1. When a new stream hits SRS (Simple Realtime Server, the `srs` compose service), its on_publish hook queues the Process Node and the node starts pulling the RTMP stream.
2. The node transcodes the stream into HLS and uploads segments CONTINUOUSLY while the broadcast runs, so viewers can play `http://<s3>/hls/<videoId>/master.m3u8` live.
3. When the stream ends (on_unpublish), the tail is flushed, the recording stays as a replay and the video is marked inactive.

Note: stock SRS 6 only relays H.264 video — HEVC publishers must transcode on push (real broadcasters/OBS send H.264 by default).

This separation of concerns ensures that user interactions remain responsive, while the heavy lifting of video processing is handled efficiently by dedicated nodes.

## Installation

Docker compose runs the whole stack: the API, the process node worker, Postgres, RabbitMQ, SeaweedFS and Elasticsearch/Kibana. You must already have docker installed, and the [Streamy Process Node](https://github.com/miadabdi/streamy_process_node) repo cloned side by side (`../streamy_process_node`).

### Step 1: Configure Environment Variables

1. Copy `.env.example` to `.env`.
2. Fill out the .env file with the required environment variables. Descriptions for each variable are provided within the file.

Notable variables:

- `MINIO_*` variables point the apps at the SeaweedFS S3 gateway (kept the historical names). `MINIO_ENDPOINT/PORT` is the address the apps use internally; `MINIO_PUBLIC_ENDPOINT/PORT` is the client-facing address used to sign presigned URLs and build public links.
- `PROCESS_NODE_PORT` is the published port of the worker.
- `FFMPEG_*` tune the worker's transcoding (thread count, niceness); `FFMPEG_ENCODER` forces an encoder (`software` or a specific hardware one) — by default the worker probes `h264_vaapi`, `h264_nvenc` and `h264_qsv` with real mini-encodes and uses the first that works, falling back to libx264.
- `ADMIN_EMAILS` (comma-separated) is granted admin at boot — the first admin has to come from somewhere.
- dev mail is captured by Mailpit at `http://localhost:8025`.

### Step 2: Start the stack

```bash
docker compose -f docker-compose-dev.yml up -d --build
```

The dev compose runs the app with live-reload (source bind mount) and the worker the same way. `docker-compose-prod.yml` runs prebuilt images with production targets.

After the first start, run migrations once (the dev compose command bypasses the entrypoint that normally runs them):

```bash
npm run db:run:migrate
```

### Step 3: Verify

- API: `http://localhost:3000/api` (Swagger UI)
- Worker: `http://localhost:3001/api` (Swagger UI) and `http://localhost:3001/api/v1/health/readiness`
- RabbitMQ console: `http://localhost:15677`
- Mailpit (dev mail): `http://localhost:8025`
- RTMP ingest (SRS): `rtmp://localhost:1935/live/<stream-key>`

Failed queue messages land on `q.dead_letter` (surfaced as `deadLetters` in the worker readiness endpoint); replay them with `npm run requeue:dead-letter`.
- Kibana: `http://localhost:5601`

### One-time queue deletion note

Queue consumers now declare a dead-letter exchange argument (`x-dead-letter-exchange=dlx`). RabbitMQ rejects re-declaring existing queues with new arguments (406 PRECONDITION_FAILED), so after upgrading an environment that has old queues, delete them once before the first boot:

```bash
docker compose -f docker-compose-dev.yml exec rmq rabbitmqctl delete_queue q.video.process q.live.process q.set.video.status q.email.send
```

## Details

This project supports video sharing (video on-demand) and live streaming functionalities.

Video on Demand

- Direct-to-storage upload: clients PUT files straight to SeaweedFS with presigned URLs, then confirm via the API.
- Transcoding to HLS: Confirmed videos are transcoded to HLS (HTTP Live Streaming) format using [FFMPEG](https://www.ffmpeg.org/). This process involves:
  - Packaging videos and subtitles uploaded by users into HLS format.
  - Generating multiple versions of the same video, including different codecs, resolutions, and bitrates.

Live Streaming

- [SRS Media Server](https://github.com/ossrs/srs): Live streaming is managed by the SRS Media Server, which supports both RTMP and WebRTC streams.
  - SRS triggers a specified endpoint in our application for each new event, allowing our app to control and manage these events.

Channels and User Interaction

- Channels: Each user can create multiple channels, and each channel can host multiple videos and live streams.
- Comments: Only channels can post comments on videos.

## Tests

Unit tests:

```bash
npm test
```

End-to-end VOD pipeline test (requires the full stack running; uploads a local video through signup → upload → transcode → release → search, including failure cases):

```bash
E2E_VIDEO_PATH=/path/to/video.mp4 npm run test:e2e:vod
```

End-to-end live test (pushes a real 45s RTMP stream through SRS and asserts segments are served publicly WHILE the broadcast runs):

```bash
npm run test:e2e:live
```

Note the auth endpoints are throttled to 10 requests / 10 minutes per IP.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[GNU General Public License v3.0](https://www.gnu.org/licenses/gpl-3.0.html)
