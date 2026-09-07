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
