"""Run original audit before fixes, preserve prior deliverables byte-for-byte."""
import hashlib,json,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'paper_audit/baseline';OUT.mkdir(parents=True,exist_ok=True)
if (OUT/'manifest.json').exists():
    raise SystemExit('Baseline already captured. Refusing to overwrite archived source/results. Use replay_baseline.py to verify.')
sources=['server/services/decisionRouterService.js','ml_service/modules/forecast.py','ml_service/modules/volatility.py']
manifest={}
for rel in sources:
    source=ROOT/rel;dest=OUT/Path(rel).name;dest.write_bytes(source.read_bytes())
    manifest[rel]={'snapshot':str(dest.relative_to(ROOT)),'sha256':hashlib.sha256(source.read_bytes()).hexdigest()}
for script,result,command in [('research_eval/evaluate_python.py','python_results.json',[sys.executable,'research_eval/evaluate_python.py','--check']),('research_eval/evaluate_node.cjs','node_results.json',['node','research_eval/evaluate_node.cjs','--check'])]:
    original=ROOT/'research_eval'/result;saved=original.read_bytes()
    try:
        run=subprocess.run(command,cwd=ROOT,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
        (OUT/(result+'.log')).write_text(run.stdout,encoding='utf-8')
        (OUT/result).write_bytes(original.read_bytes())
        manifest[script]={'command':command,'exit_code':run.returncode}
    finally:original.write_bytes(saved)
legacy=subprocess.run([sys.executable,'eval_script.py'],cwd=ROOT,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
(OUT/'legacy_eval.log').write_text(legacy.stdout,encoding='utf-8')
manifest['legacy']={'exit_code':legacy.returncode}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
p=json.loads((OUT/'python_results.json').read_text());n=json.loads((OUT/'node_results.json').read_text())
print(json.dumps({'forecast':{m:{k:v for k,v in p['forecast'][m].items() if k!='window_results'} for m in ['historical_mean','proposed']},'router':{k:n['router'][k] for k in ['n','implemented','conservative','unknown_allowed','ml_outage']},'tests_python':p['tests']['total'],'tests_node':n['test_summary']},indent=2))
