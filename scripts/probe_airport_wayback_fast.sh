#!/usr/bin/env bash
set -euxo pipefail
rm -rf wayback-fast
mkdir -p wayback-fast
UA='Mozilla/5.0'

curl -sS -L --max-time 30 -A "$UA" \
 'https://web.archive.org/cdx/search/cdx?url=www.planetminecraft.com/project/regional-airport-project-1-1/download/*&from=2020&to=2022&output=json&fl=timestamp,original,statuscode,mimetype,redirecturl,length&collapse=urlkey&filter=statuscode:200|302|301' \
 -o wayback-fast/download-cdx.json || true

curl -sS -L --max-time 30 -A "$UA" \
 'https://web.archive.org/cdx/search/cdx?url=www.planetminecraft.com/project/regional-airport-project-1-1/*&from=2020&to=2022&output=json&fl=timestamp,original,statuscode,mimetype,redirecturl,length&collapse=urlkey' \
 -o wayback-fast/project-cdx.json || true

curl -sS -L --max-time 30 -A "$UA" \
 'https://web.archive.org/cdx/search/cdx?url=static.planetminecraft.com/files/resource_media/*&from=2020&to=2022&output=json&fl=timestamp,original,statuscode,mimetype,redirecturl,length&filter=original:.*airport.*&collapse=urlkey' \
 -o wayback-fast/static-cdx.json || true

for f in wayback-fast/*.json; do echo "=== $f ==="; cat "$f"; echo; done > wayback-fast/all.txt

git config user.name airport-fetch-bot
git config user.email airport-fetch-bot@users.noreply.github.com
git add -f wayback-fast
git commit -m 'Fast airport archive probe result' || exit 0
git push
