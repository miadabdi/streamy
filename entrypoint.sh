#!/bin/sh
sleep 1d
npm run db:run:migrate
node dist/src/main.js