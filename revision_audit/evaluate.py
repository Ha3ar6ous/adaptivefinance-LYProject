"""Current deployment on frozen targets; no threshold selection or test tuning."""
import argparse
import importlib.util
import json
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.metrics import confusion_matrix, precision_recall_fscore_support

ROOT=Path(__file__).resolve().parents[1]
SEEDS=[11,23,37,53,71]


def dump(p,x):
    with p.open('x',encoding='utf-8') as f:json.dump(x,f,indent=2,allow_nan=False)


def score(y,p):
    pr,re,f1,support=precision_recall_fscore_support(y,p,labels=[0,1,2],zero_division=0)
    return dict(n=len(y),accuracy=float(np.mean(y==p)),macro_f1=float(f1.mean()),
                high_recall=float(re[2]),balanced_accuracy=float(re[support>0].mean()),
                confusion_matrix=confusion_matrix(y,p,labels=[0,1,2]).tolist(),
                per_class=[dict(label=lab,support=int(n),precision=float(a),recall=float(b),f1=float(c))
                           for lab,n,a,b,c in zip(['LOW','MEDIUM','HIGH'],support,pr,re,f1)])


def paired_ci(groups,y,before,after):
    names=sorted(set(groups));weights=np.concatenate([np.random.default_rng(s).multinomial(len(names),np.ones(len(names))/len(names),size=1000) for s in SEEDS])
    matrices=[]
    for p in [before,after]:
        cms=np.stack([confusion_matrix(y[groups==g],p[groups==g],labels=[0,1,2]) for g in names])
        cm=np.einsum('bg,gij->bij',weights,cms);tp=np.diagonal(cm,axis1=1,axis2=2)
        denom=cm.sum(1)+cm.sum(2);f1=np.divide(2*tp,denom,out=np.zeros_like(tp,dtype=float),where=denom>0).mean(1)
        high=np.divide(tp[:,2],cm.sum(2)[:,2],out=np.full(len(weights),np.nan),where=cm.sum(2)[:,2]>0)
        matrices.append((f1,high))
    return {metric:dict(lower95=float(np.nanquantile(matrices[1][i]-matrices[0][i],.025)),
                         upper95=float(np.nanquantile(matrices[1][i]-matrices[0][i],.975)),draws=len(weights),
                         valid_draws=int(np.isfinite(matrices[1][i]-matrices[0][i]).sum()),clusters=len(names),seeds=SEEDS)
            for i,metric in enumerate(['macro_f1','high_recall'])}


def volatility(out):
    out.mkdir(parents=True,exist_ok=False)
    frozen=ROOT/'volatility_audit/results_20261017'
    selection=json.loads((frozen/'selection.json').read_text())
    assert selection['overall']['name']=='grid_cv30_0.45_0.75'
    spec=importlib.util.spec_from_file_location('current_volatility',ROOT/'ml_service/modules/volatility.py')
    v=importlib.util.module_from_spec(spec);spec.loader.exec_module(v)
    test=pd.read_csv(frozen/'test_examples.csv');pred=[]
    series={p.name:pd.read_csv(p).sort_values('date') for p in (ROOT/'data/normal').glob('*.csv')}
    for row in test.itertuples():
        p=v.classify_volatility(series[row.series].iloc[:row.origin].to_dict('records'))['label']
        pred.append(['low','medium','high'].index(p))
    pred=np.array(pred);y=test.target.to_numpy(int)
    original=np.digitize(test.cv_30.to_numpy(),[.35,.75]);selected=np.digitize(test.cv_30.to_numpy(),[.45,.75])
    np.testing.assert_array_equal(pred,selected)
    cut=json.loads((frozen/'target_cutoffs.json').read_text())
    train=pd.read_csv(frozen/'train_examples.csv')
    np.testing.assert_allclose(cut['cutoffs'],np.quantile(train.realized_cv,[1/3,2/3]),rtol=1e-14)
    groups=test.platform.to_numpy();ci=paired_ci(groups,y,original,pred)
    a,b=score(y,original),score(y,pred);gain=b['macro_f1']-a['macro_f1']
    result=dict(target='next14 realized sampleCV; training-only global terciles',target_cutoffs=cut,
                frozen_selection=selection['overall'],legacy_cutoffs=[.35,.75],deployed_cutoffs=[.45,.75],
                original=a,deployed=b,paired_macro_f1_gain=gain,paired_ci=ci,
                point_inside_ci=ci['macro_f1']['lower95']<=gain<=ci['macro_f1']['upper95'],
                test_selection_performed=False,labels_changed=False,
                qualification='Reconstruction of a synthetic statistic is not independent financial-risk validation; only five platform clusters.')
    dump(out/'volatility_deployment.json',result)
    test.assign(legacy_prediction=original,deployed_prediction=pred).to_csv(out/'volatility_predictions.csv',index=False,mode='x')
    print(json.dumps(result,indent=2))


def decision(scoreout,out):
    va=json.loads((scoreout/'selection.json').read_text())['chosen']
    te=pd.read_csv(scoreout/'test_metrics.csv').set_index('model')
    checks={split:dict(auc_improves=float(a['auc'])>float(b['auc']),brier_improves=float(a['brier'])<float(b['brier']),candidate_auc=float(a['auc']),baseline_auc=float(b['auc']),candidate_brier=float(a['brier']),baseline_brier=float(b['brier']))
            for split,a,b in [('validation',va['corrected_calibrated'],va['original_calibrated']),('test',te.loc['corrected_calibrated'],te.loc['original_calibrated'])]}
    passed=all(c['auc_improves'] and c['brier_improves'] for c in checks.values())
    dump(out,dict(eligible_candidate='corrected fixed-weight scalar',passed=passed,checks=checks,
                  diagnostic_learned_models='Not eligible under the existing adoption guard; risk probabilities lack validated health-phase mapping.',production_health_changed=False))
    if passed:raise RuntimeError('Candidate passed guard: deployment implementation now required before continuing.')
    a,b=checks['test'],checks['validation']
    text=(f"The existing corrected fixed-weight health-score candidate fails the predeclared adoption guard: validation AUC/Brier are {b['candidate_auc']}/{b['candidate_brier']} versus original-calibrated {b['baseline_auc']}/{b['baseline_brier']}; held-out AUC/Brier are {a['candidate_auc']}/{a['candidate_brier']} versus {a['baseline_auc']}/{a['baseline_brier']}. Both AUC and Brier must improve on both partitions, so the production score and weights remain unchanged and the expense-denominator defect is explicitly retained. The separately fitted log-odds predictors are simulation diagnostics, not validated replacements for health-score phases or its70-point cutoff. The router's hard predicates balance>=3E and debt<=0.5E are independent of the health-score formula; this independence does not itself validate financial safety.\n")
    with (ROOT/'score_decision.md').open('x',encoding='utf-8') as f:f.write(text)
    print(text)


if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('mode',choices=['volatility','score']);p.add_argument('--out',required=True);p.add_argument('--score-out')
    a=p.parse_args()
    if a.mode=='volatility':volatility(ROOT/a.out)
    else:decision(ROOT/a.score_out,ROOT/a.out)
