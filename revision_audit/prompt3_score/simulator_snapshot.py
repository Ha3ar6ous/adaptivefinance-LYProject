"""Paired, vectorized simulation of router policies. No application mutation."""
import argparse
import hashlib
import importlib.util
import itertools
import json
import platform
import shutil
import subprocess
import sys
import time
from pathlib import Path

import numpy as np
import pandas as pd
import scipy
from scipy.stats import t as student_t

ROOT=Path(__file__).resolve().parents[1]
VAL_SEEDS=[11,23,37,53,71]
TEST_SEEDS=[101,211,307,401,503]
N=10000
METRICS=['shortfall_rate','forced_liquidation_rate','shortfall_or_liquidation_rate','months_below_1','months_below_3',
         'final_net_wealth','median_final_net_wealth','wealth_expense_ratio','ever_cleared','initial_cleared','cleared_user_months',
         'ever_contributed','total_contributions','final_arrears']


def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()


def dump(p,obj):
    with p.open('x',encoding='utf-8') as f: json.dump(obj,f,indent=2,allow_nan=False)


def save(p,rows): pd.DataFrame(rows).to_csv(p,index=False,mode='x')


def manifest():
    files=set()
    for folder in ('data','ml_service/modules','server/services','server/controllers','server/tests',
                   'paper_audit','research_eval','forecast_audit','volatility_audit'):
        for p in (ROOT/folder).rglob('*'):
            if p.is_file() and not any(x in p.parts for x in ('.venv','__pycache__','.pytest_cache','cache')): files.add(p)
    for name in ('amend_test.md','PAPER_METRICS_AUDIT.md','CHANGES_forecast.md','CHANGES_volatility.md','server/package.json'):
        if (ROOT/name).exists(): files.add(ROOT/name)
    return {str(p.relative_to(ROOT)).replace('\\','/'):sha(p) for p in sorted(files)}


def sources():
    result=[]
    for p in sorted((ROOT/'data/normal').glob('*.csv')):
        d=pd.read_csv(p).sort_values('date').reset_index(drop=True)
        assert pd.to_datetime(d.date).diff().dropna().eq(pd.Timedelta(days=1)).all()
        assert np.isfinite(d.income).all() and (d.income>=0).all() and d.date.is_unique
        result.append((p.name,d))
    return result


def prepare(out):
    out.mkdir(parents=True,exist_ok=False)
    snap=out/'snapshots';snap.mkdir()
    mapping={'health.js':'server/services/healthScoreService.js','revised.js':'server/services/decisionRouterService.js',
             'original.js':'paper_audit/baseline/decisionRouterService.js','engine.js':'server/services/investmentEngineService.js',
             'forecast.py':'ml_service/modules/forecast.py','volatility.py':'ml_service/modules/volatility.py'}
    for dest,src in mapping.items(): shutil.copy2(ROOT/src,snap/dest)
    for p in (ROOT/'router_sim').glob('*'):
        if p.is_file(): shutil.copy2(p,snap/p.name)
    artifact=ROOT/'ml_service/artifacts/volatility_model.json'
    spec=importlib.util.spec_from_file_location('deployed_volatility',ROOT/'ml_service/modules/volatility.py')
    runtime=importlib.util.module_from_spec(spec);spec.loader.exec_module(runtime)
    dump(out/'runtime_thresholds.json',runtime._load_thresholds())
    opts=json.loads(subprocess.check_output(['node',str(ROOT/'router_sim/bridge.cjs'),'options'],text=True))
    dump(out/'product_snapshot.json',opts)
    dump(out/'preserved_sha256.json',manifest())
    dump(out/'environment.json',dict(os=platform.platform(),python=sys.version,numpy=np.__version__,pandas=pd.__version__,
         scipy=scipy.__version__,node=subprocess.check_output(['node','--version'],text=True).strip(),
         n=N,validation_seeds=VAL_SEEDS,test_seeds=TEST_SEEDS,months=12,block_days=7,volatility_artifact_existed=artifact.exists()))
    save(out/'source_inventory.csv',[dict(file=n,rows=len(d),train_days=60,validation_days=30,test_days=len(d)-90,
         platform=d.platform.iloc[0].lower(),first=d.date.iloc[0],last=d.date.iloc[-1]) for n,d in sources()])
    print('Protocol/sources frozen; no simulations scored.',flush=True)


