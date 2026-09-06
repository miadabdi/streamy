#!/bin/sh
set -e

if [ "$NODE_ENV" = "production" ]; then
    node ./dist/src/drizzle/migrate.js
elif [ "$NODE_ENV" = "development" ]; then
    if [ -f ./src/drizzle/migrate.ts ]; then
        npm run db:run:migrate
    else
        node ./dist/src/drizzle/migrate.js
    fi
fi

exec "$@"