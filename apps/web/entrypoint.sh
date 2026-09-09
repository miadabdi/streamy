#!/bin/sh
# Render the SPA's runtime config from the template (container env →
# window.__ENV__), then exec the CMD (nginx). The explicit variable list
# keeps envsubst from touching anything else in the file.
set -e

envsubst '${WEB_WORKER_API} ${WEB_RTMP_HOST}' \
	< /etc/nginx/env.js.template \
	> /usr/share/nginx/html/env.js

exec "$@"
