"""Multi-horizon chronological benchmark. Every output is new/exclusive."""
import os
for key in ['OMP_NUM_THREADS','OPENBLAS_NUM_THREADS','MKL_NUM_THREADS']:os.environ.setdefault(key,'1')
import argparse,csv,hashlib,importlib.metadata as md,importlib.util,json,math,sys,time,warnings
from datetime import date
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from statsmodels.tsa.exponential_smoothing.ets import ETSModel
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.statespace.sarimax import SARIMAX

ROOT=Path(__file__).resolve().parents[1];SEEDS=[11,23,37,53,71];HORIZONS=[7,15,30]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def dump(path,data):
    with path.open('x',encoding='utf-8') as f:json.dump(data,f,indent=2,allow_nan=False)
def save_csv(path,rows):
    if isinstance(rows,pd.DataFrame):
        with path.open('x',newline='',encoding='utf-8') as f:rows.to_csv(f,index=False)
    else:
        with path.open('x',newline='',encoding='utf-8') as f:
            w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
def read_data():
    data={}
    for path in sorted((ROOT/'data/normal').glob('*.csv')):
        frame=pd.read_csv(path).sort_values('date').reset_index(drop=True)
        dates=[date.fromisoformat(v) for v in frame.date]
        assert all((b-a).days==1 for a,b in zip(dates,dates[1:])),path
        assert np.isfinite(frame.income).all() and (frame.income>=0).all()
        platforms=set(frame.platform.str.lower());assert len(platforms)==1
        data[path.name]={'rows':frame.to_dict('records'),'y':frame.income.to_numpy(float),'platform':next(iter(platforms)),'sha256':sha(path)}
    return data
def configs():
    out=[{'name':'original','kind':'original'},{'name':'naive','kind':'naive'},{'name':'seasonal_naive_7','kind':'seasonal'},{'name':'historical_mean','kind':'mean'},
         *[{'name':f'ma_{w}','kind':'moving','window':w} for w in [7,14,30]],{'name':'median','kind':'median'},{'name':'mean_median_075','kind':'blend'},
         {'name':'ets_level','kind':'ets','trend':None,'seasonal':None,'damped':False},
         {'name':'ets_damped','kind':'ets','trend':'add','seasonal':None,'damped':True},
         {'name':'ets_weekly','kind':'ets','trend':None,'seasonal':'add','damped':False},
         {'name':'arima_100','kind':'arima','order':[1,0,0],'trend':'c'},
         {'name':'arima_011','kind':'arima','order':[0,1,1],'trend':'n'},
         {'name':'sarima_100_1007','kind':'sarima','order':[1,0,0],'seasonal_order':[1,0,0,7],'trend':'c'},
         {'name':'sarima_011_0117','kind':'sarima','order':[0,1,1],'seasonal_order':[0,1,1,7],'trend':'n'}]
    out += [{'name':f'gb_{loss}_d{depth}','kind':'gb','loss':loss,'depth':depth} for loss in ['squared_error','huber','quantile'] for depth in [1,2]]
    return out
def origins(n,split,h):
    start,end={'validation':(28,60),'calibration':(60,90),'test':(90,n)}[split]
    return list(range(start,end-h+1,h if split=='calibration' else 3))
def lag_features(values,weekday):
    y=np.asarray(values,float);assert len(y)>=14
    return [*[y[-lag] for lag in [1,2,3,7,14]],*[v for w in [7,14] for v in [np.mean(y[-w:]),np.std(y[-w:],ddof=1)]],np.mean(y[-14:]==0),math.sin(weekday*2*math.pi/7),math.cos(weekday*2*math.pi/7)]
