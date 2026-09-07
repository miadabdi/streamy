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

- [ ] nestjs 12 upgrade blocked: packages are esm-only which jest 30 cannot load, @nestjs/schematics@12 requires typescript >= 6 which ts-jest does not support, and ts 7 is the native compiler without js tooling support yet

### Done ✓

- [x] setup smtp mail sender
- [x] setup minio object storage, and its corresponding module
- [x] migrate object storage to seaweedfs s3 gateway, replace bucket notifications with the confirm-upload endpoint
- [x] worker (streamy_process_node) runs in compose with health endpoints and swagger
- [x] dead-letter failed queue messages instead of acking them (dlx / q.dead_letter)
- [x] fix /live/on_publish crashing the process on unknown stream keys
- [x] /video/search honors its filters (channelId/onlySubbed/offset/limit) and only returns released videos
- [x] comment ownership checks the owning channel; creation validates the dto channel
- [x] tag create/delete require admin
- [x] release reindexes the full es document (partial body used to clobber the searchable name)
- [x] shared queue-name package (@miadabdi/streamy-queues) shared with the process node
- [x] hardware-first transcoding with software fallback (vaapi/nvenc/qsv probe)
- [x] raw uploads no longer anonymously readable (Read:videos dropped)
- [x] admin bootstrap via ADMIN_EMAILS + PATCH /user/promote
- [x] dead-letter depth in worker readiness + requeue:dead-letter script
- [x] dev mail captured by mailpit
