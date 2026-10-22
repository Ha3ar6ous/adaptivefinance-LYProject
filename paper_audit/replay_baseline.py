"""Replay historical numeric baselines from archived implementation sources."""
import hashlib,importlib.util,json,math,statistics as st,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'paper_audit'))
from experiments import load_data,error_metrics
def module(name,file):
    spec=importlib.util.spec_from_file_location(name,file);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
oldforecast=module('oldforecast',ROOT/'paper_audit/baseline/forecast.py')
oldvol=module('oldvol',ROOT/'paper_audit/baseline/volatility.py')
# Archived module path moves ARTIFACT_PATH; baseline capture recorded artifact absence.
oldvol.ARTIFACT_PATH=ROOT/'ml_service/artifacts/volatility_model.json'
assert not oldvol.ARTIFACT_PATH.exists(),'Baseline used default thresholds; current artifact would change replay.'
errors={k:[] for k in ['historical_mean','moving_average_14','seasonal_naive_7','proposed']};windows=0
for name,rows in load_data('data/normal').items():
    for origin in range(60,len(rows)-14,15):
        train=rows[:origin];y=[float(r['income']) for r in train];actual=[float(r['income']) for r in rows[origin:origin+15]];windows+=1
        pred={'historical_mean':[st.mean(y)]*15,'moving_average_14':[st.mean(y[-14:])]*15,'seasonal_naive_7':[y[-7+i%7] for i in range(15)],'proposed':[p['income'] for p in oldforecast.forecast_income(train,15)['points']]}
        for k,values in pred.items():errors[k].extend(p-a for p,a in zip(values,actual))
truth=[];pred=[]
for name,rows in load_data('data/volatility').items():
    for i in range(29,len(rows)):truth.append(rows[i]['volatility_label']);pred.append(oldvol.classify_volatility(rows[:i+1])['label'])
result={'forecast':{k:{**error_metrics(e),'windows':windows} for k,e in errors.items()},'volatility':{'n':len(truth),'correct':sum(a==b for a,b in zip(truth,pred)),'accuracy':sum(a==b for a,b in zip(truth,pred))/len(truth)}}
captured=json.loads((ROOT/'paper_audit/baseline/python_results.json').read_text())
for k,r in result['forecast'].items():
    for metric in ['mae','rmse']:assert math.isclose(r[metric],captured['forecast'][k][metric],abs_tol=1e-10)
assert result['volatility']['correct']==162 and result['volatility']['n']==455
(ROOT/'paper_audit/baseline_replay.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps(result,indent=2))
