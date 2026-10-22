"""Paired household-policy ablations using the existing cash-flow accounting."""
import argparse
import hashlib
import json
import sys
from pathlib import Path
import numpy as np
import pandas as pd

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'router_sim'))
import simulate as sim

RANDOM_SEEDS=[11,23,37,53,71]
BASE=['always_invest','original_gate','revised_gate','score_only','no_investing']
ADDED=['liquidity_only','liquidity_debt','liquidity_debt_volatility','full_minus_volatility',
       'full_minus_score','matched_savings','suitability_proxy']


def policies():
    return [dict(name=n,L=3,D=.5) for n in BASE+ADDED+[f'matched_random_s{s}' for s in RANDOM_SEEDS]]


def select_k(values,valid,k):
    indices=np.flatnonzero(valid)
    assert 0<=k<=len(indices)
    order=np.lexsort((indices,values[indices]))
    result=np.zeros(len(values),bool);result[indices[order[:k]]]=True
    return result


class Gates:
    def __init__(self,cohort_seed):
        self.rng={s:np.random.default_rng(np.random.SeedSequence([s,cohort_seed])) for s in RANDOM_SEEDS}

    def __call__(self,month,pols,cash,debt,expense,score,an):
        out=[];names=[p['name'] for p in pols];i=names.index('revised_gate')
        reference=sim.gate('revised_gate',cash[i],debt[i],expense,score[i],an['vol'],an['valid'])
        k=int(reference.sum())
        for i,p in enumerate(pols):
            name=p['name'];liq=cash[i]/3>=expense;bounded=debt[i]<=.5*expense;vol=an['vol']<2;valid=an['valid']
            if name in BASE:mask=sim.gate(name,cash[i],debt[i],expense,score[i],an['vol'],valid)
            elif name=='liquidity_only':mask=liq&valid
            elif name=='liquidity_debt':mask=liq&bounded&valid
            elif name in ['liquidity_debt_volatility','full_minus_score']:mask=liq&bounded&vol&valid
            elif name=='full_minus_volatility':mask=liq&bounded&(score[i]>=70)&valid
            elif name=='matched_savings':mask=select_k(-cash[i]/expense,valid,k)
            elif name.startswith('matched_random_s'):
                seed=int(name.split('_s')[-1]);mask=select_k(self.rng[seed].random(len(valid)),valid,k)
            elif name=='suitability_proxy':
                # Own illustrative checklist; all generated profiles declare low risk.
                mask=(cash[i]>=expense)&(an['monthly_income']>expense)&valid
            else:raise ValueError(name)
            out.append(mask)
        return np.stack(out)


def interval(cluster,reference):
    names=sorted(cluster.platform.unique())
    x=cluster.set_index('platform').loc[names];r=reference.set_index('platform').loc[names]
    w=np.concatenate([np.random.default_rng(s).multinomial(len(names),np.ones(len(names))/len(names),size=1000) for s in RANDOM_SEEDS])
    delta=100*((w@x.forced_sale_events)/(w@x.event_trials)-(w@r.forced_sale_events)/(w@r.event_trials))
    return dict(lower95=float(np.quantile(delta,.025)),upper95=float(np.quantile(delta,.975)),draws=len(w),clusters=len(names),resampling_unit='source_platform',seeds=RANDOM_SEEDS)


