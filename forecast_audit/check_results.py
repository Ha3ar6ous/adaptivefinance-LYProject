"""Run/capture the final suite and verify preservation; no old result writes."""
import argparse,json,os,re,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--out',type=Path,required=True);a=p.parse_args();out=a.out
env=os.environ.copy();env['FORECAST_AUDIT_OUT']=str(out.resolve())
cmd=[sys.executable,'-m','unittest','discover','-s','forecast_audit','-p','test_forecast.py','-v']
run=subprocess.run(cmd,cwd=ROOT,env=env,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
with (out/'tests.log').open('x',encoding='utf-8') as f:f.write(run.stdout)
total=int(re.search(r'Ran (\d+) tests?',run.stdout)[1]);failed=int(re.search(r'failures=(\d+)',run.stdout)[1]) if re.search(r'failures=(\d+)',run.stdout) else 0;errors=int(re.search(r'errors=(\d+)',run.stdout)[1]) if re.search(r'errors=(\d+)',run.stdout) else 0;skipped=int(re.search(r'skipped=(\d+)',run.stdout)[1]) if re.search(r'skipped=(\d+)',run.stdout) else 0
with (out/'tests.json').open('x',encoding='utf-8') as f:json.dump({'total':total,'passed':total-failed-errors-skipped,'failed':failed,'errors':errors,'skipped':skipped,'command':cmd,'exit_code':run.returncode},f,indent=2)
print(run.stdout)
verify=subprocess.run([sys.executable,'forecast_audit/preserve.py','--out',str(out),'--verify'],cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
with (out/'preservation_verified.json').open('x',encoding='utf-8') as f:f.write(verify.stdout)
print(verify.stdout)
raise SystemExit(run.returncode or verify.returncode)
