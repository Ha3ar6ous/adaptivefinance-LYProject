"""Pre-test frozen diagnostics for families rejected by the recall constraint.

Does not modify run.py selection or existing result files. Diagnostic configs
maximize validation macro-F1 without the safety constraint and cannot be selected.
"""
import argparse
import json

import numpy as np
import pandas as pd

import run as a


def freeze(out):
    dest=out/'family_diagnostics_v2'
    dest.mkdir(exist_ok=False)
    rows=pd.read_csv(out/'validation_all_candidates.csv').to_dict('records')
    selection=json.loads((out/'selection.json').read_text())
    winners={}
    for family in ('NB','kNN','logistic','GB'):
        winner=max([r for r in rows if r['family']==family],key=lambda r:(r['macro_f1'],r['high_recall'],r['balanced_accuracy'],-r['order']))
        winner={k:v for k,v in winner.items() if not (isinstance(v,float) and np.isnan(v))}
        winner['config']=json.loads(winner['config'])
        winner['admissible_for_selection']=winner['high_recall'] >= selection['runtime_validation_high_recall']
        winners[family]=winner
    a.dump(dest/'frozen_diagnostics.json',dict(winners=winners,selection_sha256=a.digest(out/'selection.json'),
           rationale='Report all requested model families even if rejected by HIGH-recall selection constraint. Diagnostic only.',
           frozen_before_forward_test=not (out/'test_examples.csv').exists(),
           validation_sha256=a.digest(out/'validation_all_candidates.csv')))
    assert not (out/'test_examples.csv').exists()
    for name in ('compare.py','DIAGNOSTIC_AMENDMENT.md'):
        import shutil
        shutil.copy2(a.ROOT/'volatility_audit'/name,dest/name)
    print('Frozen diagnostic family configurations before test:',{f:r['name'] for f,r in winners.items()})


def evaluate(out):
    dest=out/'family_diagnostics_v2'
    frozen=json.loads((dest/'frozen_diagnostics.json').read_text())
    assert frozen['frozen_before_forward_test']
    assert frozen['selection_sha256']==a.digest(out/'selection.json')
    assert frozen['validation_sha256']==a.digest(out/'validation_all_candidates.csv')
    tr,va,te=[pd.read_csv(out/f'{s}_examples.csv') for s in ('train','validation','test')]
    fit=pd.concat([tr,va],ignore_index=True)
    base=pd.read_csv(out/'test_predictions.csv')
    predictions={}
    for name,sub in base.groupby('model',sort=False):
        assert list(zip(sub.series,sub.origin))==list(zip(te.series,te.origin))
        predictions[name]=sub.predicted.to_numpy(int)
    events,seedrows,probrows=[],[],[]
    for family,winner in frozen['winners'].items():
        name=winner['name']
        if name in predictions: continue
        probs,ps=a.fit_predict(winner['config'],fit,te,events,'test_diagnostic_refit')
        predictions[name]=a.decide(probs,str(winner['decision']))
        for seed,p in zip(a.SEEDS if family=='GB' else [None],ps):
            if seed is not None: seedrows.append(dict(model=name,seed=seed,**a.score(te.target,a.decide(p,str(winner['decision'])))))
            for i,vec in enumerate(p): probrows.append(dict(model=name,seed=seed,series=te.series.iloc[i],origin=int(te.origin.iloc[i]),p_low=vec[0],p_medium=vec[1],p_high=vec[2]))
    a.group_reports(te,predictions,dest,'all_models_test')
    mask=((te.origin-90)%14==0).to_numpy()
    a.group_reports(te.loc[mask].reset_index(drop=True),{k:np.asarray(v)[mask] for k,v in predictions.items()},dest,'all_models_nonoverlap')
    a.bootstrap(te,predictions,json.loads((out/'selection.json').read_text())['overall']['name'],dest)
    a.csv(dest/'diagnostic_seed_metrics.csv',seedrows)
    a.csv(dest/'diagnostic_seed_probabilities.csv',probrows)
    a.dump(dest/'fit_events.json',events)
    a.csv(dest/'all_models_predictions.csv',[dict(model=name,series=te.series.iloc[i],platform=te.platform.iloc[i],origin=int(te.origin.iloc[i]),actual=int(te.target.iloc[i]),predicted=int(p)) for name,pred in predictions.items() for i,p in enumerate(pred)])
    print('Completed diagnostic comparisons; overall selection unchanged.')


if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--out',required=True)
    parser.add_argument('--stage',choices=['freeze','test'],required=True)
    args=parser.parse_args()
    (freeze if args.stage=='freeze' else evaluate)((a.ROOT/args.out).resolve())
