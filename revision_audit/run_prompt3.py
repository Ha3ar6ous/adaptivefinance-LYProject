"""Prompt3 experiment/test replay into exclusive new directories."""
import concurrent.futures
import json
import os
import subprocess
import sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'revision_audit/prompt3'
PY=sys.executable


def main():
    OUT.mkdir(exist_ok=False);(OUT/'logs').mkdir()
    env=os.environ.copy();env.update(PYTHONUTF8='1',PYTHONDONTWRITEBYTECODE='1',
        FORECAST_AUDIT_OUT=str(ROOT/'baseline_replay_20261018/forecast'),
        SCORE_AUDIT_RESULTS='revision_audit/prompt3_score',
        ROUTER_SIM_RESULTS='revision_audit/prompt3/router',VOL_AUDIT_RESULTS='revision_audit/prompt3/volatility')
    jobs={
      'router':[[PY,'router_sim/simulate.py','--out','revision_audit/prompt3/router','--stage',s] for s in ['prepare','validation','test']],
      'volatility':[[PY,'volatility_audit/run.py','--out','revision_audit/prompt3/volatility','--stage',s] for s in ['prepare','select']]+[[PY,'volatility_audit/compare.py','--out','revision_audit/prompt3/volatility','--stage','freeze'],[PY,'volatility_audit/run.py','--out','revision_audit/prompt3/volatility','--stage','test'],[PY,'volatility_audit/compare.py','--out','revision_audit/prompt3/volatility','--stage','test']],
    }
    records=[]
    def run(name,cmd):
        with (OUT/'logs'/f'{name}.txt').open('x',encoding='utf-8') as h:p=subprocess.run(cmd,cwd=ROOT,env=env,stdout=h,stderr=subprocess.STDOUT)
        records.append(dict(name=name,command=cmd,exit_code=p.returncode));print(name,p.returncode,flush=True)
        return p.returncode
    def job(name,steps):
        for i,cmd in enumerate(steps):
            if run(f'{name}_{i}',cmd):break
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as ex:list(ex.map(lambda kv:job(*kv),jobs.items()))
    for name,directory,pattern in [('forecast','forecast_audit','test_forecast.py'),('volatility','volatility_audit','test_*.py'),('router','router_sim','test_*.py'),('score','score_audit','test_score.py'),('data','data_audit','test_data.py'),('deployment','revision_audit','test_deployment.py'),('legacy_python','research_eval','evaluate_python.py'),('paper','paper_audit','test_experiments.py')]:
        run(name+'_tests',[PY,'-m','unittest','discover','-s',directory,'-p',pattern,'-v'])
    run('node_tests',['node','--test','server/tests/engineExplanation.test.cjs','server/tests/routerSafety.test.cjs'])
    (OUT/'commands.json').write_text(json.dumps(records,indent=2))


if __name__=='__main__':main()
