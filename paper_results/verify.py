"""Final export integrity, prior-result preservation and no-secret checks."""
import argparse
import hashlib
import json
import re
import struct
from pathlib import Path
import numpy as np
import pandas as pd

ROOT=Path(__file__).resolve().parents[1]


def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()


def main(out):
    d=pd.read_csv(out/'tables/before_after_all_metrics.csv')
    comparable=d.before.notna()&d.after.notna()
    np.testing.assert_allclose(d.loc[comparable,'absolute_change'],d.loc[comparable,'after']-d.loc[comparable,'before'],rtol=1e-12,atol=1e-12)
    base=json.loads((ROOT/'score_audit/results_20261017/preservation.json').read_text())
    changes=[p for p,h in base.items() if sha(ROOT/p)!=h]
    authorized={'server/services/investmentEngineService.js','server/services/aiExplanationService.js','server/services/groqService.js'}
    unexpected=[p for p in changes if p not in authorized];assert not unexpected,unexpected
    sources=json.loads((out/'source_manifest.json').read_text());changed=[p for p,h in sources.items() if sha(ROOT/p)!=h]
    assert set(changed)<= {'CHANGES_results.md'},changed # append-only rendering repair log
    figures=[]
    for name in ['forecast_legacy','real_forecast','volatility_confusions','router_tradeoff','score_calibration','engine_llm']:
        p=out/'figures'/f'{name}.png';raw=p.read_bytes();assert raw[:8]==b'\x89PNG\r\n\x1a\n';w,h=struct.unpack('>II',raw[16:24]);assert w>600 and h>400
        figures.append(dict(file=p.relative_to(ROOT).as_posix(),width=w,height=h,bytes=len(raw)))
    patterns=[re.compile(rb'gsk_[A-Za-z0-9]{20,}'),re.compile(rb'sk-proj-[A-Za-z0-9_-]{20,}')]
    secret_files=[]
    targets=[ROOT/'RESULTS_FOR_PAPER.md']+list(ROOT.glob('CHANGES_*.md'))
    for folder in ['score_audit','engine_llm_audit','data_audit','paper_results']:
        targets += [p for p in (ROOT/folder).rglob('*') if p.is_file() and p.suffix in ('.md','.json','.csv','.txt','.py','.js','.cjs') and not any(x in p.parts for x in ('.plot_venv','__pycache__','.venv'))]
    for p in targets:
        raw=p.read_bytes()
        if any(pattern.search(raw) for pattern in patterns):secret_files.append(p.relative_to(ROOT).as_posix())
    assert not secret_files,secret_files
    result=dict(metric_rows=len(d),arithmetic_comparisons_checked=int(comparable.sum()),prior_files_checked=len(base),
        authorized_source_changes=changes,unexpected_prior_file_changes=unexpected,source_manifest_append_only_log_changes=changed,
        generated_figures=figures,secret_pattern_files=secret_files)
    with (out/'verification.json').open('x',encoding='utf-8') as f:json.dump(result,f,indent=2)
    paths=[ROOT/'RESULTS_FOR_PAPER.md']+list(ROOT.glob('CHANGES_*.md'))+[p for p in out.rglob('*') if p.is_file()]
    paths += [p for p in (ROOT/'paper_results').glob('*') if p.is_file()]
    with (out/'completion_manifest.json').open('x',encoding='utf-8') as f:json.dump({p.relative_to(ROOT).as_posix():sha(p) for p in sorted(set(paths))},f,indent=2)
    print(json.dumps(result,indent=2))


if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--out',default='paper_results/results_20261017');args=p.parse_args();main((ROOT/args.out).resolve())
