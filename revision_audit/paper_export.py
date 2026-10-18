"""Paper-facing numbers and independently recomputed consistency checks."""
import argparse
import csv
import hashlib
import json
import math
import re
import subprocess
from pathlib import Path
import numpy as np
import pandas as pd

ROOT=Path(__file__).resolve().parents[1]


def load(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()


def number(x):
    if x=='':return None
    if x in ['True','False']:return x=='True'
    try:
        v=float(x)
        return int(x) if re.fullmatch(r'-?\d+',x) else v if math.isfinite(v) else None
    except ValueError:return x


def csvrows(p):
    return [{k:number(v) for k,v in row.items()} for row in csv.DictReader(p.open(encoding='utf-8-sig',newline=''))]


def rate(events,n):
    return dict(events=int(events),denominator=int(n),percent=100*int(events)/int(n) if n else None)


def tests(name,path,kind='python'):
    raw=path.read_text(encoding='utf-8-sig',errors='replace')
    if kind=='node':
        get=lambda k:int(re.search(r'# '+k+r' (\d+)',raw)[1]);n=get('tests');f=get('fail');s=get('skipped');e=0;p=get('pass')
    else:
        n=int(re.search(r'Ran (\d+) tests?',raw)[1]);get=lambda k:int(re.search(k+r'=(\d+)',raw)[1]) if re.search(k+r'=(\d+)',raw) else 0
        f=get('failures');e=get('errors');s=get('skipped');p=n-f-e-s
    return dict(suite=name,total=n,passed=p,failed=f,errors=e,skipped=s,log=path.relative_to(ROOT).as_posix(),
                failures=re.findall(r'^(?:FAIL|ERROR): (.+)$',raw,re.M))


def export(out):
    baseline=load(ROOT/'baseline_results.json');sources={}
    def source(p):
        sources[p.relative_to(ROOT).as_posix()]=sha(p)
        return p
    def table(p,predicate=None):
        rows=csvrows(source(p))
        return [r for r in rows if predicate(r)] if predicate else rows
    def js(p):return load(source(p))
    f=out/'forecast';v=out/'volatility';s=out/'score';r=out/'router';d=out/'data';e=out/'engine';legacy=out/'legacy'
    selected=js(f/'selection.json')['selected_method'];keep=lambda row:row.get('method') in ['original','historical_mean',selected]
    forecast=dict(selection=js(f/'selection.json'),test_pooled=table(f/'test_pooled.csv'),
        paper_comparison=table(f/'selected_comparison.csv'),per_platform=table(f/'test_per_platform.csv'),
        per_series=table(f/'test_per_series.csv',keep),bootstrap_ci=table(f/'test_bootstrap_ci.csv',keep),
        paired_ci=table(f/'test_vs_mean_paired_bootstrap_ci.csv'),
        diebold_mariano=table(f/'test_dm_vs_mean.csv',keep),
        interval_coverage=table(f/'test_interval_coverage.csv',keep),seed_variability=table(f/'test_seed_variability.csv'),
        fit_diagnostics=table(f/'fit_diagnostics.csv'),production_replaced=False,
        qualification='Overlapping rolling targets and five platform clusters; model selection uses validation only. Production replacement guard fails.')
    # Read the current deployment result rather than relabel the historical comparator.
    vol=js(ROOT/'revision_audit/final_volatility/volatility_deployment.json')
    frozen=js(v/'selection.json');assert frozen['overall']['name']==vol['frozen_selection']['name']
    oldcut=js(ROOT/'volatility_audit/results_20261017/target_cutoffs.json');newcut=js(v/'target_cutoffs.json')
    assert oldcut==newcut
    vol['all_frozen_model_comparators']=table(v/'final_tables/pooled_model_comparison.csv')
    vol['all_confusions']=table(v/'final_tables/all_models_confusion.csv')
    vol['class_distribution']=table(v/'class_distribution.csv')
    vol['validation_sensitivity_only']=table(v/'validation_threshold_grid.csv')
    vol['historical_comparator_role']='The frozen audit runtime_cv30 name denotes archived .35/.75; deployed result is separately .45/.75.'
    cm=np.array(vol['deployed']['confusion_matrix']);vol['deployed']['agreement_rate']=rate(int(np.trace(cm)),int(cm.sum()))
    primary=table(r/'test_per_seed.csv');router=[]
    for scenario in ['central','stress','neutral']:
        for mode in ['engine_budget','reserve_free']:
            for policy in dict.fromkeys(x['policy'] for x in primary):
                g=[x for x in primary if x['scenario']==scenario and x['execution']==mode and x['policy']==policy]
                n=sum(x['n'] for x in g)
                row=dict(scenario=scenario,execution=mode,policy=policy,n_unique_households=n,seeds=[x['seed'] for x in g])
                for metric,col in [('shortfall','shortfall_users'),('forced_sale','forced_liquidation_users'),('ever_cleared','cleared_users'),('ever_invested','contributing_users')]:row[metric]=rate(sum(x[col] for x in g),n)
                for metric in ['months_below_1','months_below_3','final_net_wealth','median_final_net_wealth','total_contributions','final_arrears']:row[metric]=sum(x[metric] for x in g)/len(g)
                count=round(sum(x['cleared_user_months']*x['n']*12 for x in g));row['cleared_user_months']=rate(count,n*12)
                router.append(row)
    ablations=js(out/'ablations/ablation_results.json')
    ablation_reproduction=ablations==js(ROOT/'ablation_results.json')
    score=dict(test=table(s/'test_metrics.csv'),validation=table(s/'validation_candidates.csv'),
               selected=js(s/'selection.json'),weight_sensitivity=table(s/'validation_weight_sensitivity.csv'),
               calibration_bins=table(s/'calibration_bins.csv'),coefficients=table(s/'coefficients.csv'),
               monotonicity={x:js(s/f'{x}_expense_monotonicity.json') for x in ['original','corrected']},
               adoption=js(ROOT/'revision_audit/prompt3_score_guard.json'),production_changed=False)
    valchosen=score['selected']['chosen'];testby={x['model']:x for x in score['test']}
    current_guard={split:dict(auc_improves=a['auc']>b['auc'],brier_improves=a['brier']<b['brier'],candidate_auc=a['auc'],candidate_brier=a['brier'],baseline_auc=b['auc'],baseline_brier=b['brier'])
                   for split,a,b in [('validation',valchosen['corrected_calibrated'],valchosen['original_calibrated']),('test',testby['corrected_calibrated'],testby['original_calibrated'])]}
    assert not all(x['auc_improves'] and x['brier_improves'] for x in current_guard.values())
    score['final_replay_adoption_guard']=current_guard
    fixtures=js(legacy/'router_results.json');fixtures['positive_definition']='Allow under documented conservative engineering policy; not actual financial safety.'
    for split in fixtures['splits'].values():
        for row in split.values():row['agreement_rate']=rate(row['tp']+row['tn'],row['n'])
    engine=table(e/'engine_summary.csv')
    for row in engine:
        row['eligible_rate']=rate(row['eligible'],row['n'])
        row['minimum_violation_rate']=rate(row['minimum_violations'],row['allocations'])
        row['percentage_violation_rate']=rate(row['percentage_violations'],row['eligible'])
    llm=dict(controlled=table(e/'controlled_summary.csv'),live=table(e/'live_summary.csv'),
             orchestration_counts={},model=js(e/'live_125.json')['model'],temperature=0,
             qualification='Fresh125 API requests; model ID is not immutable weights. Rate limits retained; constrained templates, not free-text quality validation.')
    for row in llm['controlled']:row['acceptance_rate']=rate(row['accepted'],row['n'])
    for row in llm['live']:
        for key in ['api_success','strict_schema_pass','raw_facts_faithful','accepted','fallback','timeout']:row[key+'_rate']=rate(row[key],row['n'])
        row['schema_given_api_success']=rate(row['strict_schema_pass'],row['api_success'])
        row['faithfulness_given_api_success']=rate(row['raw_facts_faithful'],row['api_success'])
    orchestration=js(e/'controlled_orchestration.json')
    for status in ['ready','fallback']:llm['orchestration_counts'][status]=sum(x['status']==status for x in orchestration)
    test_suites=[]
    for name,path,kind in [('forecast',f/'tests.log','python'),('volatility',v/'final_tables/test_run.txt','python'),('router',r/'final_tables/tests.txt','python'),('score',out/'logs/score_4.txt','python'),('data',d/'tests.txt','python'),('server',out/'logs/node_tests_1.txt','node'),('revision',out/'logs/revision_tests_1.txt','python'),('paper',out/'logs/paper_tests_1.txt','python'),('legacy_python',out/'logs/legacy_tests_1.txt','python')]:
        source(path);test_suites.append(tests(name,path,kind))
    custom=js(legacy/'node_results.json');t=custom['test_summary'];test_suites.append(dict(suite='legacy_node_custom',**t,errors=0,skipped=0,
        failures=[x['name'] for x in custom['tests'] if not x['passed']],log=(legacy/'research_node.log').relative_to(ROOT).as_posix()))
    totals={k:sum(x[k] for x in test_suites) for k in ['total','passed','failed','errors','skipped']}
    data=dict(forecast=table(d/'forecast_metrics.csv'),new_synthetic_forecast=table(d/'new_synthetic_pooled_forecast.csv'),
              volatility=table(d/'volatility_metrics.csv'),per_class=table(d/'volatility_perclass.csv'),
              class_confusions=table(d/'volatility_confusion.csv'),deduplication=js(d/'dedupe_summary.json'),
              real_provenance=js(d/'real_provenance.json'),unsupported_horizons=table(d/'unsupported_horizons.csv'))
    original_node=(source(legacy/'original_node.log')).read_text(encoding='utf-8-sig')
    original_current=[]
    for name in ['Low liquidity blocks invest','High debt blocks invest','High volatility blocks invest','Ideal passes invest']:
        match=re.search(re.escape(name)+r': Invest Allowed=(true|false)',original_node)
        original_current.append(dict(scenario=name,allowed=match[1]=='true'))
    # Count interval coverage directly from held-out predictions, not by rounding a percentage.
    intervals=[];pred=pd.read_csv(f/'test_predictions.csv',dtype={'seed':str});quant=pd.read_csv(f/'conformal_quantiles.csv')
    for row in forecast['interval_coverage']:
        if row['scope']!='pooled':continue
        sub=pred[(pred.method==row['method'])&(pred.horizon==row['horizon'])]
        if 'seed' in sub:sub=sub[sub.seed.isin(['deterministic','ensemble'])]
        q=quant[(quant.method==row['method'])&(quant.horizon==row['horizon'])&np.isclose(quant.nominal_coverage,row['nominal_coverage'])].iloc[0]['q']
        # The exact interval construction is shared with forecast_audit/analyze.py.
        lower=np.maximum(0,sub.prediction-q*sub.interval_scale);upper=sub.prediction+q*sub.interval_scale
        covered=int(((sub.actual>=lower)&(sub.actual<=upper)).sum())
        intervals.append(dict(method=row['method'],horizon=row['horizon'],nominal_coverage=row['nominal_coverage'],empirical=rate(covered,len(sub)),
                              recorded_fraction=row['empirical_coverage'],fraction_recomputed=covered/len(sub)))
    result=dict(schema_version=1,git_commit=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),
        branch=subprocess.check_output(['git','branch','--show-current'],text=True).strip(),baseline_sha256=sha(ROOT/'baseline_results.json'),
        source_manifest=sources,commands=js(out/'commands.json'),legacy_commands=js(legacy/'commands.json'),
        seeds=baseline['seeds'],protocol='revision_audit/PROTOCOL.md',provenance='PROVENANCE.md',
        table_numbering='Revision export aliases: IV forecasts, V volatility, VI router simulation, VII ablations, VIII health, IX engine, X LLM. Supplied original PDF instead has only I-VII and its VI contains four fixtures; no updated manuscript was supplied.',
        original_paper_tables=baseline['paper_tables_IV_X'],
        original_paper_fixture_current_results=original_current,
        tables=dict(IV_forecasting=forecast,V_volatility=vol,VI_router_simulation=router,VII_ablations=ablations,
                    VIII_health=score,IX_engine=engine,X_llm=llm,router_fixtures=fixtures,data_transfer=data,
                    interval_count_checks=intervals,engine_ranking=table(e/'ranking_comparison.csv'),
                    router_uncertainty=dict(seed_means_sd=table(r/'test_sd.csv'),paired_five_seed_t95ci=table(r/'test_paired_deltas.csv'),
                                            validation_grid=table(r/'validation_pareto_grid.csv'),validation_only_selection=js(r/'selection.json'))),
        tests=dict(suites=test_suites,totals=totals,qualification='Unique suite totals only; repeated runs by report scripts and prompt3 excluded. Known retained failures are not suppressed.'),
        performance=dict(local_python=js(legacy/'python_results.json')['performance'],
                         local_node_and_loopback=js(legacy/'performance_results.json'),
                         qualification='Local timings and loopback HTTP timings are distinct from the separately measured live LLM network latency; concurrent benchmark load may affect timings.'),
        ablation_full_replay_exact=ablation_reproduction,
        limitations=['Simulation outcomes do not establish actual financial safety or market profitability.',
                     'Original income/label provenance unverified despite recovered statistical-label notebook.',
                     'Health scalar defect retained after failed predeclared adoption guard; no score contribution measured in ablations.',
                     'Matched monthly clearance is not matched actual investing or ever-cleared share.',
                     'Full gate loses to savings ranking on central forced sales; retain every scenario and uncertainty interval.',
                     'Original paper was not changed; stale text must be revised manually.'])
    # Four explicit user-requested consistency checks.
    central={x['policy']:x for x in router if x['scenario']=='central' and x['execution']=='engine_budget'}
    a=central['revised_gate']['final_net_wealth'];b=central['original_gate']['final_net_wealth'];delta=a-b
    oldledger=baseline['baseline_paper_ready_ledger']['rows'];oldrow=next(x for x in oldledger if x['scope']=='Router simulation central' and x['metric']=='final_net_wealth')
    old_quote=oldrow['absolute_change']
    check1=dict(status='FAIL',reason='No updated manuscript supplied; preserved RESULTS_FOR_PAPER.md quotes the older whole-system wealth difference. Generated snippets use the corrected current value.',
                table_VI_original_wealth=b,table_VI_revised_wealth=a,recomputed_revised_minus_original=delta,
                preserved_quoted_value=old_quote,preserved_text_matches=math.isclose(delta,old_quote,abs_tol=1e-9),
                preserved_text_source='RESULTS_FOR_PAPER.md: Router simulation central / final_net_wealth',
                generated_text_value=delta,generated_text_matches=True)
    gain=vol['deployed']['macro_f1']-vol['original']['macro_f1'];ci=vol['paired_ci']['macro_f1']
    check2=dict(status='PASS' if ci['lower95']<=gain<=ci['upper95'] else 'FAIL',point_gain=gain,lower95=ci['lower95'],upper95=ci['upper95'],
                recomputation='Paired5000-draw whole-platform bootstrap was recomputed from saved target/prediction rows in revision_audit/evaluate.py; not adjusted to force inclusion.')
    failures=[];n_checked=0
    def walk(x,path=''):
        nonlocal n_checked
        if isinstance(x,dict):
            if {'events','denominator','percent'}<=x.keys():
                expected=100*x['events']/x['denominator'] if x['denominator'] else None;n_checked+=1
                if expected!=x['percent']:failures.append(dict(path=path,expected=expected,actual=x['percent']))
            for k,vv in x.items():walk(vv,path+'/'+str(k))
        elif isinstance(x,list):
            for i,vv in enumerate(x):walk(vv,path+'/'+str(i))
    walk(result['tables'])
    for name in ['original','deployed']:
        cm=np.array(vol[name]['confusion_matrix']);tp=np.diag(cm);den=cm.sum(0)+cm.sum(1)
        macro=float(np.divide(2*tp,den,out=np.zeros(3,dtype=float),where=den>0).mean())
        if not math.isclose(macro,vol[name]['macro_f1'],abs_tol=1e-14):failures.append(dict(volatility=name,macro_recomputed=macro,recorded=vol[name]['macro_f1']))
    # Preserve aliases and imported old-paper numbers as historical records, not current count-derived rates.
    for x in intervals:
        if not math.isclose(x['recorded_fraction'],x['fraction_recomputed'],abs_tol=1e-14):failures.append(dict(interval=x))
    check3=dict(status='PASS' if not failures else 'FAIL',count_derived_percentages_checked=n_checked,interval_fractions_independently_checked=len(intervals),failures=failures,
                configuration_note='Nominal coverage, CI confidence and weight/intervention settings are configuration values. sMAPE averages relative errors, not a binary event count.')
    count_ok=totals['total']==sum(totals[k] for k in ['passed','failed','errors','skipped'])
    check4=dict(status='PASS' if count_ok else 'FAIL',values=totals,all_tests_passed=totals['failed']==totals['errors']==0)
    result['consistency_checks']=dict(table_VI_wealth_vs_text=check1,volatility_gain_inside_paired_ci=check2,count_derived_percentages=check3,test_suite_counts=check4)
    # Importing baseline data as historical must not imply those old performance/API values were remeasured.
    result['original_paper_tables']['historical_record_only']=True
    result['baseline_comparisons']=baseline_comparison(result,baseline,out)
    with (ROOT/'results_for_paper.json').open('x',encoding='utf-8') as h:json.dump(result,h,indent=2,allow_nan=False)
    latex(result,ROOT/'paper_table_updates.tex')
    summary(result,baseline,ROOT/'changes_summary.md')
    with (out/'consistency_checks.json').open('x',encoding='utf-8') as h:json.dump(result['consistency_checks'],h,indent=2)
    print(json.dumps(result['consistency_checks'],indent=2))


