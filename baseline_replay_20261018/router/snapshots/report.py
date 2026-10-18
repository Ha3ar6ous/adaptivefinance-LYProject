"""Write reviewable paper tables, Pareto matrices and test logs; no overwrite."""
import argparse
import json
import os
import subprocess
import sys

import pandas as pd

import simulate as s

RATE_COLUMNS=['shortfall_rate','forced_liquidation_rate','shortfall_or_liquidation_rate','ever_cleared','initial_cleared','cleared_user_months','ever_contributed']


def percent(d):
    d=d.copy()
    for k in RATE_COLUMNS:
        if k in d:d.rename(columns={k:k+'_percent'},inplace=True);d[k+'_percent']*=100
    return d


def main(out):
    dest=out/'final_tables';dest.mkdir(exist_ok=False)
    mean=pd.read_csv(out/'test_mean.csv');sd=pd.read_csv(out/'test_sd.csv')
    percent(mean).to_csv(dest/'all_scenarios_mean.csv',index=False,mode='x')
    percent(sd).to_csv(dest/'all_scenarios_seed_sd.csv',index=False,mode='x')
    for mode in ('engine_budget','reserve_free'):
        percent(mean[(mean.scenario=='central')&(mean.execution==mode)]).to_csv(dest/f'central_{mode}.csv',index=False,mode='x')
    grid=pd.read_csv(out/'validation_pareto_grid.csv')
    choices=json.loads((out/'selection.json').read_text())['choices']
    grid['production_threshold']=(grid.L==3)&(grid.D==.5)
    grid['selected']=grid.apply(lambda r:choices[r.execution] is not None and r.L==choices[r.execution]['L'] and r.D==choices[r.execution]['D'],axis=1)
    percent(grid).to_csv(dest/'validation_threshold_tradeoffs.csv',index=False,mode='x')
    percent(grid[grid.pareto]).to_csv(dest/'validation_pareto_frontier.csv',index=False,mode='x')
    for mode,d in grid.groupby('execution'):
        for metric in ['shortfall_rate','forced_liquidation_rate','ever_contributed','ever_cleared','final_net_wealth']:
            g=d.copy()
            if metric in RATE_COLUMNS:g[metric]*=100
            g.pivot(index='L',columns='D',values=metric).to_csv(dest/f'validation_{mode}_{metric}_matrix.csv',mode='x')
    delta=pd.read_csv(out/'test_paired_deltas.csv')
    delta['unit']=delta.metric.map(lambda k:'percentage points' if k in RATE_COLUMNS else 'months' if k.startswith('months_') else 'initial-expense multiples' if k=='wealth_expense_ratio' else 'INR')
    for field in ('mean_delta','lower95','upper95'):
        delta.loc[delta.metric.isin(RATE_COLUMNS),field]*=100
    delta.to_csv(dest/'paired_effects_95ci.csv',index=False,mode='x')
    cohorts=json.loads((out/'validation_cohorts.json').read_text())+json.loads((out/'test_cohorts.json').read_text())
    # Nested source/regime counts retained in original JSON; scalar incidence table here.
    s.save(dest/'generative_event_counts.csv',[{k:v for k,v in r.items() if not isinstance(v,list)} for r in cohorts])
    tests_env=os.environ.copy();tests_env['ROUTER_SIM_RESULTS']=str(out.relative_to(s.ROOT))
    command=[sys.executable,'-m','unittest','discover','-s','router_sim','-p','test_*.py','-v']
    test=subprocess.run(command,cwd=s.ROOT,env=tests_env,text=True,capture_output=True)
    with (dest/'tests.txt').open('x',encoding='utf-8') as f:f.write(test.stdout+test.stderr)
    s.dump(dest/'test_execution.json',dict(command=command,exit_code=test.returncode))
    print(test.stdout+test.stderr)
    if test.returncode:raise SystemExit(test.returncode)
    s.dump(dest/'run_counts.json',dict(validation_rows=len(pd.read_csv(out/'validation_per_seed.csv')),
        test_rows=len(pd.read_csv(out/'test_per_seed.csv')),validation_households_per_policy=50000,test_households_per_policy_per_scenario=50000,
        distinct_seed_cohorts=10,source_donors=11))
    s.dump(dest/'all_results_sha256.json',{str(p.relative_to(out)).replace('\\','/'):s.sha(p) for p in out.rglob('*') if p.is_file()})
    print('Tables:',dest)


if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--out',required=True)
    args=parser.parse_args();main((s.ROOT/args.out).resolve())
