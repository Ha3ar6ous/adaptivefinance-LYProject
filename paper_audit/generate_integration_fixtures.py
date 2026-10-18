"""Actual Python-module outputs for Node policy integration tests; no database/API."""
import json,sys
from datetime import date,timedelta
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'paper_audit'))
from experiments import load_data
sys.path.insert(0,str(ROOT/'ml_service'))
from modules.forecast import forecast_income
from modules.volatility import classify_volatility
fixtures=[]
for name,values in [('constant',[1000]*60),('zero',[0]*60),('high_volatility',[0,0,3000]*20),('insufficient',[1000]*2)]:
    rows=[{'date':str(date(2024,1,1)+timedelta(days=i)),'income':v} for i,v in enumerate(values)]
    fixtures.append({'name':name,'entries':rows,'analytics':{'forecast':forecast_income(rows,15),'volatility':classify_volatility(rows)}})
for name,rows in load_data('data/normal').items():
    rows=[{'date':r['date'],'income':float(r['income'])} for r in rows[:60]]
    fixtures.append({'name':name,'entries':rows,'analytics':{'forecast':forecast_income(rows,15),'volatility':classify_volatility(rows)}})
(ROOT/'paper_audit/integration_fixtures.json').write_text(json.dumps(fixtures,indent=2),encoding='utf-8')
print('Integration fixtures:',len(fixtures))