def forecast(past,first_weekday):
    # past N x days, weekday refers to past[:,0]. Exact runtime formula, vectorized.
    recent=past[:,-14:];base=recent.mean(axis=1)
    window=past[:,-30:];mid=window.shape[1]//2
    slope=np.clip((window[:,mid:].mean(axis=1)-window[:,:mid].mean(axis=1))/window.shape[1],-base*.08,base*.08)
    k=past.shape[1];begin=max(0,k-42);week=(np.arange(begin,k)+first_weekday)%7
    deltas={w:past[:,begin:][:,week==w].mean(axis=1)-base for w in range(7)}
    return np.stack([np.round(np.maximum(base+slope*h+deltas[(first_weekday+k+h-1)%7],0),2) for h in range(1,16)],axis=1)


def analytics(past,weekday,failure,thresholds):
    f=forecast(past,weekday)
    avg=past[:,-30:].mean(axis=1);sd=past[:,-30:].std(axis=1,ddof=1)
    cv=np.divide(sd,avg,out=np.zeros_like(avg),where=avg>0)
    vol=np.digitize(cv,[thresholds['low_max_cv'],thresholds['medium_max_cv']])
    missing_forecast=failure<.02;missing_vol=(failure>=.02)&(failure<.04)
    forecastavg=f.mean(axis=1).copy();forecastavg[missing_forecast]=0
    act=past[:,-14:].mean(axis=1)
    ratio=np.divide(forecastavg,act,out=(forecastavg>0).astype(float),where=act>0)
    trend=np.clip(50+(ratio-1)*100,0,100)
    stability=np.array([90.,60.,30.])[vol];stability[missing_vol]=45
    consistency=60+40*np.mean(past[:,-30:]>0,axis=1)
    valid=(failure>=.05)&(avg>0)&np.any(f>0,axis=1)
    effective_vol=vol.copy();effective_vol[missing_vol]=3
    return dict(forecast=f,avg=avg,sd=sd,cv=cv,vol=effective_vol,valid=valid,
                fixed_health=.2*stability+.15*trend+.1*consistency,monthly_income=past[:,-30:].sum(axis=1))


def health(cash,debt,expenses,fixed):
    return np.floor(np.clip(.3*np.clip(cash/expenses/3*100,0,100)+.25*np.clip(100-debt/expenses*35,0,100)+fixed,0,100)+.5)


def gate(name,cash,debt,expense,score,vol,valid,L=3,D=.5):
    if name=='always_invest': return np.ones_like(score,dtype=bool)
    if name=='no_investing': return np.zeros_like(score,dtype=bool)
    if name=='score_only': return score>=70
    if name=='original_gate': return (cash/expense>=1)&(debt/expense<=2)&(score>=70)&(vol!=2)
    return (cash/L>=expense)&(debt<=expense*D)&(score>=70)&(vol<2)&valid


def budget(cash,expense,income,mode):
    surplus=np.maximum(income-expense,0)*.25
    limit=np.maximum(cash-3*expense,0)*.1 if mode=='engine_budget' else cash
    return np.floor(np.maximum(0,np.minimum(surplus,limit)))


def settle(cash,assets,bills,income,gross,haircut):
    cash=cash*(1+.03/12)+income-bills
    assets=assets*gross
    sale=np.minimum(assets,np.maximum(-cash,0)/(1-haircut))
    cash+=sale*(1-haircut);assets-=sale
    unpaid=np.maximum(-cash,0)
    return np.maximum(cash,0),assets,unpaid,sale>1e-9


