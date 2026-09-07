# Streamy Process Node

This is the ffmpeg worker of the [Streamy](https://github.com/miadabdi/streamy) video-sharing platform.

### Todo

- [ ] complete tests
- [ ] docker hub image workflows need DOCKER_USERNAME/DOCKER_PASSWORD secrets on the repo
- [x] hardware-first transcoding (vaapi/nvenc/qsv probe with software fallback) — closes the encode-tail lag on machines with a working gpu
- [ ] implement log aggregation
- [ ] transcode progress is parsed from ffmpeg stderr but only logged locally; consider reporting it via `q.set.video.status`

### Done ✓

- [x] setup rabbitmq connection (consumes q.video.process / q.live.process, publishes q.set.video.status)
- [x] dead-letter failed queue messages instead of acking them (dlx / q.dead_letter)
- [x] health endpoints + swagger
- [x] multi-stage dockerfile; runs as `process_node` in the streamy compose stack
- [x] resolve ffmpeg/ffprobe from env (FFMPEG_PATH/FFPROBE_PATH) — prod builds no longer break
- [x] ffmpeg spawned with an argument array (no shell); live bufsize arithmetic computed
- [x] end-of-stream handling: recording uploaded as a replay, local files cleaned, done status published
- [x] live hls uploaded continuously during the broadcast (LiveUploader); viewers play hls/<id>/master.m3u8 while the stream runs
- [x] srs in the compose stack with on_publish/on_unpublish hooks; empty-pull retry + rw_timeout stall guard
- [x] queue names come from the shared @miadabdi/streamy-queues package (vendored tarball)