def point_predict(rows,c,seed,original):
    y=np.array([float(r['income']) for r in rows]);scale=max(float(np.mean(y)),1.);z=y/scale;h=30;model=None
    kind=c['kind']
    if kind=='original':p=[v['income'] for v in original.forecast_income(rows,h)['points']]
    elif kind=='naive':p=np.repeat(y[-1],h)
    elif kind=='seasonal':p=[y[-7+i%7] for i in range(h)]
    elif kind=='mean':p=np.repeat(np.mean(y),h)
    elif kind=='moving':p=np.repeat(np.mean(y[-c['window']:]),h)
    elif kind=='median':p=np.repeat(np.median(y),h)
    elif kind=='blend':p=np.repeat(.25*np.mean(y)+.75*np.median(y),h)
    elif kind=='ets':
        model=ETSModel(z,error='add',trend=c['trend'],damped_trend=c['damped'],seasonal=c['seasonal'],seasonal_periods=7 if c['seasonal'] else None,initialization_method='estimated').fit(maxiter=200,disp=False)
        p=np.asarray(model.forecast(h))*scale
    elif kind=='arima':
        model=ARIMA(z,order=tuple(c['order']),trend=c['trend'],enforce_stationarity=True,enforce_invertibility=True).fit(method_kwargs={'maxiter':100})
        p=np.asarray(model.forecast(h))*scale
    elif kind=='sarima':
        model=SARIMAX(z,order=tuple(c['order']),seasonal_order=tuple(c['seasonal_order']),trend=c['trend'],enforce_stationarity=True,enforce_invertibility=True).fit(disp=False,maxiter=100)
        p=np.asarray(model.forecast(h))*scale
    elif kind=='gb':
        x=np.asarray([lag_features(z[:t],date.fromisoformat(str(rows[t]['date'])).weekday()) for t in range(14,len(z))]);target=z[14:]
        model=GradientBoostingRegressor(loss=c['loss'],alpha=.5 if c['loss']=='quantile' else .9,max_depth=c['depth'],n_estimators=80,learning_rate=.05,min_samples_leaf=5,subsample=.8,random_state=seed)
        model.fit(x,target);history=list(z);last=date.fromisoformat(str(rows[-1]['date']));p=[]
        for day in range(1,h+1):
            value=max(float(model.predict([lag_features(history,(last.weekday()+day)%7)])[0]),0)
            history.append(value);p.append(value*scale)
    else:raise ValueError(kind)
    p=np.asarray(p,float)
    if p.shape!=(30,) or not np.isfinite(p).all():raise ValueError('nonfinite or wrong-length forecast')
    convergence=getattr(model,'mle_retvals',{}).get('converged',None) if model is not None else None
    return np.round(np.maximum(p,0),2).tolist(),None if convergence is None else bool(convergence)
