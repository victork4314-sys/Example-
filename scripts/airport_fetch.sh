#!/usr/bin/env bash
set -euxo pipefail
mkdir -p out airport-fetch-output
PROJECT='https://www.planetminecraft.com/project/regional-airport-project-1-1/'
DOWNLOAD='https://www.planetminecraft.com/project/regional-airport-project-1-1/download/worldmap/'

curl -sS -L --compressed -A 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36' -c cookies.txt -o /tmp/project.html "$PROJECT" || true
curl -sS -L --compressed -A 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36' -e "$PROJECT" -b cookies.txt -c cookies.txt -D out/curl-headers.txt -o out/curl-result.bin "$DOWNLOAD" || true

if python3 - <<'PY'
from pathlib import Path
p=Path('out/curl-result.bin')
raise SystemExit(0 if p.exists() and p.read_bytes()[:4] == b'PK\x03\x04' else 1)
PY
then
  mv out/curl-result.bin out/Scarx28-Regional-Airport-Project.zip
else
  rm -f out/curl-result.bin
  npm init -y >/dev/null 2>&1
  npm install playwright@1.55.0 >/dev/null
  npx playwright install chromium >/dev/null
  cat > /tmp/fetch.js <<'JS'
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const project='https://www.planetminecraft.com/project/regional-airport-project-1-1/';
  const endpoint='https://www.planetminecraft.com/project/regional-airport-project-1-1/download/worldmap/';
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({userAgent:'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36',acceptDownloads:true,viewport:{width:1365,height:900}});
  const page=await context.newPage();
  await page.goto(project,{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForTimeout(8000);
  fs.writeFileSync('out/page-title.txt',await page.title());
  fs.writeFileSync('out/page-url.txt',page.url());
  let r=await context.request.get(endpoint,{headers:{referer:project,accept:'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'},timeout:120000,maxRedirects:20});
  fs.writeFileSync('out/browser-status.txt',`${r.status()}\n${r.url()}\n${JSON.stringify(await r.allHeaders(),null,2)}\n`);
  let body=await r.body();
  if(body.length>=4&&body[0]===0x50&&body[1]===0x4b&&body[2]===0x03&&body[3]===0x04){fs.writeFileSync('out/Scarx28-Regional-Airport-Project.zip',body);await browser.close();return;}
  const link=page.locator('a:has-text("Download Minecraft Map")').first();
  if(await link.count()){
    fs.writeFileSync('out/download-href.txt',String(await link.getAttribute('href')));
    try{const dp=page.waitForEvent('download',{timeout:45000});await link.click({timeout:30000});const dl=await dp;await dl.saveAs('out/Scarx28-Regional-Airport-Project.zip');await browser.close();return;}catch(e){fs.writeFileSync('out/click-error.txt',String(e));}
  }
  fs.writeFileSync('out/browser-result.html',body);
  await browser.close();
})().catch(e=>{fs.writeFileSync('out/browser-fatal.txt',String(e));});
JS
  node /tmp/fetch.js || true
fi

if [ -f out/Scarx28-Regional-Airport-Project.zip ] && unzip -t out/Scarx28-Regional-Airport-Project.zip >/dev/null 2>&1; then
  cp out/Scarx28-Regional-Airport-Project.zip airport-fetch-output/Scarx28-Regional-Airport-Project.zip
  printf 'SUCCESS\n' > airport-fetch-output/status.txt
  sha256sum airport-fetch-output/Scarx28-Regional-Airport-Project.zip > airport-fetch-output/sha256.txt
  du -h airport-fetch-output/Scarx28-Regional-Airport-Project.zip > airport-fetch-output/size.txt
else
  printf 'FAILED\n' > airport-fetch-output/status.txt
  cp -f out/*.txt airport-fetch-output/ 2>/dev/null || true
  cp -f out/curl-headers.txt airport-fetch-output/ 2>/dev/null || true
fi

git config user.name 'airport-fetch-bot'
git config user.email 'airport-fetch-bot@users.noreply.github.com'
git add -f airport-fetch-output
git commit -m 'Airport fetch result' || exit 0
git push
