"""Retain assertion logs/counts, including the known out-of-scope zero-income check."""
import json,re,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
commands={
 'new_python':[sys.executable,'-m','unittest','discover','-s','paper_audit','-p','test_experiments.py','-v'],
 'new_node':['node','--test','server/tests/routerSafety.test.cjs'],
 'retained_python':[sys.executable,'-m','unittest','discover','-s','research_eval','-p','evaluate_python.py','-v'],
}
result={}
for name,cmd in commands.items():
    run=subprocess.run(cmd,cwd=ROOT,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
    (ROOT/'paper_audit'/f'{name}_tests.log').write_text(run.stdout,encoding='utf-8')
    if 'node' in name:
        total=int(re.search(r'# tests (\d+)',run.stdout)[1]);passed=int(re.search(r'# pass (\d+)',run.stdout)[1]);failed=int(re.search(r'# fail (\d+)',run.stdout)[1]);errors=0
    else:
        total=int(re.search(r'Ran (\d+) tests?',run.stdout)[1]);failed=int(re.search(r'failures=(\d+)',run.stdout)[1]) if re.search(r'failures=(\d+)',run.stdout) else 0;errors=int(re.search(r'errors=(\d+)',run.stdout)[1]) if re.search(r'errors=(\d+)',run.stdout) else 0;passed=total-failed-errors
    result[name]={'command':cmd,'exit_code':run.returncode,'total':total,'passed':passed,'failed':failed,'errors':errors}
result['unique_total']={k:sum(v[k] for v in result.values()) for k in ['total','passed','failed','errors']}
(ROOT/'paper_audit/test_results.json').write_text(json.dumps(result,indent=2),encoding='utf-8');print(json.dumps(result,indent=2))
if result['unique_total']['failed'] or result['unique_total']['errors']:raise SystemExit(1)
