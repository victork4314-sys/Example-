#!/usr/bin/env bash
set -euo pipefail
rm -rf wayback-probe
mkdir -p wayback-probe

UA='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/140 Safari/537.36'
queries=(
  'https://web.archive.org/cdx/search/cdx?url=www.planetminecraft.com/project/regional-airport-project-1-1/*&from=2020&to=2022&output=json&fl=timestamp,original,statuscode,mimetype,redirecturl,digest,length&filter=statuscode:200&collapse=digest'
  'https://web.archive.org/cdx/search/cdx?url=www.planetminecraft.com/project/regional-airport-project-1-1/download/*&from=2020&to=2022&output=json&fl=timestamp,original,statuscode,mimetype,redirecturl,digest,length&collapse=digest'
  'https://web.archive.org/cdx/search/cdx?url=static.planetminecraft.com/files/resource_media/*airport*&from=2020&to=2022&output=json&fl=timestamp,original,statuscode,mimetype,redirecturl,digest,length&filter=urlkey:airport&collapse=digest'
)

i=0
for q in "${queries[@]}"; do
  i=$((i+1))
  curl -L -sS -A "$UA" --max-time 120 "$q" -o "wayback-probe/cdx-$i.json" || true
  wc -c "wayback-probe/cdx-$i.json" >> wayback-probe/sizes.txt || true
done

# Also pull likely archived project and download endpoint snapshots directly.
for stamp in 20201021 20210204 20210205 20210301 20220101; do
  curl -L -sS -A "$UA" --max-time 120 "https://web.archive.org/web/${stamp}id_/https://www.planetminecraft.com/project/regional-airport-project-1-1/" -o "wayback-probe/project-$stamp.html" || true
  curl -L -sS -A "$UA" --max-time 120 -D "wayback-probe/download-$stamp.headers" "https://web.archive.org/web/${stamp}id_/https://www.planetminecraft.com/project/regional-airport-project-1-1/download/worldmap/" -o "wayback-probe/download-$stamp.bin" || true
done

python3 - <<'PY'
from pathlib import Path
import re, json
out=[]
for p in Path('wayback-probe').iterdir():
    if p.is_file():
        try: b=p.read_bytes()
        except: continue
        if b[:4]==b'PK\x03\x04':
            out.append(f'ZIP {p.name} {len(b)}')
        if p.suffix in {'.html','.json','.headers','.bin'} and len(b)<5_000_000:
            s=b.decode('utf-8','ignore')
            urls=sorted(set(re.findall(r'https?://[^\s"\'<>]+',s)))
            hits=[u for u in urls if 'planetminecraft' in u.lower() or 'mediafire' in u.lower() or 'dropbox' in u.lower() or 'drive.google' in u.lower()]
            for u in hits[:200]: out.append(f'{p.name}: {u}')
Path('wayback-probe/HITS.txt').write_text('\n'.join(out),encoding='utf-8')
PY

git config user.name 'airport-fetch-bot'
git config user.email 'airport-fetch-bot@users.noreply.github.com'
git add -f wayback-probe
git commit -m 'Airport Wayback probe result' || exit 0
git push
