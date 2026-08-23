#!/usr/bin/env bash
set +e
rm -rf origin-probe
mkdir -p origin-probe
KEY='files/resource_media/schematic/regional-airport.zip'
hosts=(
  "https://static.planetminecraft.com/$KEY"
  "http://static.planetminecraft.com/$KEY"
  "https://cdn.planetminecraft.com/$KEY"
  "http://cdn.planetminecraft.com/$KEY"
  "https://static.planetminecraft.com.s3.amazonaws.com/$KEY"
  "https://s3.amazonaws.com/static.planetminecraft.com/$KEY"
  "https://planetminecraft.s3.amazonaws.com/$KEY"
  "https://s3.amazonaws.com/planetminecraft/$KEY"
  "https://cdn.planetminecraft.com.s3.amazonaws.com/$KEY"
  "https://s3.amazonaws.com/cdn.planetminecraft.com/$KEY"
)
: > origin-probe/results.txt
echo '=== DNS ===' >> origin-probe/results.txt
getent ahosts static.planetminecraft.com >> origin-probe/results.txt 2>&1
getent ahosts cdn.planetminecraft.com >> origin-probe/results.txt 2>&1
python3 - <<'PY' >> origin-probe/results.txt 2>&1
import socket
for h in ['static.planetminecraft.com','cdn.planetminecraft.com']:
    try: print(h, socket.gethostbyname_ex(h))
    except Exception as e: print(h, repr(e))
PY
echo '=== HTTP ===' >> origin-probe/results.txt
i=0
for u in "${hosts[@]}"; do
  i=$((i+1))
  code=$(curl -L -sS --max-time 45 -A 'Mozilla/5.0' -o "origin-probe/$i.bin" -D "origin-probe/$i.headers" -w '%{http_code}' "$u")
  size=$(wc -c < "origin-probe/$i.bin")
  type=$(file -b --mime-type "origin-probe/$i.bin")
  printf '%02d code=%s size=%s type=%s %s\n' "$i" "$code" "$size" "$type" "$u" >> origin-probe/results.txt
  head -c 300 "origin-probe/$i.bin" | strings | tr '\n' ' ' >> origin-probe/results.txt
  printf '\n' >> origin-probe/results.txt
done

git config user.name airport-fetch-bot
git config user.email airport-fetch-bot@users.noreply.github.com
git add -f origin-probe
git commit -m 'Airport origin probe result' || exit 0
git push