def generate(seed,split,scenario,thresholds,n=N):
    rng=np.random.default_rng(seed);data=sources()
    donor=rng.integers(0,len(data),size=n)
    scale=np.clip(np.exp(rng.normal(0,.25,n)),.5,2)
    incomes=np.zeros((n,390));blocks=rng.random((n,52))
    for j,(_,d) in enumerate(data):
        mask=donor==j;y=d.income.to_numpy(float)
        if not mask.any(): continue
        lo,hi=(30,60) if split=='train' else (60,90) if split=='validation' else (90,len(y))
        starts=(blocks[mask]*(hi-lo)).astype(int)
        indices=(starts[:,:,None]+np.arange(7))%(hi-lo)+lo
        incomes[mask,:30]=y[lo-30:lo]
        incomes[mask,30:]=y[indices].reshape(mask.sum(),-1)[:,:360]
    incomes*=scale[:,None]
    expense=np.maximum(incomes[:,:30].sum(axis=1)*rng.uniform(.65,1.10,n),1000)
    cash=expense*rng.uniform(0,8,n)
    debt=expense*rng.uniform(.25,3,n)*(rng.random(n)>=.35)
    regime=rng.choice(3,n,p=[.6,.3,.1])
    transitions=rng.random((n,12));noise=rng.normal(0,.05,(n,12))
    expense_noise=rng.normal(0,.05,(n,12))
    medical=rng.random((n,12));medical_size=rng.uniform(.5,3,(n,12))
    repair=rng.random((n,12));repair_size=rng.uniform(.25,1.5,(n,12))
    asset_z=rng.normal(size=(n,12));failure=rng.random((n,12))
    adverse=np.zeros(n,bool);adverse_months=np.zeros(n,int)
    for m in range(12):
        adverse=np.where(adverse,transitions[:,m]>=np.array([.5,.35,.25])[regime],transitions[:,m]<np.array([.06,.12,.18])[regime])
        adverse_months+=adverse
        mult=np.where(adverse,np.array([.7,.55,.2])[regime],1.)*np.array([1.,.985,.995])[regime]**m*np.exp(noise[:,m]-.5*.05**2)
        incomes[:,30+30*m:60+30*m]*=mult[:,None]
    shockfactor=2 if scenario=='stress' else 1
    shock=(medical<.025*shockfactor)*medical_size+(repair<.04*shockfactor)*repair_size
    drift,vol,haircut={'central':(.05,.08,.02),'neutral':(.03,0.,0.),'stress':(0.,.15,.05)}[scenario]
    gross=np.exp(np.log1p(drift/12)-.5*vol**2/12+vol/np.sqrt(12)*asset_z)
    nominal=expense[:,None]*1.03**(np.arange(12)/12)
    actual_expenses=nominal*np.exp(expense_noise-.5*.05**2)
    history_start=pd.Timestamp(data[0][1].date.iloc[0 if split=='train' else 30 if split=='validation' else 60])
    weekday=history_start.weekday()
    an=[analytics(incomes[:,:30+30*m],weekday,failure[:,m],thresholds) for m in range(12)]
    cohort_hash=hashlib.sha256(b''.join(np.ascontiguousarray(v).tobytes() for v in (donor,regime,incomes,expense,cash,debt,shock,gross,failure))).hexdigest()
    return dict(seed=seed,split=split,scenario=scenario,n=n,donor=donor,regime=regime,incomes=incomes,expense=expense,
                cash=cash,debt=debt,nominal=nominal,regular=actual_expenses,shock=shock,returns=gross,haircut=haircut,
                analytics=an,failures=failure,weekday=weekday,history_start=str(history_start.date()),hash=cohort_hash,
                inventory=dict(adverse_user_months=int(adverse_months.sum()),medical_events=int((medical<.025*shockfactor).sum()),
                    vehicle_events=int((repair<.04*shockfactor).sum()),analytics_missing_forecast=int((failure<.02).sum()),
                    analytics_missing_volatility=int(((failure>=.02)&(failure<.04)).sum()),analytics_error_status=int(((failure>=.04)&(failure<.05)).sum()),
                    regime_counts=np.bincount(regime,minlength=3).tolist(),source_counts=np.bincount(donor,minlength=len(data)).tolist()))


