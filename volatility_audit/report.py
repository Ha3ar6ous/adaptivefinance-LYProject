"""Create final copyable CSVs and execute checks. Exclusive new output only."""
import argparse
import json
import os
import subprocess
import sys
from pathlib import Path

import pandas as pd

import run as a


def main(out):
    dest=out/'final_tables'
    dest.mkdir(exist_ok=False)
    diag=out/'family_diagnostics_v2'
    selected=json.loads((out/'selection.json').read_text())['overall']['name']
    d=pd.read_csv(diag/'all_models_test_metrics.csv').query("level=='pooled'").copy()
    ci=pd.read_csv(diag/'test_bootstrap_ci.csv').query("group=='all'")
    for m in ('macro_f1','high_recall'):
        sub=ci[ci.metric==m].set_index('model')
        d[f'{m}_lower95']=d.model.map(sub.lower_95)
        d[f'{m}_upper95']=d.model.map(sub.upper_95)
    original=json.loads((out/'selection.json').read_text())
    diagnostics=json.loads((diag/'frozen_diagnostics.json').read_text())['winners']
    val=pd.read_csv(out/'validation_all_candidates.csv').set_index('name')
    for m in ('macro_f1','high_recall'):
        d[f'validation_{m}']=d.model.map(val[m])
    admitted={v['name'] for v in original['families'].values() if v}
    rejected={v['name'] for v in diagnostics.values() if not v['admissible_for_selection']}
    d['role']=d.model.map(lambda n:'validation-selected overall' if n==selected else 'rejected diagnostic family winner' if n in rejected else 'admissible family comparator' if n in admitted else 'fixed/train-fit baseline')
    d.to_csv(dest/'pooled_model_comparison.csv',index=False,mode='x')
    for source,name in [(out/'class_distribution.csv','class_distribution.csv'),
                        (out/'original_vs_selected.csv','before_after.csv'),
                        (out/'test_paired_delta_ci.csv','paired_delta_ci.csv'),
                        (diag/'all_models_test_per_class.csv','all_models_per_class.csv'),
                        (diag/'all_models_test_confusion.csv','all_models_confusion.csv'),
                        (diag/'all_models_nonoverlap_metrics.csv','nonoverlap_metrics.csv')]:
        import shutil
        shutil.copy2(source,dest/name)
    seed=pd.read_csv(diag/'diagnostic_seed_metrics.csv')
    seed.groupby('model')[['macro_f1','high_recall','balanced_accuracy']].agg(['mean','std','min','max']).to_csv(dest/'gb_seed_summary.csv',mode='x')
    for m in ('macro_f1','high_recall'):
        grid=pd.read_csv(out/f'validation_grid_{m}_matrix.csv')
        grid.to_csv(dest/f'validation_grid_{m}.csv',index=False,mode='x')
    env=os.environ.copy();env['VOL_AUDIT_RESULTS']=str(out.relative_to(a.ROOT))
    command=[sys.executable,'-m','unittest','discover','-s','volatility_audit','-p','test_*.py','-v']
    tests=subprocess.run(command,cwd=a.ROOT,env=env,text=True,capture_output=True)
    with (dest/'test_run.txt').open('x',encoding='utf-8') as f: f.write(tests.stdout+tests.stderr)
    a.dump(dest/'test_execution.json',dict(command=command,exit_code=tests.returncode))
    print(tests.stdout+tests.stderr)
    if tests.returncode: raise SystemExit(tests.returncode)
    hashes={str(p.relative_to(out)).replace('\\','/'):a.digest(p) for p in out.rglob('*') if p.is_file()}
    a.dump(dest/'all_results_sha256.json',hashes)
    print('Final tables:',dest)


if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--out',required=True)
    args=parser.parse_args();main((a.ROOT/args.out).resolve())
