#!/usr/bin/env bash
set -euxo pipefail
rm -rf /tmp/PMC-MC dataset-lookup
mkdir -p dataset-lookup

export GIT_LFS_SKIP_SMUDGE=1
git clone --depth 1 https://github.com/erzar0/MC.git /tmp/PMC-MC
cd /tmp/PMC-MC
git lfs install --local
git lfs pull --include='data/pipeline/pmc_data_cleansed.csv' --exclude=''

python3 - <<'PY'
import csv, json
from pathlib import Path
p=Path('/tmp/PMC-MC/data/pipeline/pmc_data_cleansed.csv')
out=Path('${GITHUB_WORKSPACE}')/'dataset-lookup'
queries=['regional-airport-project-1-1','regional airport project (1:1)','scarx28']
matches=[]
with p.open('r',encoding='utf-8',errors='replace',newline='') as f:
    r=csv.DictReader(f)
    headers=r.fieldnames or []
    for row in r:
        blob='\n'.join(str(v) for v in row.values()).lower()
        if 'regional-airport-project-1-1' in blob or ('regional airport project' in blob and 'scarx28' in blob):
            matches.append(row)
            if len(matches)>=20:
                break
(out/'headers.json').write_text(json.dumps(headers,indent=2),encoding='utf-8')
(out/'matches.json').write_text(json.dumps(matches,indent=2,ensure_ascii=False),encoding='utf-8')
with (out/'summary.txt').open('w',encoding='utf-8') as g:
    g.write(f'file_size={p.stat().st_size}\nheaders={headers}\nmatches={len(matches)}\n')
    for i,row in enumerate(matches,1):
        g.write(f'\n--- MATCH {i} ---\n')
        for k,v in row.items():
            if v and (k.lower() in {'title','author','url','link','project_url','download_mirrors','download_url','id','slug'} or 'download' in k.lower() or 'mirror' in k.lower()):
                g.write(f'{k}: {v}\n')
PY

cd "$GITHUB_WORKSPACE"