def policies(grid=False,chosen=None):
    result=[dict(name=n,L=3,D=.5) for n in ('always_invest','original_gate','revised_gate','score_only','no_investing')]
    if grid: result += [dict(name=f'sweep_L{L}_D{D}',L=L,D=D) for L,D in itertools.product(range(1,7),(.25,.5,.75,1.,1.25,1.5,1.75,2.))]
    if chosen is not None: result.append(dict(name='validation_selected',L=chosen['L'],D=chosen['D']))
    return result


def simulate(c,mode,policylist):
    p,n=len(policylist),c['n']
    cash=np.broadcast_to(c['cash'],(p,n)).copy();assets=np.zeros((p,n));arrears=np.zeros((p,n))
    ever_short=np.zeros((p,n),bool);ever_sale=ever_short.copy();ever_clear=ever_short.copy();ever_contrib=ever_short.copy()
    below1=np.zeros((p,n),int);below3=below1.copy();clear_count=below1.copy();total=np.zeros((p,n));initial=None
    for m in range(12):
        # Repay existing arrears before any discretionary contribution.
        paid=np.minimum(cash,arrears);cash-=paid;arrears-=paid
        principal=c['debt']*(12-m)/12
        expense=c['nominal'][:,m];an=c['analytics'][m]
        score=health(cash,principal+arrears,expense,an['fixed_health'])
        cleared=np.stack([gate(pol['name'],cash[i],principal+arrears[i],expense,score[i],an['vol'],an['valid'],pol['L'],pol['D']) for i,pol in enumerate(policylist)])
        if m==0: initial=cleared.copy()
        ever_clear|=cleared;clear_count+=cleared
        amount=budget(cash,expense,an['monthly_income'],mode)*cleared
        assert (amount<=cash+1e-8).all()
        cash-=amount;assets+=amount;total+=amount;ever_contrib|=amount>0
        bills=c['regular'][:,m]+expense*c['shock'][:,m]+c['debt']/12+principal*.18/12+arrears*(1+.18/12)
        cash,assets,arrears,sale=settle(cash,assets,bills,c['incomes'][:,30+30*m:60+30*m].sum(axis=1),c['returns'][:,m],c['haircut'])
        ever_short|=arrears>1e-8;ever_sale|=sale
        below1+=cash<expense;below3+=cash<3*expense
    wealth=cash+assets-arrears # initial principal fully scheduled; unpaid part retained as arrears
    rows=[]
    for i,pol in enumerate(policylist):
        rows.append(dict(seed=c['seed'],split=c['split'],scenario=c['scenario'],execution=mode,policy=pol['name'],L=pol['L'],D=pol['D'],n=n,
            shortfall_rate=ever_short[i].mean(),forced_liquidation_rate=ever_sale[i].mean(),
            shortfall_or_liquidation_rate=(ever_short[i]|ever_sale[i]).mean(),months_below_1=below1[i].mean(),months_below_3=below3[i].mean(),
            final_net_wealth=wealth[i].mean(),median_final_net_wealth=np.median(wealth[i]),wealth_expense_ratio=np.mean(wealth[i]/c['expense']),
            ever_cleared=ever_clear[i].mean(),initial_cleared=initial[i].mean(),cleared_user_months=clear_count[i].mean()/12,
            ever_contributed=ever_contrib[i].mean(),total_contributions=total[i].mean(),final_arrears=arrears[i].mean(),
            shortfall_users=int(ever_short[i].sum()),forced_liquidation_users=int(ever_sale[i].sum()),
            shortfall_or_liquidation_users=int((ever_short[i]|ever_sale[i]).sum()),cleared_users=int(ever_clear[i].sum()),contributing_users=int(ever_contrib[i].sum())))
    return rows


