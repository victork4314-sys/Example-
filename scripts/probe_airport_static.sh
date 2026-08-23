#!/usr/bin/env bash
set -euo pipefail
mkdir -p static-probe
BASE='https://static.planetminecraft.com/files/resource_media/schematic'
cat > /tmp/candidates.txt <<'EOF'
regional-airport-project.zip
regional-airport-project-1-1.zip
regional-airport-project-11.zip
regional-airport-project-1-1-world.zip
regional-airport-project-world.zip
regional-airport.zip
regional-airport-1-1.zip
regional-airport-world.zip
regionalairportproject.zip
regionalairportproject11.zip
regionalairport.zip
airport-project.zip
regional-airport-project.schematic
regional-airport-project-1-1.schematic
regional-airport-project-11.schematic
regional-airport.schematic
regional-airport-1-1.schematic
regionalairportproject.schematic
regionalairport.schematic
regional-airport-project.litematic
regional-airport-project-1-1.litematic
EOF
: > static-probe/results.txt
found=0
while IFS= read -r f; do
  url="$BASE/$f"
  code=$(curl -L -sS -o /tmp/probe.bin -w '%{http_code}' "$url" || true)
  size=$(wc -c </tmp/probe.bin 2>/dev/null || echo 0)
  ctype=$(file -b --mime-type /tmp/probe.bin 2>/dev/null || echo unknown)
  printf '%s %s %s %s\n' "$code" "$size" "$ctype" "$url" >> static-probe/results.txt
  if [ "$code" = 200 ] && [ "$size" -gt 1000 ] && [ "$ctype" != 'text/html' ]; then
    cp /tmp/probe.bin "static-probe/$f"
    found=1
  fi
done </tmp/candidates.txt

git config user.name 'airport-fetch-bot'
git config user.email 'airport-fetch-bot@users.noreply.github.com'
git add -f static-probe
git commit -m 'Airport static probe result' || exit 0
git push
exit 0
