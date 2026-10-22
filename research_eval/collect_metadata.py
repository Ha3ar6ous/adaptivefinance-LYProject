import csv, hashlib, importlib.metadata, json, platform, statistics, subprocess, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'research_eval'))
from evaluate_python import metrics
def rows(p):
    with p.open(encoding='utf-8-sig') as f:return list(csv.DictReader(f))
files=sorted((ROOT/'data').rglob('*.csv'));allrows=[r for p in files for r in rows(p)];values=[float(r['income']) for r in allrows]
out={'evaluation_python':sys.version,'platform':platform.platform(),'node':subprocess.check_output(['node','--version'],text=True).strip(),'commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'income_dataset':{'files':len(files),'rows':len(allrows),'mean':statistics.mean(values),'median':statistics.median(values),'min':min(values),'max':max(values),'canonical_platforms':sorted({r.get('platform','').lower() for r in allrows}),'unique_date_income_platform':len({(r['date'],r['income'],r.get('platform','').lower()) for r in allrows})}}
out['identical_income_series']=[]
for p in (ROOT/'data/volatility').glob('*.csv'):
    a=[r['income'] for r in rows(p)]
    for q in (ROOT/'data/normal').glob('*.csv'):
        if a==[r['income'] for r in rows(q)]:out['identical_income_series'].append([str(p.relative_to(ROOT)),str(q.relative_to(ROOT))])
out['hashes']={str(p.relative_to(ROOT)).replace('\\','/'):hashlib.sha256(p.read_bytes()).hexdigest() for p in [ROOT/'server/data/seed/investments-mod.csv',*sorted((ROOT/'server/services').glob('*.js')),*sorted((ROOT/'ml_service/modules').glob('*.py'))]}
paper=Path('C:/Users/Ritesh/Downloads/LYProject_RPP_FinalDraft_Grp20.pdf');out['paper_sha256']=hashlib.sha256(paper.read_bytes()).hexdigest()
out['server_installed_dependencies']={k:json.loads((ROOT/'server/node_modules'/k/'package.json').read_text())['version'] for k in ['mongoose','dotenv','express']}
p=json.loads((ROOT/'research_eval/python_results.json').read_text());out['majority_baselines']={}
for split in ['all_common','chronological_test']:
    truth=[]
    for file in (ROOT/'data/volatility').glob('*.csv'):
        rr=rows(file);truth.extend(r['volatility_label_stat'] for r in rr[29 if split=='all_common' else 60:])
    out['majority_baselines'][split]=metrics(truth,['high']*len(truth))
(ROOT/'research_eval/metadata.json').write_text(json.dumps(out,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in out.items() if k!='hashes'},indent=2))
