"""Capture hashes and baseline without changing earlier output artifacts."""
import argparse,csv,hashlib,importlib.util,json,math,statistics as st,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def preserved():
    paths=[]
    for folder in ['research_eval','paper_audit','data']:
        paths.extend(p for p in (ROOT/folder).rglob('*') if p.is_file() and '__pycache__' not in p.parts)
    paths.extend(ROOT/n for n in ['amend_test.md','PAPER_METRICS_AUDIT.md','README.md','ml_service/modules/forecast.py','ml_service/requirements.txt','server/services/decisionRouterService.js','server/services/investmentEngineService.js','server/controllers/investmentController.js','server/package.json'])
    return {str(p.relative_to(ROOT)).replace('\\','/'):sha(p) for p in sorted(set(paths)) if p.exists()}
def create(out):
    out.mkdir(parents=True,exist_ok=False)
    snapshot=preserved();(out/'preserved_manifest.json').write_text(json.dumps(snapshot,indent=2),encoding='utf-8')
    source=ROOT/'ml_service/modules/forecast.py';(out/'baseline_forecast.py').write_bytes(source.read_bytes())
    spec=importlib.util.spec_from_file_location('frozen_baseline',source);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
    errs={k:[] for k in ['original','historical_mean']};windows=0;inventory=[]
    for path in sorted((ROOT/'data/normal').glob('*.csv')):
        with path.open(encoding='utf-8-sig') as f:rows=sorted(list(csv.DictReader(f)),key=lambda x:x['date'])
        y=[float(r['income']) for r in rows];dates=[r['date'] for r in rows]
        inventory.append({'file':str(path.relative_to(ROOT)).replace('\\','/'),'n':len(rows),'platforms':sorted({r['platform'].lower() for r in rows}),'sha256':sha(path),'first_date':dates[0],'last_date':dates[-1]})
        for origin in range(60,len(rows)-14,15):
            windows+=1;actual=y[origin:origin+15]
            predictions={'original':[p['income'] for p in m.forecast_income(rows[:origin],15)['points']],'historical_mean':[st.mean(y[:origin])]*15}
            for k,p in predictions.items():errs[k].extend(a-b for a,b in zip(p,actual))
    metrics={k:{'n':len(e),'windows':windows,'mae':st.mean(abs(v) for v in e),'rmse':math.sqrt(st.mean(v*v for v in e))} for k,e in errs.items()}
    previous=json.loads((ROOT/'paper_audit/baseline_replay.json').read_text())['forecast']
    for k,old in [('original','proposed'),('historical_mean','historical_mean')]:
        for metric in ['mae','rmse']:assert math.isclose(metrics[k][metric],previous[old][metric],abs_tol=1e-10)
    with (out/'baseline_reproduction.json').open('x',encoding='utf-8') as f:json.dump({'metrics':metrics,'inventory':inventory,'git_commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'python':sys.version},f,indent=2)
    print(json.dumps(metrics,indent=2))
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--out',type=Path,required=True);parser.add_argument('--verify',action='store_true');a=parser.parse_args()
    if a.verify:
        expected=json.loads((a.out/'preserved_manifest.json').read_text());bad=[p for p,v in expected.items() if not (ROOT/p).exists() or sha(ROOT/p)!=v]
        print(json.dumps({'preserved_files':len(expected),'changed':bad}));raise SystemExit(bool(bad))
    create(a.out)
