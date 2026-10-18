"""Separate original/canonical/new-synthetic/real-data evaluations; no tuning."""
import argparse
import hashlib
import importlib.util
import io
import json
import shutil
import sys
import urllib.request
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.metrics import f1_score,recall_score,confusion_matrix,precision_recall_fscore_support

ROOT=Path(__file__).resolve().parents[1]
PIN='4221faf501de74ecd68aec17ddf1045a29202175'
sys.path.insert(0,str(ROOT/'router_sim'));import simulate as helpers


def get(url):return urllib.request.urlopen(url,timeout=60).read()


def synthetic(seed,index):
    rng=np.random.default_rng(seed);rows=[]
    params={'blinkit':(900,.35,.85),'snabbit':(800,.4,.75),'swiggy':(1100,.3,.85),'uber':(1300,.5,.8),'zomato':(1000,.35,.85)}
    dates=pd.date_range(f'{2020+index}-01-01',periods=180)
    for platform,(base,sigma,workprob) in params.items():
        state=False
        for t,date in enumerate(dates):
            u=rng.random();state=(u>=.25) if state else (u<.05)
            worked=bool(rng.random()<workprob);outage=bool(rng.random()<.02)
            weekday=[.95,.9,.95,1.,1.1,1.25,1.2][date.weekday()]
            incentive=.15*base if date.weekday()>=4 and rng.random()<.3 and worked and not outage else 0
            income=base*weekday*(.55 if state else 1.)*(1+.0005*t)*np.exp(rng.normal(-.5*sigma*sigma,sigma))+incentive
            income=round(float(income if worked and not outage else 0),2)
            rows.append(dict(seed=seed,date=str(date.date()),platform=platform,income=income,adverse_state=state,worked=worked,outage=outage,weekday_multiplier=weekday,incentive=incentive))
    return pd.DataFrame(rows)


