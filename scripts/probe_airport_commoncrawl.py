#!/usr/bin/env python3
import json, gzip, io, re, sys, urllib.request, urllib.parse
from pathlib import Path

OUT=Path('cc-probe'); OUT.mkdir(exist_ok=True)
urls=[
 'https://www.planetminecraft.com/project/regional-airport-project-1-1/',
 'http://www.planetminecraft.com/project/regional-airport-project-1-1/',
 'https://www.planetminecraft.com/project/regional-airport-project-1-1/download/worldmap/',
 'http://www.planetminecraft.com/project/regional-airport-project-1-1/download/worldmap/'
]
indexes=[
 'CC-MAIN-2021-04','CC-MAIN-2021-10','CC-MAIN-2021-17','CC-MAIN-2021-21','CC-MAIN-2021-25','CC-MAIN-2021-31','CC-MAIN-2021-39','CC-MAIN-2021-43','CC-MAIN-2021-49',
 'CC-MAIN-2020-45','CC-MAIN-2020-50','CC-MAIN-2020-40'
]
headers={'User-Agent':'Mozilla/5.0'}
found=[]
for idx in indexes:
  for u in urls:
    api=f'https://index.commoncrawl.org/{idx}-index?url={urllib.parse.quote(u,safe="")}&output=json'
    try:
      req=urllib.request.Request(api,headers=headers)
      txt=urllib.request.urlopen(req,timeout=20).read().decode('utf-8','ignore')
    except Exception as e:
      found.append({'index':idx,'url':u,'error':repr(e)}); continue
    for line in txt.splitlines():
      try: rec=json.loads(line)
      except: continue
      rec['index']=idx; found.append(rec)

(OUT/'index-results.json').write_text(json.dumps(found,indent=2),encoding='utf-8')

hits=[]
for i,rec in enumerate(found):
  if 'filename' not in rec: continue
  try:
    offset=int(rec['offset']); length=int(rec['length']); fn=rec['filename']
    req=urllib.request.Request('https://data.commoncrawl.org/'+fn,headers={'Range':f'bytes={offset}-{offset+length-1}','User-Agent':'Mozilla/5.0'})
    raw=urllib.request.urlopen(req,timeout=30).read()
    try: raw=gzip.GzipFile(fileobj=io.BytesIO(raw)).read()
    except: pass
    text=raw.decode('utf-8','ignore')
    (OUT/f'record-{i}.txt').write_text(text,encoding='utf-8')
    pats=[r'https?://[^\s"\'<>]+',r'//static\.planetminecraft\.com/[^\s"\'<>]+',r'/files/resource_media/[^\s"\'<>]+']
    urls2=set()
    for pat in pats:
      urls2.update(re.findall(pat,text,re.I))
    for h in sorted(urls2):
      low=h.lower()
      if any(k in low for k in ['download','resource_media','mediafire','dropbox','drive.google','mega.nz','.zip','.schem','.schematic','.litematic']):
        hits.append({'record':i,'source':rec.get('url'),'hit':h[:2000]})
    for m in re.finditer(r'.{0,500}(?:Download Minecraft Map|worldmap|resource_media|wurl|schematic).{0,1500}',text,re.I|re.S):
      snippet=re.sub(r'\s+',' ',m.group(0))[:2200]
      hits.append({'record':i,'snippet':snippet})
  except Exception as e:
    hits.append({'record':i,'error':repr(e)})

(OUT/'HITS.json').write_text(json.dumps(hits,indent=2),encoding='utf-8')
print(json.dumps({'records':len(found),'hits':len(hits)},indent=2))