class Runner:
    def __init__(self,out):
        self.out=out;self.data=read_data();self.events=[]
        spec=importlib.util.spec_from_file_location('frozen_production_forecast',out/'baseline_forecast.py');self.original=importlib.util.module_from_spec(spec);spec.loader.exec_module(self.original)
        self.signature=sha(Path(__file__));self.protocol=sha(ROOT/'forecast_audit/PROTOCOL.md');self.source=sha(out/'baseline_forecast.py')
        (out/'cache').mkdir(exist_ok=True)
    def forecast(self,file,origin,c,seed):
        rows=self.data[file]['rows'][:origin];key={'rows':rows,'config':c,'seed':seed,'code':self.signature,'source':self.source}
        digest=hashlib.sha256(json.dumps(key,sort_keys=True).encode()).hexdigest();cache=self.out/'cache'/f'{digest}.json'
        if cache.exists():r=json.loads(cache.read_text())
        else:
            start=time.perf_counter();error='';converged=None
            with warnings.catch_warnings(record=True) as ws:
                warnings.simplefilter('always')
                try:p,converged=point_predict(rows,c,seed,self.original)
                except Exception as e:
                    error=f'{type(e).__name__}: {e}';p=[round(float(np.mean([r['income'] for r in rows])),2)]*30
            r={'prediction':p,'error':error,'converged':converged,'warnings':sorted(set(str(w.message) for w in ws)),'seconds':time.perf_counter()-start}
            dump(cache,r)
        self.events.append({'file':file,'origin':origin,'method':c['name'],'seed':seed,'fallback':bool(r['error']),'error':r['error'],'converged':r['converged'],'warnings':' // '.join(r['warnings']),'seconds':r['seconds']})
        return np.array(r['prediction']),bool(r['error'])
    def generate(self,split):
        output=[]
        for c in configs():
            method_start=time.perf_counter()
            for file,s in self.data.items():
                schedule={h:origins(len(s['y']),split,h) for h in HORIZONS};all_origins=sorted(set(o for v in schedule.values() for o in v))
                for origin in all_origins:
                    predictions={};failures={}
                    for seed in SEEDS if c['kind']=='gb' else [None]:
                        p,fallback=self.forecast(file,origin,c,seed);label=str(seed) if seed is not None else 'deterministic';predictions[label]=p;failures[label]=fallback
                    if c['kind']=='gb':
                        predictions['ensemble']=np.round(np.mean(list(predictions.values()),axis=0),2);failures['ensemble']=any(failures.values())
                    y=s['y'];mase=float(np.mean(np.abs(y[7:origin]-y[:origin-7])));past_scale=max(float(np.std(y[max(0,origin-30):origin],ddof=1)),1.)
                    for h,os_ in schedule.items():
                        if origin not in os_:continue
                        for seed,p in predictions.items():
                            for lead in range(1,h+1):
                                target=origin+lead-1
                                output.append({'split':split,'file':file,'platform':s['platform'],'method':c['name'],'seed':seed,'horizon':h,'origin':origin,'origin_date':s['rows'][origin]['date'],'lead':lead,'target_date':s['rows'][target]['date'],'actual':y[target],'prediction':p[lead-1],'mase_scale':mase,'interval_scale':past_scale,'fallback':failures[seed]})
            print(f'{split} {c["name"]}: {time.perf_counter()-method_start:.2f}s',flush=True)
        return pd.DataFrame(output)
def metrics(g):
    y=g.actual.to_numpy(float);p=g.prediction.to_numpy(float);e=p-y;den=np.abs(y)+np.abs(p);scale=g.mase_scale.to_numpy(float);valid=scale>0
    return {'mae':float(np.mean(np.abs(e))),'rmse':float(np.sqrt(np.mean(e*e))),'smape':float(np.mean(np.divide(200*np.abs(e),den,out=np.zeros_like(e),where=den>0))),'mase':float(np.mean(np.abs(e[valid])/scale[valid])) if valid.any() else None,'mase_n':int(valid.sum()),'n_forecast_instances':len(g),'n_windows':len(g[['file','origin']].drop_duplicates()),'n_unique_targets':len(g[['file','target_date']].drop_duplicates())}
def operational(frame):return frame[frame.seed.isin(['deterministic','ensemble'])]
def aggregate(frame):
    rows=[]
    for scope,cols in [('pooled',[]),('platform',['platform']),('file',['file'])]:
        for keys,g in frame.groupby(['method','seed','horizon']+cols,sort=False):
            method,seed,h,*extra=keys;rows.append({'scope':scope,'group':extra[0] if extra else 'all','method':method,'seed':seed,'horizon':h,**metrics(g)})
    return pd.DataFrame(rows)
def frozen_inputs(r,selection):
    assert selection['protocol_sha256']==r.protocol,'protocol changed after selection'
    assert selection['runner_sha256']==r.signature,'runner changed after selection'
    assert selection['data_sha256']=={k:v['sha256'] for k,v in r.data.items()},'data changed after selection'