def run(out,publish=True):
    out.mkdir(parents=True,exist_ok=False);(out/'households').mkdir()
    th={'low_max_cv':.45,'medium_max_cv':.75};pols=policies();names=[p['name'] for p in pols]
    rows=[];clusters=[];cohorts=[];checks=[]
    baseline=json.loads((ROOT/'baseline_replay_20261018/router/test_cohorts.json').read_text())
    hashes={(r['seed'],r['scenario']):r['hash'] for r in baseline}
    platform_names=[d.platform.iloc[0].lower() for _,d in sim.sources()]
    for seed in sim.TEST_SEEDS:
        for scenario in ['central','stress','neutral']:
            c=sim.generate(seed,'test',scenario,th)
            assert c['hash']==hashes[seed,scenario]
            groups=np.array(platform_names)[c['donor']]
            cohorts.append(dict(seed=seed,scenario=scenario,n=c['n'],hash=c['hash'],matches_baseline=True))
            for mode in ['engine_budget','reserve_free']:
                raw,details=sim.simulate(c,mode,pols,gate_fn=Gates(seed),return_details=True)
                # Verify that extending the evaluator has not changed original policy execution.
                control=sim.simulate(c,mode,sim.policies())
                for actual,expected in zip(raw[:len(BASE)],control):
                    for field in sim.METRICS:assert actual[field]==expected[field],(seed,scenario,mode,field)
                ref=names.index('revised_gate');equiv=names.index('liquidity_debt_volatility');alias=names.index('full_minus_score')
                for field in ['forced_sale','shortfall','ever_cleared','ever_contributed','months_below_1','wealth']:
                    np.testing.assert_array_equal(details[field][equiv],details[field][alias])
                matched=[names.index('matched_savings')]+[names.index(f'matched_random_s{s}') for s in RANDOM_SEEDS]
                for i in matched:np.testing.assert_array_equal(details['monthly_cleared'][i],details['monthly_cleared'][ref])
                checks.append(dict(seed=seed,scenario=scenario,execution=mode,original_policy_execution_identical=True,
                                   no_score_equivalence=True,exact_monthly_matching=True,
                                   reference_monthly_cleared=details['monthly_cleared'][ref].tolist()))
                np.savez_compressed(out/'households'/f'{seed}_{scenario}_{mode}.npz',platform=groups,
                                    **details,names=np.array(names))
                rows+=raw
                for i,name in enumerate(names):
                    for g in sorted(set(groups)):
                        mask=groups==g
                        clusters.append(dict(seed=seed,scenario=scenario,execution=mode,policy=name,platform=g,
                            forced_sale_events=int(details['forced_sale'][i,mask].sum()),event_trials=int(mask.sum())))
            print(seed,scenario,flush=True)
    raw=pd.DataFrame(rows);raw.to_csv(out/'per_seed_all_randomizations.csv',index=False,mode='x')
    # Aggregate all five prescribed random assignments without pretending they are new users.
    random=raw[raw.policy.str.startswith('matched_random_s')].copy();other=raw[~raw.policy.str.startswith('matched_random_s')].copy()
    random['policy']='matched_random';aggregated=[]
    for keys,g in random.groupby(['seed','scenario','execution','policy']):
        r=dict(zip(['seed','scenario','execution','policy'],keys))
        for k in sim.METRICS:r[k]=float(g[k].mean())
        for k in ['shortfall_users','forced_liquidation_users','shortfall_or_liquidation_users','cleared_users','contributing_users']:r[k]=int(g[k].sum())
        r.update(n=int(g.n.sum()),unique_households=sim.N,random_assignments=5)
        aggregated.append(r)
    other['unique_households']=other.n;other['random_assignments']=1
    d=pd.concat([other,pd.DataFrame(aggregated)],ignore_index=True)
    d.to_csv(out/'per_seed.csv',index=False,mode='x')
    cluster=pd.DataFrame(clusters);cluster.loc[cluster.policy.str.startswith('matched_random_s'),'policy']='matched_random'
    cluster=cluster.groupby(['scenario','execution','policy','platform'],as_index=False)[['forced_sale_events','event_trials']].sum()
    cluster.to_csv(out/'cluster_counts.csv',index=False,mode='x')
    final=[]
    for (scenario,mode,policy),g in d.groupby(['scenario','execution','policy'],sort=False):
        r=dict(scenario=scenario,execution=mode,policy=policy,unique_households=int(g.unique_households.sum()),
               random_assignments=int(g.random_assignments.iloc[0]),event_trials=int(g.n.sum()))
        for col,key in [('shortfall_users','shortfall'),('forced_liquidation_users','forced_sale'),('cleared_users','ever_cleared'),('contributing_users','ever_invested')]:
            count=int(g[col].sum());r[key]=dict(events=count,denominator=r['event_trials'],percent=100*count/r['event_trials'])
        r['months_below_one_expense']=float(g.months_below_1.mean());r['mean_final_wealth']=float(g.final_net_wealth.mean())
        # Clearance user-months is matched exactly; ever-cleared and investing are separately reported.
        trials=r['event_trials']*12;count=int(round(float((g.cleared_user_months*g.n*12).sum())))
        r['cleared_user_months']=dict(events=count,denominator=trials,percent=100*count/trials)
        sub=cluster[(cluster.scenario==scenario)&(cluster.execution==mode)]
        reference=sub[sub.policy=='revised_gate'];own=sub[sub.policy==policy]
        reference_rate=100*reference.forced_sale_events.sum()/reference.event_trials.sum()
        r['forced_sale_delta_pp_vs_revised']=r['forced_sale']['percent']-reference_rate
        r['forced_sale_delta_95ci']=interval(own,reference)
        final.append(r)
    payload=dict(simulation_based=True,protocol='revision_audit/PROTOCOL.md',runtime_cutoffs=th,
                 household_seeds=sim.TEST_SEEDS,random_gate_seeds=RANDOM_SEEDS,bootstrap_seeds=RANDOM_SEEDS,
                 n_unique_households_per_scenario=sim.N*len(sim.TEST_SEEDS),months=12,
                 matched_participation_definition='Exact monthly clearance counts, not ever-cleared union or positive investment participation.',
                 random_gate_denominator='Five assignments on the same50000 households:250000 dependent assignment-household trials, not250000 independent users.',
                 suitability_proxy='Own illustrative surplus/risk/liquidity checklist; not a regulatory or commercial-advisor implementation.',
                 cohort_hashes=cohorts,checks=checks,results=final,
                 limitations=['Five source-platform clusters only; CIs conditional on synthetic simulator assumptions.',
                              'No product lock-ins/minima/ranking, actual market backtest or real-world financial-safety validation.',
                              'All generated risk preferences are low; surplus and liquidity proxy are illustrative.'])
    sim.dump(out/'ablation_results.json',payload)
    if publish:
        with (ROOT/'ablation_results.json').open('xb') as f:f.write((out/'ablation_results.json').read_bytes())
    export_tex(final,ROOT/'ablation_table.tex' if publish else out/'ablation_table.tex')
    export_tex(final,out/'all_scenario_tables.tex',all_scenarios=True)
    print('Saved',len(final),'aggregate rows',flush=True)


