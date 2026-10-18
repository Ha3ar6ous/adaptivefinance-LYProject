import json
import os
import subprocess
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.metrics import precision_recall_fscore_support

ROOT=Path(__file__).resolve().parents[1];R=ROOT/os.environ.get('DATA_AUDIT_RESULTS','data_audit/results_20261017')


def main():
    f=pd.read_csv(R/'forecast_windows.csv');f=f[f.dataset.str.startswith('new_synthetic_')];rows=[]
    for (h,method),g in f.groupby(['horizon','method']):
        n=g.n.sum();rows.append(dict(horizon=h,method=method,windows=len(g),target_pairs=n,mae=g.absolute_error.sum()/n,
            rmse=np.sqrt(g.squared_error.sum()/n),smape=g.smape_sum.sum()/n,mase=g.mase_sum.sum()/n,seeds=5))
    pd.DataFrame(rows).to_csv(R/'new_synthetic_pooled_forecast.csv',index=False,mode='x')
    v=pd.read_csv(R/'volatility_predictions.csv');v=v[v.dataset.str.startswith('new_synthetic_')];rows=[]
    for method,g in v.groupby('method'):
        g=g[~g.unavailable];pr,re,f1,support=precision_recall_fscore_support(g.actual,g.prediction,labels=[0,1,2],zero_division=0)
        rows.append(dict(method=method,n=len(g),macro_f1=f1.mean(),high_recall=re[2],balanced_accuracy=re[support>0].mean(),low=int(support[0]),medium=int(support[1]),high=int(support[2]),seeds=5))
    pd.DataFrame(rows).to_csv(R/'new_synthetic_pooled_volatility.csv',index=False,mode='x')
    metrics=pd.read_csv(R/'forecast_metrics.csv');new=metrics[metrics.dataset.str.startswith('new_synthetic_')]
    new.groupby(['horizon','method'])[['mae','rmse','smape','mase']].agg(['mean','std']).to_csv(R/'new_synthetic_seed_mean_sd.csv',mode='x')
    inventory=pd.read_csv(R/'series_split_inventory.csv');unsupported=[]
    for r in inventory.itertuples():
        for h in [7,15,30]:
            if r.n-r.test_start<h:unsupported.append(dict(dataset=r.dataset,series=r.series,horizon=h,test_days=r.n-r.test_start,reason='no complete test horizon'))
    pd.DataFrame(unsupported).to_csv(R/'unsupported_horizons.csv',index=False,mode='x')
    proc=subprocess.run([sys.executable,'-m','unittest','discover','-s','data_audit','-p','test_data.py','-v'],cwd=ROOT,env=os.environ.copy(),text=True,capture_output=True)
    with (R/'tests.txt').open('x',encoding='utf-8') as f:f.write(proc.stdout+proc.stderr)
    assert proc.returncode==0,proc.stdout
    print('Seven tests passed.');print(pd.read_csv(R/'new_synthetic_pooled_forecast.csv').to_string(index=False));print(pd.read_csv(R/'new_synthetic_pooled_volatility.csv').to_string(index=False))


if __name__=='__main__':main()