def select(r):
    assert not (r.out/'selection.json').exists(),'selection already recorded; use a new output directory'
    data=r.generate('validation');summary=aggregate(data);primary=summary[(summary.scope=='pooled')&summary.seed.isin(['deterministic','ensemble'])]
    baseline=primary[primary.method=='historical_mean'].set_index('horizon');scores=[]
    for c in configs():
        rows=primary[primary.method==c['name']].set_index('horizon')
        score=float(np.mean([rows.loc[h,'mae']/baseline.loc[h,'mae']+rows.loc[h,'rmse']/baseline.loc[h,'rmse'] for h in HORIZONS]));scores.append({'method':c['name'],'validation_objective':score})
    chosen=min(scores,key=lambda v:v['validation_objective'])['method'];rows=primary[primary.method==chosen].set_index('horizon');original=primary[primary.method=='original'].set_index('horizon')
    eligible=all(rows.loc[h,k]<baseline.loc[h,k] and rows.loc[h,k]<original.loc[h,k] for h in HORIZONS for k in ['mae','rmse'])
    events=pd.DataFrame(r.events).drop_duplicates(['file','origin','method','seed']);eligible=bool(eligible and not events[events.method==chosen].fallback.any())
    save_csv(r.out/'validation_predictions.csv',data);save_csv(r.out/'validation_metrics.csv',summary);save_csv(r.out/'validation_selection_scores.csv',scores);save_csv(r.out/'validation_fit_events.csv',events)
    selection={'selected_method':chosen,'validation_deployment_gate_passed':eligible,'objective':'equal horizon average (MAE/mean_MAE + RMSE/mean_RMSE)','scores':scores,'seeds':SEEDS,'horizons':HORIZONS,'protocol_sha256':r.protocol,'runner_sha256':r.signature,'data_sha256':{k:v['sha256'] for k,v in r.data.items()},'source_sha256':r.source,'versions':{pkg:md.version(pkg) for pkg in ['numpy','scipy','pandas','statsmodels','scikit-learn']}}
    dump(r.out/'selection.json',selection);print(json.dumps({'selected':chosen,'validation_gate':eligible},indent=2),flush=True)
def calibrate(r):
    selection=json.loads((r.out/'selection.json').read_text());frozen_inputs(r,selection);data=r.generate('calibration');primary=operational(data);qs=[]
    for (method,seed,h),g in primary.groupby(['method','seed','horizon'],sort=False):
        score=np.sort(np.abs(g.actual-g.prediction)/g.interval_scale);m=len(score)
        for alpha in [.1,.05]:
            rank=math.ceil((m+1)*(1-alpha));q=float(score[rank-1]) if rank<=m else None
            qs.append({'method':method,'seed':seed,'horizon':h,'alpha':alpha,'nominal_coverage':1-alpha,'n_scores':m,'rank':rank,'q':q})
    save_csv(r.out/'calibration_predictions.csv',data);save_csv(r.out/'conformal_quantiles.csv',qs);save_csv(r.out/'calibration_fit_events.csv',pd.DataFrame(r.events).drop_duplicates(['file','origin','method','seed']))
    dump(r.out/'calibration_frozen.json',{'selection_sha256':sha(r.out/'selection.json'),'quantiles_sha256':sha(r.out/'conformal_quantiles.csv')})
def test(r):
    selection=json.loads((r.out/'selection.json').read_text());frozen_inputs(r,selection);frozen=json.loads((r.out/'calibration_frozen.json').read_text());assert frozen['selection_sha256']==sha(r.out/'selection.json');assert frozen['quantiles_sha256']==sha(r.out/'conformal_quantiles.csv')
    data=r.generate('test');save_csv(r.out/'test_predictions.csv',data);save_csv(r.out/'test_fit_events.csv',pd.DataFrame(r.events).drop_duplicates(['file','origin','method','seed']))
    dump(r.out/'test_frozen.json',{'selection_sha256':sha(r.out/'selection.json'),'quantiles_sha256':sha(r.out/'conformal_quantiles.csv'),'predictions_sha256':sha(r.out/'test_predictions.csv')})
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('phase',choices=['select','calibrate','test']);parser.add_argument('--out',type=Path,required=True);args=parser.parse_args();runner=Runner(args.out);{'select':select,'calibrate':calibrate,'test':test}[args.phase](runner)