def prepare(out):
    out.mkdir(parents=True,exist_ok=False)
    shutil.copy2(ROOT/'data_audit/PROTOCOL.md',out/'PROTOCOL.md');shutil.copy2(ROOT/'data_audit/run.py',out/'run.py')
    shutil.copy2(ROOT/'ml_service/modules/forecast.py',out/'forecast_snapshot.py')
    raw=[];inventory=[]
    for p in sorted((ROOT/'data/normal').glob('*.csv')):
        d=pd.read_csv(p).sort_values('date');d.platform=d.platform.str.lower();d['source']=p.name
        raw.append(d);inventory.append(dict(file=p.name,platform=d.platform.iloc[0],n=len(d),sha256=helpers.sha(p)))
    raw=pd.concat(raw,ignore_index=True)
    inventory=pd.DataFrame(inventory);chosen=inventory.sort_values(['platform','n','file'],ascending=[True,False,True]).drop_duplicates('platform')
    canonical=raw[raw.source.isin(chosen.file)].copy();assert not canonical.duplicated(['platform','date']).any()
    raw['retained']=raw.source.isin(chosen.file)
    raw[['platform','date','source','income','retained']].to_csv(out/'canonicalization_rows.csv',index=False,mode='x')
    canonical.to_csv(out/'repository_canonical.csv',index=False,mode='x');inventory.to_csv(out/'source_inventory.csv',index=False,mode='x')
    groups=raw.groupby(['platform','date']).income.agg(['size','nunique'])
    helpers.dump(out/'dedupe_summary.json',dict(raw_rows=len(raw),canonical_rows=len(canonical),removed_rows=len(raw)-len(canonical),
        duplicate_key_groups=int((groups['size']>1).sum()),conflicting_income_key_groups=int((groups.nunique>1).sum()) if False else int((groups['nunique']>1).sum()),
        chosen_files=chosen.file.tolist()))
    for i,seed in enumerate([11,23,37,53,71]):synthetic(seed,i).to_csv(out/f'synthetic_seed{seed}.csv',index=False,mode='x')
    prefix=f'https://raw.githubusercontent.com/nrrb/uber-analytics-project/{PIN}/'
    license_bytes=get(prefix+'LICENSE')
    with (out/'REAL_SOURCE_LICENSE_AGPL3.txt').open('xb') as f:f.write(license_bytes)
    content=get(prefix+'data/rides.csv')
    d=pd.read_csv(io.BytesIO(content),usecols=['id','ride_start','earnings','status'])
    source_n=len(d);dups=int(d.duplicated('id').sum())
    assert d.groupby('id')[['ride_start','earnings','status']].nunique().max().max()<=1,'Conflicting trip IDs'
    d=d.drop_duplicates('id');d['date']=pd.to_datetime(d.ride_start,errors='coerce').dt.normalize()
    mask=d.date.notna()&np.isfinite(d.earnings)&(d.earnings>=0)&(d.status=='COMPLETED')
    excluded=int((~mask).sum());d=d[mask]
    daily=d.groupby('date').earnings.sum();calendar=pd.date_range(daily.index.min(),daily.index.max(),freq='D')
    real=pd.DataFrame(dict(date=calendar.strftime('%Y-%m-%d'),platform='uber_chicago_single_author',income=daily.reindex(calendar,fill_value=0).to_numpy(),recorded_trip_day=calendar.isin(daily.index)))
    real.to_csv(out/'real_uber_daily_USD_AGPL3.csv',index=False,mode='x')
    helpers.dump(out/'real_provenance.json',dict(repository='https://github.com/nrrb/uber-analytics-project',commit=PIN,url=prefix+'data/rides.csv',
        source_sha256=hashlib.sha256(content).hexdigest(),license_sha256=hashlib.sha256(license_bytes).hexdigest(),license='Repository AGPL-3.0',
        source_rows=source_n,trip_id_duplicates_removed=dups,excluded_invalid_or_noncompleted=excluded,retained_trips=len(d),daily_rows=len(real),
        observed_trip_days=int(real.recorded_trip_day.sum()),zero_filled_unrecorded_days=int((~real.recorded_trip_day).sum()),first=real.date.iloc[0],last=real.date.iloc[-1],
        currency='USD',earnings='published trip earnings including listed tips/surge, before operating costs',timezone='source naive recorded dates; not independently verified'))
    with (out/'REAL_DATA_NOTICE.md').open('x',encoding='utf-8') as f:f.write(f'# Separate real-data derivative\n\nSource: nrrb/uber-analytics-project, commit {PIN}. Repository license AGPL-3.0; license copy included. Attribution: nrrb.\nDerived file real_uber_daily_USD_AGPL3.csv aggregates published completed-trip earnings by recorded date, fills unrecorded calendar dates with zero recorded earnings, removes all addresses/locations/trip IDs. Do not interpret as verified net income or independent drivers. Original CSV remains upstream at the pinned URL in real_provenance.json. Preserve this notice/license when sharing the derivative.\n')
    helpers.dump(out/'original_dataset_sha256.json',{str(p.relative_to(ROOT)).replace('\\','/'):helpers.sha(p) for p in (ROOT/'data').rglob('*.csv')})
    print((out/'real_provenance.json').read_text())


def datasets(out):
    for name,d in helpers.sources():yield 'repository_all','INR',name,d
    d=pd.read_csv(out/'repository_canonical.csv')
    for p,g in d.groupby('platform'):yield 'repository_canonical','INR',p,g
    for seed in [11,23,37,53,71]:
        d=pd.read_csv(out/f'synthetic_seed{seed}.csv')
        for p,g in d.groupby('platform'):yield f'new_synthetic_{seed}','INR',p,g
    yield 'real_single_driver','USD','uber_chicago',pd.read_csv(out/'real_uber_daily_USD_AGPL3.csv')


