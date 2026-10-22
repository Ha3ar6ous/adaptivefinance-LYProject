import os,sys,json,hashlib,subprocess,time,concurrent.futures
from pathlib import Path
R=Path.cwd(); O=R/'revision_audit/final_20261018'; O.mkdir(exist_ok=False); (O/'logs').mkdir(exist_ok=True)
exclude={'.git','node_modules','.venv','.plot_venv','__pycache__','.pytest_cache','final_20261018','dist','build','cache'}
files={}
for base,ds,fs in os.walk(R):
 ds[:]=[d for d in ds if d not in exclude]
 for f in fs:
  p=Path(base)/f
  if f.startswith('.env') or p.suffix in {'.pyc','.log'}:continue
  files[p.relative_to(R).as_posix()]=hashlib.sha256(p.read_bytes()).hexdigest()
(O/'initial_manifest.json').write_text(json.dumps(files,indent=2))
P=str(R/'forecast_audit/.venv/Scripts/python.exe'); env=os.environ.copy(); env.update(PYTHONUTF8='1',PYTHONDONTWRITEBYTECODE='1',OMP_NUM_THREADS='1',OPENBLAS_NUM_THREADS='1',MKL_NUM_THREADS='1')
commands=[]
env['ROUTER_INTEGRATION_FIXTURES']=str(O/'integration_fixtures.json')
redirect="from pathlib import Path;import runpy;R=Path.cwd();orig=Path.write_text;Path.write_text=lambda self,*a,**k:orig(R/'revision_audit/final_20261018/integration_fixtures.json',*a,**k) if self.name=='integration_fixtures.json' else orig(self,*a,**k);runpy.run_path('paper_audit/generate_integration_fixtures.py',run_name='__main__')"
subprocess.run([P,'-c',redirect],cwd=R,env=env,check=True)
def run(name,args,extra=None):
 e=env.copy();e.update(extra or {});
 if name.startswith('score_'):
  for k in ['OMP_NUM_THREADS','OPENBLAS_NUM_THREADS','MKL_NUM_THREADS']:e.pop(k,None)
 start=time.time();log=O/'logs'/f'{name}.txt'
 with log.open('x',encoding='utf-8') as h:r=subprocess.run(args,cwd=R,env=e,stdout=h,stderr=subprocess.STDOUT)
 item=dict(name=name,command=args,environment_overrides=extra or {},exit_code=r.returncode,seconds=time.time()-start,log=str(log.relative_to(R)))
 commands.append(item);(O/'commands.json').write_text(json.dumps(commands,indent=2));print(name,r.returncode,flush=True)
 return r.returncode

def job(kind,steps,extra=None):
 out='revision_audit/final_20261018/'+kind
 for i,args in enumerate(steps):
  a=[x.replace('{out}',out) for x in args]
  if run(f'{kind}_{i+1}',a,extra):return

jobs={
'forecast':[[P,'forecast_audit/preserve.py','--out','{out}']]+[[P,'forecast_audit/run.py',s,'--out','{out}'] for s in ['select','calibrate','test']]+[[P,f'forecast_audit/{s}.py','--out','{out}'] for s in ['analyze','check_results','export_tables']],
'volatility':[[P,'volatility_audit/run.py','--out','{out}','--stage',s] for s in ['prepare','select']]+[[P,'volatility_audit/compare.py','--out','{out}','--stage','freeze'],[P,'volatility_audit/run.py','--out','{out}','--stage','test'],[P,'volatility_audit/compare.py','--out','{out}','--stage','test'],[P,'volatility_audit/report.py','--out','{out}']],
'router':[[P,'router_sim/simulate.py','--out','{out}','--stage',s] for s in ['prepare','validation','test']]+[[P,f'router_sim/{s}.py','--out','{out}'] for s in ['report','finalize']],
'score':[[P,'score_audit/run.py','--out','{out}','--stage',s] for s in ['prepare','select','test']]+[[P,'-m','unittest','discover','-s','score_audit','-p','test_*.py','-v']],
'data':[[P,'data_audit/run.py','--out','{out}','--stage','clone'],[P,'data_audit/run.py','--out','{out}','--stage','evaluate'],[P,'data_audit/report.py']],
'engine':[['node','engine_llm_audit/evaluate.cjs','before','--archive-before'],['node','engine_llm_audit/evaluate.cjs','after'],['node','engine_llm_audit/orchestration.cjs'],['node','engine_llm_audit/live.cjs'],[P,'engine_llm_audit/summarize.py']],
'node_tests':[['node','--test','server/tests/engineExplanation.test.cjs','server/tests/routerSafety.test.cjs']],
'legacy_tests':[[P,'-m','unittest','discover','-s','research_eval','-p','evaluate_python.py','-v']],
'paper_tests':[[P,'-m','unittest','discover','-s','paper_audit','-p','test_*.py','-v']],
'revision_tests':[[P,'-m','unittest','discover','-s','revision_audit','-p','test_*.py','-v']],
'ablations':[[P,'revision_audit/ablate.py','--out','{out}','--no-publish']]
}
extras={'score':{'SCORE_AUDIT_RESULTS':'revision_audit/final_20261018/score'},'data':{'DATA_AUDIT_RESULTS':'revision_audit/final_20261018/data'},'engine':{'ENGINE_AUDIT_OUT':'revision_audit/final_20261018/engine'}}
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as ex:
 fut={ex.submit(job,k,v,extras.get(k)):k for k,v in jobs.items()}
 for f in concurrent.futures.as_completed(fut):
  try:f.result()
  except Exception as e:print('ERROR',fut[f],str(e),flush=True)
print('ALL INITIAL JOBS COMPLETE',flush=True)

