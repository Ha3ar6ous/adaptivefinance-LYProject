"""Test reporting only; never selects/tunes models or recalibrates on test."""
import argparse,json,math
from pathlib import Path
import numpy as np
import pandas as pd
from scipy.stats import t as student_t
from run import aggregate,operational,metrics,save_csv,dump,sha,SEEDS
METRICS=['mae','rmse','smape','mase']
def sufficient(g):
    e=np.abs(g.prediction.to_numpy()-g.actual.to_numpy());den=np.abs(g.prediction.to_numpy())+np.abs(g.actual.to_numpy());scale=g.mase_scale.to_numpy();valid=scale>0
    return np.array([len(g),e.sum(),(e*e).sum(),np.divide(200*e,den,out=np.zeros_like(e),where=den>0).sum(),valid.sum(),(e[valid]/scale[valid]).sum()],float)
def from_sufficient(a):
    a=np.atleast_2d(a);valid=a[:,4]>0;mase=np.divide(a[:,5],a[:,4],out=np.full(len(a),np.nan),where=valid)
    return np.column_stack([a[:,1]/a[:,0],np.sqrt(a[:,2]/a[:,0]),a[:,3]/a[:,0],mase])
def counts_for_bootstrap(n):
    return np.concatenate([np.random.default_rng(seed).multinomial(n,[1/n]*n,size=1000) for seed in SEEDS])
def bootstrap(g,ref,cluster):
    labels=sorted(g[cluster].unique());m=np.array([sufficient(g[g[cluster]==k]) for k in labels]);b=np.array([sufficient(ref[ref[cluster]==k]) for k in labels]);counts=counts_for_bootstrap(len(labels));values=from_sufficient(counts@m);difference=values-from_sufficient(counts@b)
    return values,difference,len(labels)
def metric_intervals(frame,selected):
    rows=[];deltas=[]
    for (method,h),group in frame.groupby(['method','horizon'],sort=False):
        reference=frame[(frame.method=='historical_mean')&(frame.horizon==h)]
        for scope,name,cluster,g,r in [('pooled','all','platform',group,reference)]+[('platform',p,'file',group[group.platform==p],reference[reference.platform==p]) for p in sorted(group.platform.unique())]:
            samples,diff,n=bootstrap(g,r,cluster)
            for i,metric in enumerate(METRICS):
                valid=samples[:,i][np.isfinite(samples[:,i])];dv=diff[:,i][np.isfinite(diff[:,i])]
                lo,hi=np.quantile(valid,[.025,.975]) if len(valid) and n>1 else [np.nan,np.nan]
                dlo,dhi=np.quantile(dv,[.025,.975]) if len(dv) and n>1 else [np.nan,np.nan]
                rows.append({'scope':scope,'group':name,'method':method,'horizon':h,'metric':metric,'estimate':metrics(g)[metric],'ci95_lower':lo,'ci95_upper':hi,'clusters':n,'bootstrap_replicates':5000,'bootstrap_seeds':','.join(map(str,SEEDS)),'status':'ok_small_cluster_caution' if n>1 else 'insufficient_clusters'})
                deltas.append({'scope':scope,'group':name,'method':method,'reference':'historical_mean','horizon':h,'metric':metric,'estimate_delta':metrics(g)[metric]-metrics(r)[metric] if metrics(g)[metric] is not None and metrics(r)[metric] is not None else np.nan,'ci95_lower':dlo,'ci95_upper':dhi,'clusters':n,'selected_before_test':method==selected})
    return pd.DataFrame(rows),pd.DataFrame(deltas)
def dm_statistic(d,h):
    d=np.asarray(d,float);n=len(d);m=math.ceil(h/3);lag=m-1
    if n<=2*m:return {'n_origins':n,'hac_lag':lag,'statistic':None,'p_raw':None,'status':'insufficient_origins'}
    centered=d-d.mean();lr=float(centered@centered/n)
    for k in range(1,lag+1):lr+=2*(1-k/(lag+1))*float(centered[k:]@centered[:-k]/n)
    if lr<=1e-15:return {'n_origins':n,'hac_lag':lag,'statistic':None,'p_raw':None,'status':'nonpositive_or_zero_hac_variance'}
    correction=math.sqrt((n+1-2*m+m*(m-1)/n)/n);stat=float(d.mean()/math.sqrt(lr/n)*correction)
    return {'n_origins':n,'hac_lag':lag,'statistic':stat,'p_raw':float(2*student_t.sf(abs(stat),df=n-1)),'status':'ok_small_sample_caution'}
def dm_table(frame):
    f=frame.copy();f['absolute']=(f.actual-f.prediction).abs();f['squared']=(f.actual-f.prediction)**2
    windows=f.groupby(['method','horizon','file','platform','origin_date'],as_index=False)[['absolute','squared']].mean();rows=[]
    for (method,h),g in windows.groupby(['method','horizon'],sort=False):
        if method=='historical_mean':continue
        b=windows[(windows.method=='historical_mean')&(windows.horizon==h)];paired=g.merge(b,on=['horizon','file','platform','origin_date'],suffixes=('_model','_ref'),validate='one_to_one')
        scopes=[('pooled_common','all',paired)]+[('platform_common',p,paired[paired.platform==p]) for p in sorted(paired.platform.unique())]+[('file',p,paired[paired.file==p]) for p in sorted(paired.file.unique())]
        for scope,name,data in scopes:
            nfiles=data.file.nunique();count=data.groupby('origin_date').file.nunique();keep=count[count==nfiles].index
            for loss in ['absolute','squared']:
                values=data.assign(difference=data[f'{loss}_model']-data[f'{loss}_ref']).groupby('origin_date').difference.mean().loc[keep].sort_index()
                rows.append({'scope':scope,'group':name,'method':method,'reference':'historical_mean','horizon':h,'loss':loss,'files_averaged':nfiles,'mean_loss_difference':values.mean(),**dm_statistic(values.to_numpy(),h)})
    result=pd.DataFrame(rows);result['p_bh']=np.nan;valid=result.p_raw.notna();ps=result.loc[valid,'p_raw'].to_numpy();order=np.argsort(ps);adj=np.minimum.accumulate((ps[order]*len(ps)/np.arange(1,len(ps)+1))[::-1])[::-1].clip(0,1);indices=result.index[valid].to_numpy()[order];result.loc[indices,'p_bh']=adj
    return result