def baseline_comparison(result,baseline,out):
    changes=[]
    def add(scope,metric,before,after):
        changes.append(dict(scope=scope,metric=metric,before=before,after=after,absolute_change=after-before,
                            relative_change_percent=100*(after-before)/before if before else None))
    vol=result['tables']['V_volatility']
    for metric in ['macro_f1','high_recall','balanced_accuracy']:add('deployed volatility',metric,vol['original'][metric],vol['deployed'][metric])
    old={tuple(x[k] for k in ['scenario','execution','policy']):x for x in baseline['headline_tables']['baseline_replay_20261018/router/test_mean.csv']['rows']}
    for x in result['tables']['VI_router_simulation']:
        y=old[x['scenario'],x['execution'],x['policy']];scope='/'.join([x['scenario'],x['execution'],x['policy']])
        for newkey,oldkey in [('shortfall','shortfall_rate'),('forced_sale','forced_liquidation_rate'),('ever_cleared','ever_cleared'),('ever_invested','ever_contributed')]:add(scope,newkey+'_percent',100*y[oldkey],x[newkey]['percent'])
        add(scope,'mean_final_wealth',y['final_net_wealth'],x['final_net_wealth']);add(scope,'months_below_1',y['months_below_1'],x['months_below_1'])
    oldscore={x['model']:x for x in baseline['headline_tables']['baseline_replay_20261018/score_default_threads/test_metrics.csv']['rows']}
    for x in result['tables']['VIII_health']['test']:
        for metric in ['auc','brier','ece10']:add('score/'+x['model'],metric,oldscore[x['model']][metric],x[metric])
    oldlive=baseline['llm_live_change']['replay'];newlive=next(x for x in result['tables']['X_llm']['live'] if x['seed']=='all')
    for metric in ['api_success','strict_schema_pass','raw_facts_faithful','fallback','timeout','latency_mean_ms','latency_p95_ms']:add('live LLM',metric,oldlive[metric],newlive[metric])
    rows=changes
    with (out/'before_after_headlines.csv').open('x',encoding='utf-8',newline='') as h:
        w=csv.DictWriter(h,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
    return dict(rows=rows,relative_change_note='Relative change is arithmetic, not a count-derived empirical percentage; zero references are undefined.',
                csv=(out/'before_after_headlines.csv').relative_to(ROOT).as_posix())


def latex(result,path):
    vol=result['tables']['V_volatility'];routers=result['tables']['VI_router_simulation']
    lines=['% Revision snippets only. Original paper is untouched. Requires booktabs and graphicx.',
           '% Proposed numbering is explicit in results_for_paper.json; supplied PDF numbering differs.',
           r'\begin{table}[t]\centering',r'\caption{Forward14-day CV target: deployed rule.}',r'\begin{tabular}{lrr}\toprule',
           r'Rule & Macro-F1 & HIGH recall \\\midrule']
    for label,key in [('Legacy .35/.75','original'),('Deployed .45/.75','deployed')]:
        x=vol[key];lines.append(f"{label} & {x['macro_f1']:.6f} & {x['high_recall']:.6f}"+r' \\')
    lines += [r'\bottomrule\end{tabular}\end{table}',r'\begin{table}[t]\centering',r'\caption{Central simulation with engine budget.}',r'\begin{tabular}{lrrr}\toprule',r'Gate & Shortfall\% & Forced sale\% & Wealth \\\midrule']
    d={x['policy']:x for x in routers if x['scenario']=='central' and x['execution']=='engine_budget'}
    for name in ['original_gate','revised_gate','no_investing']:
        x=d[name];lines.append(name.replace('_',' ')+f" & {x['shortfall']['percent']:.3f} & {x['forced_sale']['percent']:.3f} & {x['final_net_wealth']:.6f}"+r' \\')
    lines += [r'\bottomrule\end{tabular}\end{table}',
              f"% Current tableVI revised-minus-original mean wealth = {d['revised_gate']['final_net_wealth']-d['original_gate']['final_net_wealth']:.12f} INR.",
              '% The prior quoted whole-system wealth difference must be updated; do not mix runtime versions.']
    for title,headers,records,keys in [
        ('Health outcome diagnostics',['Model','AUC','Brier'],result['tables']['VIII_health']['test'],['model','auc','brier']),
        ('Allocator enumeration',['Stage','Method','N','Min violations','Pct violations'],result['tables']['IX_engine'],['stage','method','n','minimum_violations','percentage_violations']),
        ('Fresh live LLM measurements',['Seed','N','Success','Fallback','Mean ms'],result['tables']['X_llm']['live'],['seed','n','api_success','fallback','latency_mean_ms'])]:
        lines += [r'\begin{table}[t]\centering',r'\caption{'+title+'.}',r'\resizebox{\columnwidth}{!}{\begin{tabular}{l'+'r'*(len(headers)-1)+r'}\toprule',' & '.join(headers)+r' \\\midrule']
        for row in records:
            vals=[row[k] for k in keys];lines.append(' & '.join((f'{z:.6f}' if isinstance(z,float) else str(z)).replace('_',r'\_') for z in vals)+r' \\')
        lines += [r'\bottomrule\end{tabular}}\end{table}']
    lines += [r'\begin{table}[t]\centering',r'\caption{Original incomplete fixtures under current fail-closed policy.}',
              r'\begin{tabular}{lr}\toprule',r'Fixture & Allowed \\\midrule']
    for row in result['original_paper_fixture_current_results']:
        lines.append(row['scenario']+' & '+str(row['allowed']).lower()+r' \\')
    lines += [r'\bottomrule\end{tabular}\end{table}',
              '% Original ideal fixture lacks valid analytics. Current complete1914-case oracle matrix has zero false allows/blocks; oracle agreement is not financial outcome validation.',
              r'\begin{table}[t]\centering',r'\caption{Transfer CV classification with history-specific training targets.}',
              r'\resizebox{\columnwidth}{!}{\begin{tabular}{llrrr}\toprule',
              r'Dataset & Rule & N & Macro-F1 & HIGH recall \\\midrule']
    for row in result['tables']['data_transfer']['volatility']:
        if row['method'] not in ['legacy_cv30_035','runtime_cv30']:continue
        vals=[row['dataset'],row['method'],row['n'],row['macro_f1'],row['high_recall']]
        lines.append(' & '.join(('NA' if z is None else f'{z:.6f}' if isinstance(z,float) else str(z)).replace('_',r'\_') for z in vals)+r' \\')
    lines += [r'\bottomrule\end{tabular}}\end{table}']
    lines += ['% All ablations including stress/neutral/reserve-free: revision_audit/ablations_20261018/all_scenario_tables.tex',
              r'\input{ablation_table.tex}']
    with path.open('x',encoding='utf-8') as h:h.write('\n'.join(lines)+'\n')


def summary(result,baseline,path):
    checks=result['consistency_checks'];tot=result['tests']['totals'];vol=result['tables']['V_volatility']
    lines=['# Changes versus baseline_results.json','',
           'Prompts2–5 executed in order on revision-ablations. Baseline artifacts, original datasets/labels, archived results and the research paper remain unchanged. Full executed evidence and command logs are under revision_audit/.','',
           '- Provenance: recovered deleted notebooks and documented first file additions/renames; original income/original-label origin and seeds remain unverified.',
           f"- Deployed CV30 .45/.75: macro-F1 {vol['original']['macro_f1']} -> {vol['deployed']['macro_f1']}; HIGH recall remains{vol['deployed']['high_recall']}. Frozen forward targets/train terciles and selection remain unchanged; legacy .35 comparator is explicitly named.",
           '- Corrected hand health scalar fails validation and test guard, so production health remains unchanged. See score_decision.md and the guard JSON; diagnostic fitted risk models are not silently deployed as health scores.',
           '- Router simulation now consumes deployed volatility, changing some original/score-only gate outcomes; the full gate outcomes remain unchanged in the measured cohorts. Per-scenario deltas are in prompt3_router_deltas.csv. The optional simulator callback changes no existing policy/accounting default.',
           '- New ablations retain50000 unique households, five seeds, all scenarios/budget modes and5000-draw paired platform bootstrap. Full gate has no measured incremental score contribution. It loses to matched savings ranking and beats matched random on central forced sales; monthly clearance matching does not match actual investing.',
           '- Forecast, investment allocator and explanation logic are unchanged; full benchmarks were reexecuted. API outcomes/latency are new run-dependent measurements, not deterministic improvement.',
           f"- Tests: baseline {baseline['summary']['tests_passed']}/{baseline['summary']['unique_test_total']} passed; current {tot['passed']}/{tot['total']} passed, {tot['failed']} failures, {tot['errors']} errors. Twelve added revision tests; existing failures remain visible.",'', '## Required consistency checks','']
    for name,x in checks.items():lines.append(f"- **{name}: {x['status']}** — "+json.dumps(x,ensure_ascii=True))
    score_changes=[x for x in result['baseline_comparisons']['rows'] if x['scope']=='score/original_calibrated' and x['metric'] in ['auc','brier']]
    lines += ['', 'Downstream negative result: changing volatility labels worsens the original calibrated health predictor on the same held-out outcomes: '+ '; '.join(f"{x['metric']} {x['before']} -> {x['after']}" for x in score_changes)+'. This was not used to retune or reverse the user-requested deployment.', '', 'Full before/after current-versus-baseline numeric comparisons: '+result['baseline_comparisons']['csv']+'.', '', '## Strongest defensible contribution','',
              'An auditable decision pipeline with explicit failure handling, empirically evaluated constraints and honest conditional simulation trade-offs. The ablations support a contribution from volatility/debt gating under these assumptions, but not an incremental health-score benefit, general superiority to liquidity ranking, real-world safety, optimal cutoffs, profitable investments or validated user comprehension.','',
              'Use results_for_paper.json for current numbers and paper_table_updates.tex/ablation_table.tex for snippets. Table numbering is an export proposal: the supplied original PDF has no simulation wealth in TableVI. The stale preserved narrative is flagged FAIL until an updated manuscript is available and revised; it was not edited.']
    with path.open('x',encoding='utf-8') as h:h.write('\n'.join(lines)+'\n')


if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--out',default='revision_audit/final_20261018');a=p.parse_args();export(ROOT/a.out)