LABELS={'always_invest':'Always','original_gate':'Original','revised_gate':'Full','score_only':'Score only',
        'no_investing':'None','liquidity_only':'L','liquidity_debt':'L+D','liquidity_debt_volatility':'L+D+V',
        'full_minus_volatility':'Full-V','full_minus_score':'Full-S','matched_savings':'Matched savings',
        'suitability_proxy':'Own proxy','matched_random':'Matched random'}


def export_tex(rows,out,all_scenarios=False):
    lines=['% Simulation only. Requires booktabs and graphicx. C=cleared user-months; I=ever invested.',
           '% Matched gates have equal monthly C counts; I can differ. Random gate averages five assignments.']
    pairs=[(s,m) for s in ['central','stress','neutral'] for m in ['engine_budget','reserve_free']] if all_scenarios else [('central','engine_budget')]
    for sc,mode in pairs:
        lines += [r'\begin{table}[t]',r'\centering',r'\caption{Simulation ablations: '+sc.replace('_',' ')+', '+mode.replace('_',' ')+'.}',
                  r'\resizebox{\columnwidth}{!}{%',r'\begin{tabular}{lrrrrrr}',r'\toprule',
                  r'Policy & Short\% & Sale\% & Mo. $<E$ & Wealth & C\% & I\% \\',r'\midrule']
        for r in rows:
            if r['scenario']!=sc or r['execution']!=mode:continue
            vals=[r['shortfall']['percent'],r['forced_sale']['percent'],r['months_below_one_expense'],r['mean_final_wealth'],r['cleared_user_months']['percent'],r['ever_invested']['percent']]
            lines.append(LABELS[r['policy']]+' & '+' & '.join(f'{x:.3f}' for x in vals)+r' \\')
        lines += [r'\bottomrule',r'\end{tabular}}',r'\end{table}','']
    with out.open('x',encoding='utf-8') as f:f.write('\n'.join(lines))


if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--out',required=True);p.add_argument('--no-publish',action='store_true');a=p.parse_args();run(ROOT/a.out,publish=not a.no_publish)
