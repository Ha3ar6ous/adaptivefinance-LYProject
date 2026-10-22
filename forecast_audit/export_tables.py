"""Export primary prediction variants and fingerprint final artifacts; no refitting."""
import argparse,hashlib,json
from pathlib import Path
import pandas as pd
ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--out',type=Path,required=True);a=p.parse_args();out=a.out.resolve()
metrics=pd.read_csv(out/'test_metrics.csv');primary=metrics[metrics.seed.isin(['deterministic','ensemble'])]
for scope,name in [('pooled','test_pooled.csv'),('platform','test_per_platform.csv'),('file','test_per_series.csv')]:
    frame=primary[primary.scope==scope];target=out/name
    if target.exists():
        assert target.read_text(encoding='utf-8').replace('\r\n','\n')==frame.to_csv(index=False).replace('\r\n','\n'),f'Existing table differs: {target}'
    else:
        with target.open('x',encoding='utf-8',newline='') as f:frame.to_csv(f,index=False)
sources=[*sorted((ROOT/'forecast_audit').glob('*.py')),ROOT/'forecast_audit/PROTOCOL.md',ROOT/'forecast_audit/requirements.txt',ROOT/'forecast_audit/environment.lock.txt',ROOT/'CHANGES_forecast.md']
outputs=[p for p in out.iterdir() if p.is_file()]
manifest={str(p.relative_to(ROOT)).replace('\\','/'):hashlib.sha256(p.read_bytes()).hexdigest() for p in sources+outputs}
with (out/'artifacts_manifest.json').open('x',encoding='utf-8') as f:json.dump(manifest,f,indent=2)
print('Exported pooled/platform/series primary-variant tables; fingerprinted',len(manifest),'files')
