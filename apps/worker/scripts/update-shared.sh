#!/bin/sh
# regenerates vendor/miadabdi-streamy-queues-*.tgz from the single source of
# truth in the sibling streamy repo and refreshes the dependency
set -e
cd "$(dirname "$0")/.."

rm -f vendor/miadabdi-streamy-queues-*.tgz
(cd ../streamy/packages/streamy-queues && npm pack --pack-destination /tmp >/dev/null)
cp /tmp/miadabdi-streamy-queues-*.tgz vendor/
npm install
echo "vendored: $(ls vendor/)"