def evaluate(out):
    spec=importlib.util.spec_from_file_location('frozen_forecast',out/'forecast_snapshot.py');original=importlib.util.module_from_spec(spec);spec.loader.exec_module(original)
    forecasts=[];volrows=[];inventory=[]
    for dataset,currency,name,frame in datasets(out):
        d=frame.sort_values('date').reset_index(drop=True);y=d.income.to_numpy(float);n=len(y);end=int(.6*n);test=int(.8*n)
        assert pd.to_datetime(d.date).diff().dropna().eq(pd.Timedelta(days=1)).all()
        traincv=[np.std(y[t:t+14],ddof=1)/np.mean(y[t:t+14]) for t in range(30,end-13) if np.mean(y[t:t+14])>0]
        cuts=np.quantile(traincv,[1/3,2/3]).tolist()
        inventory.append(dict(dataset=dataset,currency=currency,series=name,n=n,train_end=end,test_start=test,cv_low=cuts[0],cv_high=cuts[1],zero_days=int((y==0).sum()),training_cv_windows=len(traincv)))
        scale=float(np.mean(np.abs(y[7:end]-y[:end-7])))
        for h in [7,15,30]:
            for t in range(test,n-h+1,7):
                obs=y[:t];preds={'original':np.array([p['income'] for p in original.forecast_income(d.iloc[:t].to_dict('records'),h)['points']]),
                    'historical_mean':np.full(h,obs.mean()),'moving30':np.full(h,obs[-30:].mean()),'seasonal7':np.resize(obs[-7:],h),
                    'frozen_mean_median075':np.full(h,.25*obs.mean()+.75*np.median(obs))}
                for method,p in preds.items():
                    error=np.abs(p-y[t:t+h]);den=np.abs(p)+np.abs(y[t:t+h]);sm=np.divide(200*error,den,out=np.zeros(h),where=den>0)
                    forecasts.append(dict(dataset=dataset,currency=currency,series=name,horizon=h,origin=t,method=method,n=h,absolute_error=error.sum(),squared_error=np.square(error).sum(),smape_sum=sm.sum(),mase_sum=error.sum()/scale if scale else None))
        for t in range(test,n-13,7):
            future=y[t:t+14];unavailable=future.mean()==0
            cvfuture=None if unavailable else float(future.std(ddof=1)/future.mean())
            actual=None if unavailable else int(np.digitize(cvfuture,cuts))
            cv30=float(y[t-30:t].std(ddof=1)/y[t-30:t].mean()) if y[t-30:t].mean() else 0.
            cv14=float(y[t-14:t].std(ddof=1)/y[t-14:t].mean()) if y[t-14:t].mean() else 0.
            for method,pred in [('runtime_cv30',int(np.digitize(cv30,[.35,.75]))),('frozen_selected_cv30',int(np.digitize(cv30,[.45,.75]))),('past14_train_cutoffs',int(np.digitize(cv14,cuts)))]:
                volrows.append(dict(dataset=dataset,currency=currency,series=name,origin=t,method=method,actual=actual,prediction=pred,unavailable=unavailable))
    helpers.save(out/'series_split_inventory.csv',inventory);helpers.save(out/'forecast_windows.csv',forecasts);helpers.save(out/'volatility_predictions.csv',volrows)
    f=pd.DataFrame(forecasts);metrics=[]
    for keys,g in f.groupby(['dataset','currency','horizon','method']):
        n=int(g.n.sum());metrics.append(dict(zip(['dataset','currency','horizon','method'],keys),windows=len(g),target_pairs=n,mae=g.absolute_error.sum()/n,rmse=np.sqrt(g.squared_error.sum()/n),smape=g.smape_sum.sum()/n,mase=g.mase_sum.sum()/n if g.mase_sum.notna().all() else None))
    helpers.save(out/'forecast_metrics.csv',metrics)
    v=pd.DataFrame(volrows);summary=[];conf=[];classes=[]
    for keys,g in v.groupby(['dataset','currency','method']):
        nall=len(g);g=g[~g.unavailable];y=g.actual.astype(int);p=g.prediction;c=confusion_matrix(y,p,labels=[0,1,2]);pr,re,f1,support=precision_recall_fscore_support(y,p,labels=[0,1,2],zero_division=0)
        row=dict(zip(['dataset','currency','method'],keys),n=len(g),unavailable=nall-len(g),macro_f1=f1.mean(),high_recall=re[2] if support[2] else None,balanced_accuracy=re[support>0].mean(),accuracy=np.mean(y==p))
        summary.append(row)
        for i in range(3):
            classes.append(dict(dataset=keys[0],method=keys[2],label=i,n=int(support[i]),precision=pr[i],recall=re[i],f1=f1[i]))
            for j in range(3):conf.append(dict(dataset=keys[0],method=keys[2],actual=i,predicted=j,n=int(c[i,j])))
    helpers.save(out/'volatility_metrics.csv',summary);helpers.save(out/'volatility_perclass.csv',classes);helpers.save(out/'volatility_confusion.csv',conf)
    old=json.loads((out/'original_dataset_sha256.json').read_text());changed=[p for p,h in old.items() if helpers.sha(ROOT/p)!=h]
    helpers.dump(out/'preservation_check.json',dict(source_csvs=len(old),changed=changed));assert not changed


if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--out',required=True);p.add_argument('--stage',choices=['prepare','evaluate'],required=True)
    args=p.parse_args();(prepare if args.stage=='prepare' else evaluate)((ROOT/args.out).resolve())