def interval_tables(frame,quantiles):
    pooled=[];lead_rows=[]
    for q in quantiles.to_dict('records'):
        g=frame[(frame.method==q['method'])&(frame.horizon==q['horizon'])].copy();radius=g.interval_scale*q['q'];g['lower']=np.maximum(0,g.prediction-radius);g['upper']=g.prediction+radius
        g['covered']=((g.actual>=g.lower)&(g.actual<=g.upper)).astype(float);g['width']=g.upper-g.lower;g['interval_score']=g.width+2/q['alpha']*(np.maximum(g.lower-g.actual,0)+np.maximum(g.actual-g.upper,0))
        for scope,name,sub in [('pooled','all',g)]+[('platform',p,g[g.platform==p]) for p in sorted(g.platform.unique())]:
            pooled.append({'scope':scope,'group':name,'method':q['method'],'horizon':q['horizon'],'nominal_coverage':q['nominal_coverage'],'empirical_coverage':sub.covered.mean(),'mean_width':sub.width.mean(),'mean_interval_score':sub.interval_score.mean(),'n_forecast_instances':len(sub),'n_unique_targets':len(sub[['file','target_date']].drop_duplicates()),'calibration_scores':q['n_scores'],'calibration_quantile':q['q']})
        for lead,sub in g.groupby('lead'):lead_rows.append({'method':q['method'],'horizon':q['horizon'],'nominal_coverage':q['nominal_coverage'],'lead':lead,'coverage':sub.covered.mean(),'mean_width':sub.width.mean(),'n':len(sub)})
    return pd.DataFrame(pooled),pd.DataFrame(lead_rows)
def analyze(out):
    selection=json.loads((out/'selection.json').read_text());frozen=json.loads((out/'test_frozen.json').read_text());assert frozen['selection_sha256']==sha(out/'selection.json');assert frozen['quantiles_sha256']==sha(out/'conformal_quantiles.csv');assert frozen['predictions_sha256']==sha(out/'test_predictions.csv')
    full=pd.read_csv(out/'test_predictions.csv',dtype={'seed':str});frame=operational(full);summary=aggregate(full);save_csv(out/'test_metrics.csv',summary)
    per_file=summary[(summary.scope=='file')&summary.seed.isin(['deterministic','ensemble'])]
    macro=per_file.groupby(['method','horizon'],as_index=False)[METRICS].mean();save_csv(out/'test_equal_series_macro_metrics.csv',macro)
    raw_seeds=summary[(summary.scope=='pooled')&~summary.seed.isin(['deterministic','ensemble'])];seedstats=raw_seeds.groupby(['method','horizon'])[METRICS].agg(['mean','std','min','max']).reset_index();seedstats.columns=['_'.join(filter(None,v)) for v in seedstats.columns];save_csv(out/'test_seed_variability.csv',seedstats)
    print('Computing platform-cluster bootstrap intervals...',flush=True);cis,deltas=metric_intervals(frame,selection['selected_method']);save_csv(out/'test_bootstrap_ci.csv',cis);save_csv(out/'test_vs_mean_paired_bootstrap_ci.csv',deltas)
    dm=dm_table(frame);save_csv(out/'test_dm_vs_mean.csv',dm)
    cover,lead=interval_tables(frame,pd.read_csv(out/'conformal_quantiles.csv'));save_csv(out/'test_interval_coverage.csv',cover);save_csv(out/'test_interval_coverage_by_lead.csv',lead)
    events=pd.concat([pd.read_csv(out/f'{split}_fit_events.csv') .assign(split=split) for split in ['validation','calibration','test']]);failures=events.groupby(['split','method'],as_index=False).agg(fits=('file','size'),fallbacks=('fallback','sum'),warnings=('warnings',lambda s:s.notna().sum()),nonconverged=('converged',lambda s:(s==False).sum()),total_fit_seconds=('seconds','sum'));save_csv(out/'fit_diagnostics.csv',failures)
    selected=selection['selected_method'];comparison=summary[(summary.scope=='pooled')&summary.seed.isin(['deterministic','ensemble'])&summary.method.isin(['original','historical_mean',selected])];save_csv(out/'selected_comparison.csv',comparison)
    selectedci=cis[cis.method.isin(['original','historical_mean',selected])];save_csv(out/'selected_comparison_ci.csv',selectedci)
    dump(out/'analysis_summary.json',{'selected_method':selected,'validation_gate':selection['validation_deployment_gate_passed'],'selected_test':comparison.to_dict('records'),'dm_estimable':int(dm.p_raw.notna().sum()),'dm_unavailable':int(dm.p_raw.isna().sum()),'n_primary_models':int(frame.method.nunique()),'bootstrap_seeds':SEEDS,'bootstrap_draws':5000})
    print(comparison[['method','horizon','mae','rmse','smape','mase','n_windows','n_forecast_instances']].to_string(index=False),flush=True)
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--out',type=Path,required=True);a=p.parse_args();analyze(a.out)