def pareto(d):
    x=d[['shortfall_rate','ever_contributed','final_net_wealth']].to_numpy()*np.array([1,-1,-1])
    return [not np.any(np.all(x<=r,axis=1)&np.any(x<r,axis=1)) for r in x]


def summarize(rows,out,prefix):
    d=pd.DataFrame(rows)
    d.to_csv(out/f'{prefix}_per_seed.csv',index=False,mode='x')
    g=d.groupby(['scenario','execution','policy','L','D'],sort=False)
    mean=g[METRICS].mean().reset_index();sd=g[METRICS].std().reset_index()
    mean['seeds']=g.size().to_numpy();mean['users_per_seed']=N
    mean.to_csv(out/f'{prefix}_mean.csv',index=False,mode='x');sd.to_csv(out/f'{prefix}_sd.csv',index=False,mode='x')
    deltas=[]
    for (sc,mode),sub in d.groupby(['scenario','execution']):
        for reference in ('no_investing','original_gate'):
            ref=sub[sub.policy==reference].set_index('seed')
            for pol,group in sub.groupby('policy',sort=False):
                if pol==reference: continue
                group=group.set_index('seed')
                for metric in METRICS:
                    v=group[metric]-ref[metric];se=v.std(ddof=1)/np.sqrt(len(v));margin=student_t.ppf(.975,len(v)-1)*se
                    deltas.append(dict(scenario=sc,execution=mode,policy=pol,reference=reference,metric=metric,seeds=len(v),
                        mean_delta=v.mean(),lower95=v.mean()-margin,upper95=v.mean()+margin))
    save(out/f'{prefix}_paired_deltas.csv',deltas)
    return mean


def fixture_checks(c,out,prefix):
    fixtures=[];expected=[]
    from datetime import date,timedelta
    spec=importlib.util.spec_from_file_location('snapshot_forecast',out/'snapshots/forecast.py')
    mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
    max_error=0
    for m in (0,3,11):
        an=c['analytics'][m];start=date.fromisoformat(c['history_start'])
        for i in range(100):
            past=c['incomes'][i,:30+30*m]
            entries=[dict(date=str(start+timedelta(days=j)),income=float(v)) for j,v in enumerate(past)]
            f=mod.forecast_income(entries)
            err=float(np.max(np.abs(np.array([p['income'] for p in f['points']])-an['forecast'][i])))
            max_error=max(err,max_error)
            assert err<1e-7,err
            volatility=dict(label=['low','medium','high','unknown'][an['vol'][i]],features=dict(entryCount=len(past),
                recentAverageIncome=round(float(an['avg'][i]),2),recentStdIncome=round(float(an['sd'][i]),2),coefficientOfVariation=round(float(an['cv'][i]),3)))
            analytics=dict(forecast=f,volatility=volatility)
            fail=c['failures'][i,m]
            if fail<.02:analytics['forecast']={}
            elif fail<.04:analytics['volatility']={}
            elif fail<.05:analytics['status']='error'
            expense=c['nominal'][i,m];cash=c['cash'][i];debt=c['debt'][i]*(12-m)/12
            user=dict(monthlyExpenses=expense,bankBalance=cash,debts=debt,riskPreference='low')
            score=health(cash,debt,expense,an['fixed_health'][i])
            fixtures.append(dict(user=user,entries=entries,analytics=analytics))
            expected.append(dict(health=int(score),original=bool(gate('original_gate',cash,debt,expense,score,an['vol'][i],an['valid'][i])),
                revised=bool(gate('revised_gate',cash,debt,expense,score,an['vol'][i],an['valid'][i])),
                budget=float(budget(cash,expense,an['monthly_income'][i],'engine_budget'))))
    path=out/f'{prefix}_fixtures.json';dump(path,fixtures)
    actual=json.loads(subprocess.check_output(['node',str(ROOT/'router_sim/bridge.cjs'),'check',str(out),str(path)],text=True))
    mismatches=[dict(index=i,field=k,expected=e[k],actual=r[k]) for i,(e,r) in enumerate(zip(expected,actual)) for k in e if e[k]!=r[k]]
    dump(out/f'{prefix}_implementation_checks.json',dict(snapshots=len(fixtures),forecast_max_error=max_error,mismatches=mismatches))
    assert not mismatches,mismatches[:5]


