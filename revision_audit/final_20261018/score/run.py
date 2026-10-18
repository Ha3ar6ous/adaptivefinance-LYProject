"""Six-month simulated outcome audit. All fits/selects precede held-out scoring."""
import argparse
import importlib.util
import json
import shutil
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score,brier_score_loss
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'router_sim'))
import simulate as base
TRAIN=[601,607,613,617,619]


def simulator(out):
    spec=importlib.util.spec_from_file_location('score_sim',out/'simulator_snapshot.py')
    mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod);mod.ROOT=ROOT
    return mod


def cohort(mod,seed,split,th):
    c=mod.generate(seed,split,'central',th)
    cash=c['cash'].copy();arrears=np.zeros(c['n']);bad=np.zeros(c['n'],bool)
    for m in range(6):
        paid=np.minimum(cash,arrears);cash-=paid;arrears-=paid
        principal=c['debt']*(12-m)/12
        bills=c['regular'][:,m]+c['nominal'][:,m]*c['shock'][:,m]+c['debt']/12+principal*.18/12+arrears*1.015
        cash,_,arrears,_=mod.settle(cash,np.zeros(c['n']),bills,c['incomes'][:,30+30*m:60+30*m].sum(axis=1),np.ones(c['n']),0.)
        bad|=arrears>1e-8
    an=c['analytics'][0];income=an['monthly_income'];expense=c['expense'];debt=c['debt']
    forecastavg=an['forecast'].mean(axis=1).copy();forecastavg[c['failures'][:,0]<.02]=0
    actual=c['incomes'][:,16:30].mean(axis=1)
    ratio=np.divide(forecastavg,actual,out=(forecastavg>0).astype(float),where=actual>0)
    f=np.stack([np.clip(c['cash']/expense/3*100,0,100),np.clip(100-debt/expense*35,0,100),
        np.array([90,60,30,45])[an['vol']],np.clip(50+(ratio-1)*100,0,100),60+40*np.mean(c['incomes'][:,:30]>0,axis=1)],axis=1)/100
    fixed=f.copy();fixed[:,1]=np.clip(100-debt/np.maximum(income,1)*35,0,100)/100
    suff=np.clip(50+100*(income/expense-1),0,100)/100
    w=np.array([.30,.25,.20,.15,.10]);original=np.floor(f@w*100+.5)
    corrected=np.floor(np.minimum(fixed@w,suff)*100+.5)
    names=[n for n,_ in mod.sources()];platforms=[d.platform.iloc[0].lower() for _,d in mod.sources()]
    d=pd.DataFrame({**{f'f{i}':f[:,i] for i in range(5)},**{f'g{i}':fixed[:,i] for i in range(5)},'g5':suff,
        'original_score':original,'corrected_score':corrected,'outcome':bad.astype(int),'seed':seed,'income':income,'expenses':expense,
        'cash':c['cash'],'debt':debt,'donor':[names[i] for i in c['donor']],'platform':[platforms[i] for i in c['donor']]})
    return d,c['hash']


def metrics(y,p):
    bins=np.minimum((p*10).astype(int),9)
    ece=sum(abs(np.sum((p-y)[bins==b])) for b in range(10))/len(y)
    return dict(n=len(y),events=int(y.sum()),auc=roc_auc_score(y,p),brier=brier_score_loss(y,p),ece10=ece)


def model_fit(train,cols,C):
    model=make_pipeline(StandardScaler(),LogisticRegression(C=C,max_iter=2000,solver='lbfgs'))
    model.fit(train[cols],train.outcome)
    return model


