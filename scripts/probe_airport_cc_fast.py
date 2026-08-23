#!/usr/bin/env python3
import concurrent.futures, gzip, io, json, re, urllib.parse, urllib.request
from pathlib import Path
OUT=Path('cc-fast'); OUT.mkdir(exist_ok=True)
UA={'User-Agent':'Mozilla/5.0'}
indexes=['CC-MAIN-2020-45','CC-MAIN-2020-50','CC-MAIN-2021-04','CC-MAIN-2021-10','CC-MAIN-2021-17']
pattern='www.planetminecraft.com/project/regional-airport-project-1-1/*'

def get(url, timeout=15, headers=None):
    req=urllib.request.Request(url,headers=headers or UA)
    return urllib.request.urlopen(req,timeout=timeout).read()

def query(idx):
    url=f'https://index.commoncrawl.org/{idx}-index?url={urllib.parse.quote(pattern,safe="")}&output=json&filter=status:200&collapse=urlkey'
    try:
        txt=get(url,15).decode('utf-8','ignore')
        return idx,[json.loads(x) for x in txt.splitlines() if x.strip().startswith('{')]
    except Exception as e:
        return idx,[{'error':repr(e)}]

records=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as ex:
    for idx,recs in ex.map(query,indexes):
        for r in recs:
            r['index']=idx; records.append(r)
(OUT/'index.json').write_text(json.dumps(records,indent=2))

def fetch_rec(item):
    i,r=item
    if not all(k in r for k in ('filename','offset','length')): return []
    try:
        start=int(r['offset']); ln=int(r['length'])
        raw=get('https://data.commoncrawl.org/'+r['filename'],25,{'Range':f'bytes={start}-{start+ln-1}','User-Agent':'Mozilla/5.0'})
        try: raw=gzip.GzipFile(fileobj=io.BytesIO(raw)).read()
        except: pass
        text=raw.decode('utf-8','ignore')
        # keep only records matching our slug
        if 'regional-airport-project-1-1' not in text.lower(): return []
        (OUT/f'record-{i}.txt').write_text(text)
        hits=[]
        for u in set(re.findall(r'(?:https?:)?//[^\s"\'<>]+',text,re.I)):
            lo=u.lower()
            if any(x in lo for x in ['resource_media','download/worldmap','mediafire','dropbox','drive.google','mega.nz','.zip','.schem','.schematic','.litematic']):
                hits.append({'record':i,'url':u[:3000]})
        for m in re.finditer(r'.{0,600}(?:Download Minecraft Map|download/worldmap|resource_media|schematic).{0,1800}',text,re.I|re.S):
            hits.append({'record':i,'snippet':re.sub(r'\s+',' ',m.group(0))[:2600]})
        return hits
    except Exception as e:
        return [{'record':i,'error':repr(e)}]

hits=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:
    for hs in ex.map(fetch_rec,list(enumerate(records))): hits.extend(hs)
(OUT/'HITS.json').write_text(json.dumps(hits,indent=2))
print(f'records={len(records)} hits={len(hits)}')