def validation(out):
    thresholds=json.loads((out/'runtime_thresholds.json').read_text());rows=[];cohorts=[]
    for seed in VAL_SEEDS:
        print('Validation seed',seed,flush=True)
        c=generate(seed,'validation','central',thresholds)
        if seed==VAL_SEEDS[0]: fixture_checks(c,out,'validation')
        cohorts.append(dict(seed=seed,hash=c['hash'],**c['inventory']))
        for mode in ('engine_budget','reserve_free'): rows+=simulate(c,mode,policies(grid=True))
    dump(out/'validation_cohorts.json',cohorts)
    mean=summarize(rows,out,'validation');choices={};tables=[]
    for mode,group in mean.groupby('execution'):
        ref=group[group.policy=='no_investing'].iloc[0]
        grid=group[group.policy.str.startswith('sweep_')].copy()
        grid['pareto']=pareto(grid)
        grid['within_risk_budget']=(grid.shortfall_rate<=ref.shortfall_rate+.005)&(grid.months_below_1<=ref.months_below_1+.05)
        eligible=grid[grid.within_risk_budget]
        winner=eligible.sort_values(['ever_contributed','final_net_wealth','L','D'],ascending=[False,False,False,True]).iloc[0] if len(eligible) else None
        choices[mode]=None if winner is None else dict(L=float(winner.L),D=float(winner.D),policy=winner.policy,
            shortfall_rate=float(winner.shortfall_rate),months_below_1=float(winner.months_below_1),ever_contributed=float(winner.ever_contributed))
        tables+=grid.to_dict('records')
    save(out/'validation_pareto_grid.csv',tables)
    dump(out/'selection.json',dict(choices=choices,criterion='predeclared protocol risk budgets then participation, wealth, higher L, lower D',
        fingerprints={str(p.relative_to(out)).replace('\\','/'):sha(p) for p in out.rglob('*') if p.is_file()}))
    print('FROZEN threshold choices:',choices,flush=True)


def heldout(out):
    selection=json.loads((out/'selection.json').read_text())
    for name,h in selection['fingerprints'].items():assert sha(out/name)==h,name
    thresholds=json.loads((out/'runtime_thresholds.json').read_text());rows=[];cohorts=[]
    for seed in TEST_SEEDS:
        for scenario in ('central','neutral','stress'):
            print('Heldout',seed,scenario,flush=True)
            c=generate(seed,'test',scenario,thresholds)
            if seed==TEST_SEEDS[0] and scenario=='central': fixture_checks(c,out,'test')
            cohorts.append(dict(seed=seed,scenario=scenario,hash=c['hash'],**c['inventory']))
            for mode in ('engine_budget','reserve_free'):
                rows+=simulate(c,mode,policies(chosen=selection['choices'][mode]))
    dump(out/'test_cohorts.json',cohorts)
    summarize(rows,out,'test')
    old=json.loads((out/'preserved_sha256.json').read_text())
    changed=[name for name,h in old.items() if not (ROOT/name).exists() or sha(ROOT/name)!=h]
    dump(out/'preservation_check.json',dict(files_checked=len(old),changed=changed))
    assert not changed,changed


if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--out',required=True);parser.add_argument('--stage',choices=['prepare','validation','test'],required=True)
    args=parser.parse_args();out=(ROOT/args.out).resolve();begin=time.perf_counter()
    {'prepare':prepare,'validation':validation,'test':heldout}[args.stage](out)
    print('Wall seconds:',time.perf_counter()-begin,flush=True)