def ci(d,p):
    groups=sorted(d.platform.unique());y=d.outcome.to_numpy();n=len(groups)
    _,inv=np.unique(p,return_inverse=True);u=inv.max()+1
    pos=np.stack([np.bincount(inv,weights=((d.platform==g)&(y==1)).astype(int),minlength=u) for g in groups])
    neg=np.stack([np.bincount(inv,weights=((d.platform==g)&(y==0)).astype(int),minlength=u) for g in groups])
    wins=pos@(np.cumsum(neg,axis=1)-.5*neg).T
    weights=np.concatenate([np.random.default_rng(seed).multinomial(n,np.ones(n)/n,size=200) for seed in base.VAL_SEEDS])
    counts=np.array([(d.platform==g).sum() for g in groups]);den=weights@counts
    auc=np.einsum('bi,ij,bj->b',weights,wins,weights)/((weights@pos.sum(axis=1))*(weights@neg.sum(axis=1)))
    err=np.array([np.sum((p[d.platform==g]-y[d.platform==g])**2) for g in groups]);brier=weights@err/den
    bins=np.minimum((p*10).astype(int),9)
    gaps=np.array([[np.sum((p-y)[(d.platform==g)&(bins==b)]) for b in range(10)] for g in groups])
    ece=np.abs(weights@gaps).sum(axis=1)/den
    return {f'{k}_{bound}':float(np.quantile(v,q)) for k,v in [('auc',auc),('brier',brier),('ece10',ece)] for bound,q in [('lo95',.025),('hi95',.975)]}


def prepare(out):
    out.mkdir(parents=True,exist_ok=False)
    source=(ROOT/'router_sim/simulate.py').read_text()
    source=source.replace("lo,hi=(60,90) if split=='validation' else (90,len(y))","lo,hi=(30,60) if split=='train' else (60,90) if split=='validation' else (90,len(y))")
    source=source.replace("30 if split=='validation' else 60","0 if split=='train' else 30 if split=='validation' else 60")
    with (out/'simulator_snapshot.py').open('x',encoding='utf-8') as f:f.write(source)
    for name in ('run.py','PROTOCOL.md'):shutil.copy2(ROOT/'score_audit'/name,out/name)
    base.dump(out/'preservation.json',base.manifest())
    shutil.copy2(ROOT/'server/services/healthScoreService.js',out/'health_original.js')
    mod=simulator(out)
    spec=importlib.util.spec_from_file_location('score_runtime_volatility',ROOT/'ml_service/modules/volatility.py')
    runtime=importlib.util.module_from_spec(spec);spec.loader.exec_module(runtime)
    th=runtime._load_thresholds()
    hashes={}
    for split,seeds in [('train',TRAIN),('validation',base.VAL_SEEDS)]:
        rows=[]
        for seed in seeds:
            d,h=cohort(mod,seed,split,th);rows.append(d);hashes[f'{split}_{seed}']=h
        pd.concat(rows,ignore_index=True).to_csv(out/f'{split}.csv',index=False,mode='x')
    base.dump(out/'cohort_hashes_train_validation.json',hashes)
    base.dump(out/'thresholds.json',th)


def select(out):
    tr,va=[pd.read_csv(out/f'{s}.csv') for s in ('train','validation')]
    candidates=[];chosen={}
    for family,cols in [('original_calibrated',['original_score']),('corrected_calibrated',['corrected_score']),
                        ('fit_original_factors',[f'f{i}' for i in range(5)]),('fit_corrected_factors',[f'g{i}' for i in range(6)])]:
        options=[]
        for C in (.01,.1,1.,10.):
            fit=model_fit(tr,cols,C);p=fit.predict_proba(va[cols])[:,1]
            row=dict(model=family,C=C,columns=cols,**metrics(va.outcome,p));options.append(row);candidates.append(row)
        chosen[family]=min(options,key=lambda r:(r['brier'],-r['auc'],r['C']))
    base.save(out/'validation_candidates.csv',[{**r,'columns':json.dumps(r['columns'])} for r in candidates])
    sensitivity=[];w=np.array([.3,.25,.2,.15,.1]);names=['liquidity','debt','stability','forecast','consistency']
    for j,name in enumerate(names):
        for scale in (0.,.5,1.5):
            weights=w.copy();weights[j]*=scale;weights/=weights.sum()
            xtr=(tr[[f'f{i}' for i in range(5)]].to_numpy()@weights).reshape(-1,1)
            xva=(va[[f'f{i}' for i in range(5)]].to_numpy()@weights).reshape(-1,1)
            fit=LogisticRegression(C=1.,max_iter=2000).fit(xtr,tr.outcome)
            sensitivity.append(dict(component=name,multiplier=scale,weights=json.dumps(weights.tolist()),**metrics(va.outcome,fit.predict_proba(xva)[:,1])))
    base.save(out/'validation_weight_sensitivity.csv',sensitivity)
    # Known-expense intervention; keep earnings, debt, balance and non-financial factors fixed.
    for mode in ('original','corrected'):
        old=tr[f'{mode}_score'].to_numpy();f=tr[[f'f{i}' for i in range(5)]].to_numpy().copy();exp=tr.expenses.to_numpy()*1.1
        f[:,0]=np.clip(tr.cash/exp/3,0,1)
        f[:,1]=np.clip(1-tr.debt/(exp if mode=='original' else np.maximum(tr.income,1))*.35,0,1)
        score=f@w
        if mode=='corrected':score=np.minimum(score,np.clip(.5+(tr.income/exp-1),0,1))
        new=np.floor(score*100+.5)
        base.dump(out/f'{mode}_expense_monotonicity.json',dict(n=len(tr),expense_increase_percent=10.,score_increased=int((new>old).sum()),score_unchanged=int((new==old).sum()),score_decreased=int((new<old).sum())))
    base.dump(out/'selection.json',dict(chosen=chosen,criterion='validation Brier, then AUC, then smaller C',
        hashes={p.name:base.sha(p) for p in out.iterdir() if p.is_file()}))


