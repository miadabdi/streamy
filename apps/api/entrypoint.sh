#!/bin/sh
set -e

# paths are workspace-relative; everything runs from the repo root
if [ "$NODE_ENV" = "production" ]; then
    node ./apps/api/dist/src/drizzle/migrate.js
elif [ "$NODE_ENV" = "development" ]; then
    if [ -f ./apps/api/src/drizzle/migrate.ts ]; then
        npm run db:run:migrate -w apps/api
    else
        node ./apps/api/dist/src/drizzle/migrate.js
    fi
fi

exec "$@"
