#!/bin/sh
npm run db:run:migrate
node dist/src/main.js
sleep 1d