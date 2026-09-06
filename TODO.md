# Streamy

This is a video-sharing platform.

### Todo

- [ ] setup CSRF protection
- [ ] complete tests
- [ ] setup OpenApi V3 (Swagger DTO/auth annotations are partial)
- [ ] setup pagination
- [ ] check if isActive is checked in all queries
- [ ] find a way to add computed values for language name in subtitle schema
- [ ] implement log aggregation
- [ ] implement google oauth
- [ ] use templates for emails
- [ ] `/video/search` ignores its `channelId`/`onlySubbed`/`offset`/`limit` filters and does not filter by `isReleased` (`src/video/video.service.ts` search)
- [ ] comment ownership: `comments.ownerId` references channels.id but `userOwnsComment` compares it to users.id — real owners get 403 on update/delete; `ownerId` is also accepted from the client unchecked
- [ ] tag create/delete have no admin authorization (`isAdmin` column exists, never checked)

### Done ✓

- [x] setup smtp mail sender
- [x] setup minio object storage, and its corresponding module
- [x] migrate object storage to seaweedfs s3 gateway, replace bucket notifications with the confirm-upload endpoint
- [x] worker (streamy_process_node) runs in compose with health endpoints and swagger
- [x] dead-letter failed queue messages instead of acking them (dlx / q.dead_letter)
- [x] fix /live/on_publish crashing the process on unknown stream keys