def test(out):
    frozen=json.loads((out/'selection.json').read_text())
    for p,h in frozen['hashes'].items():assert base.sha(out/p)==h
    mod=simulator(out);rows=[];hashes={};th=json.loads((out/'thresholds.json').read_text())
    for seed in base.TEST_SEEDS:
        d,h=cohort(mod,seed,'test',th);rows.append(d);hashes[str(seed)]=h
    te=pd.concat(rows,ignore_index=True);te.to_csv(out/'test.csv',index=False,mode='x');base.dump(out/'test_hashes.json',hashes)
    train=pd.concat([pd.read_csv(out/f'{s}.csv') for s in ('train','validation')],ignore_index=True)
    output=[];reliability=[];pred=te[['seed','donor','platform','outcome']].copy();coeff=[]
    for name,p in [('original_uncalibrated',1-te.original_score/100),('corrected_uncalibrated',1-te.corrected_score/100)]:
        p=p.to_numpy();output.append(dict(model=name,**metrics(te.outcome,p),**ci(te,p)));pred[name]=p
    for name,config in frozen['chosen'].items():
        model=model_fit(train,config['columns'],config['C']);p=model.predict_proba(te[config['columns']])[:,1]
        output.append(dict(model=name,**metrics(te.outcome,p),**ci(te,p)));pred[name]=p
        # Coefficients on original factor scale, not standardized coordinates.
        scaler,lr=model.steps[0][1],model.steps[1][1]
        coef=lr.coef_[0]/scaler.scale_;intercept=lr.intercept_[0]-np.dot(coef,scaler.mean_)
        coeff.append(dict(model=name,intercept=float(intercept),coefficients=json.dumps(dict(zip(config['columns'],coef.tolist())))))
    for name in pred.columns[4:]:
        p=pred[name].to_numpy();bins=np.minimum((p*10).astype(int),9)
        for b in range(10):
            mask=bins==b
            reliability.append(dict(model=name,bin=b,n=int(mask.sum()),mean_predicted=float(p[mask].mean()) if mask.any() else None,observed=float(te.outcome[mask].mean()) if mask.any() else None))
    base.save(out/'test_metrics.csv',output);base.save(out/'coefficients.csv',coeff);base.save(out/'calibration_bins.csv',reliability)
    pred.to_csv(out/'test_predictions.csv',index=False,mode='x')
    old=json.loads((out/'preservation.json').read_text());changed=[p for p,h in old.items() if base.sha(ROOT/p)!=h]
    base.dump(out/'preservation_check.json',dict(files=len(old),changed=changed));assert not changed
    print(pd.DataFrame(output).to_string(index=False))


if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--out',required=True);p.add_argument('--stage',choices=['prepare','select','test'],required=True)
    args=p.parse_args();{'prepare':prepare,'select':select,'test':test}[(args.stage)]((ROOT/args.out).resolve())
