import json
import os
import subprocess
from pathlib import Path
import numpy as np
import pandas as pd

ROOT=Path(__file__).resolve().parents[1];R=ROOT/os.environ.get('ENGINE_AUDIT_OUT','engine_llm_audit/results_20261017')


def main():
    engine=[]
    for stage in ('before','after'):
        d=pd.read_json(R/f'engine_{stage}.json')
        for method,g in d.groupby('method'):
            engine.append(dict(stage=stage,method=method,n=len(g),eligible=int(g.eligible.sum()),allocations=int(g.n.sum()),
                minimum_violations=int(g.min_violations.sum()),percentage_violations=int(g.pct_violation.sum()),
                hard_filter_violations=int(g.filter_violations.sum()),budget_violations=int((g.allocated>g.budget).sum()),
                unused_mean=float((g.loc[g.eligible,'budget']-g.loc[g.eligible,'allocated']).mean())))
    # Existing exploratory aggregate is retained; verify rather than overwrite it.
    computed=pd.DataFrame(engine)
    if (R/'engine_summary.csv').exists():
        saved=pd.read_csv(R/'engine_summary.csv');pd.testing.assert_frame_equal(computed,saved,check_dtype=False)
    else:computed.to_csv(R/'engine_summary.csv',index=False,mode='x')
    after=pd.read_json(R/'engine_after.json');proposed=after[after.method=='proposed'].reset_index(drop=True)
    ranks=[]
    for method in ('equal_weight','risk_only'):
        other=after[after.method==method].reset_index(drop=True)
        mask=proposed.eligible
        jac=[len(set(a)&set(b))/len(set(a)|set(b)) for a,b in zip(proposed.loc[mask,'ids'],other.loc[mask,'ids'])]
        top=[a[0]==b[0] for a,b in zip(proposed.loc[mask,'ids'],other.loc[mask,'ids'])]
        ranks.append(dict(baseline=method,eligible_profiles=int(mask.sum()),mean_jaccard=np.mean(jac),top1_agreement=np.mean(top)))
    pd.DataFrame(ranks).to_csv(R/'ranking_comparison.csv',index=False,mode='x')
    controlled=[]
    for stage in ('before','after'):
        d=pd.read_json(R/f'llm_controlled_{stage}.json')
        for mode,g in d.groupby('mode'):controlled.append(dict(stage=stage,case=mode,n=len(g),accepted=int(g.accepted.sum()),rejected=int((~g.accepted).sum())))
    pd.DataFrame(controlled).to_csv(R/'controlled_summary.csv',index=False,mode='x')
    live=json.loads((R/'live_125.json').read_text());d=pd.DataFrame(live['rows'])
    def schema(raw):
        if not isinstance(raw,dict) or set(raw)!={'facts','templateId'} or raw['templateId'] not in ('standard','concise'):return False
        f=raw['facts'];types={'healthScore':(int,float),'forecastTotal':(int,float),'investmentEligible':bool,'productName':(str,type(None)),'allocationAmount':(int,float)}
        return isinstance(f,dict) and set(f)==set(types) and all(isinstance(f[k],v) and (not isinstance(f[k],bool) if k not in ('investmentEligible','productName') else True) for k,v in types.items())
    d['strict_schema_pass']=d.raw.map(schema)
    rows=[]
    for group,sub in [('all',d)]+[(str(seed),g) for seed,g in d.groupby('seed')]:
        rows.append(dict(seed=group,n=len(sub),api_success=int(sub.api_success.sum()),strict_schema_pass=int(sub.strict_schema_pass.sum()),
            raw_facts_faithful=int((sub.facts_faithful&sub.strict_schema_pass).sum()),accepted=int((~sub.fallback).sum()),fallback=int(sub.fallback.sum()),
            timeout=int(sub.error.str.contains('abort|timeout',case=False,regex=True).sum()),latency_mean_ms=sub.latency_ms.mean(),latency_p95_ms=sub.latency_ms.quantile(.95),
            successful_api_latency_mean_ms=sub.loc[sub.api_success,'latency_ms'].mean()))
    pd.DataFrame(rows).to_csv(R/'live_summary.csv',index=False,mode='x')
    proc=subprocess.run(['node','--test','server/tests/engineExplanation.test.cjs','server/tests/routerSafety.test.cjs'],cwd=ROOT,text=True,capture_output=True)
    (R/'node_tests.txt').write_text(proc.stdout+proc.stderr,encoding='utf-8');assert proc.returncode==0,proc.stdout
    print(computed.to_string(index=False));print(pd.DataFrame(rows).to_string(index=False))


if __name__=='__main__':main()
