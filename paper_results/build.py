"""Read-only synthesis of executed metrics. Never reruns a model or API."""
import argparse
import hashlib
import json
import shutil
from pathlib import Path

import numpy as np
import pandas as pd

ROOT=Path(__file__).resolve().parents[1]
F=ROOT/'forecast_audit/results_20261017';V=ROOT/'volatility_audit/results_20261017'
R=ROOT/'router_sim/results_20261017';S=ROOT/'score_audit/results_20261017'
E=ROOT/'engine_llm_audit/results_20261017';D=ROOT/'data_audit/results_20261017'
COMMANDS={
 'F':'forecast_audit/.venv/Scripts/python.exe forecast_audit/analyze.py --out <fresh-forecast-run> (run.py select/calibrate/test first)',
 'V':'forecast_audit/.venv/Scripts/python.exe volatility_audit/run.py --out <fresh-volatility-run> --stage test (prepare/select and compare.py freeze first)',
 'R':'forecast_audit/.venv/Scripts/python.exe router_sim/simulate.py --out <fresh-router-run> --stage test (prepare/validation first)',
 'S':'forecast_audit/.venv/Scripts/python.exe score_audit/run.py --out <fresh-score-run> --stage test (prepare/select first)',
 'E':'node engine_llm_audit/evaluate.cjs before --archive-before; node engine_llm_audit/evaluate.cjs after (ENGINE_AUDIT_OUT must be a fresh directory)',
 'L':'node engine_llm_audit/live.cjs (fresh ENGINE_AUDIT_OUT, synthetic snapshots, API quota); engine_llm_audit/summarize.py',
 'C':'node engine_llm_audit/evaluate.cjs before --archive-before; node engine_llm_audit/evaluate.cjs after; node engine_llm_audit/orchestration.cjs',
 'D':'forecast_audit/.venv/Scripts/python.exe data_audit/run.py --out <fresh-data-run> --stage clone; same --stage evaluate',
}


def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()


def main(out,report):
    out.mkdir(parents=True,exist_ok=False);tables=out/'tables';tables.mkdir();rows=[];inputs={};sources={}
    def source(p):
        rel=p.relative_to(ROOT).as_posix();inputs[rel]=sha(p)
        if rel not in sources.values():sources[f'T{len(sources)+1}']=rel
        return next(k for k,v in sources.items() if v==rel)
    def read(p):source(p);return pd.read_csv(p)
    def add(scope,metric,before,after,unit,n,ref,evaluated,p,cmd,note=''):
        before=None if before is None or pd.isna(before) else float(before);after=None if after is None or pd.isna(after) else float(after)
        delta=after-before if before is not None and after is not None else None
        rows.append(dict(scope=scope,metric=metric,reference=ref,evaluated=evaluated,before=before,after=after,absolute_change=delta,
            relative_change_percent=100*delta/before if before not in (None,0) and delta is not None else None,unit=unit,n=n,source=source(p),
            metric_file=p.relative_to(ROOT).as_posix(),command_id=cmd,command=COMMANDS[cmd],qualification=note))
    f=read(F/'selected_comparison.csv')
    for h in (7,15,30):
        sub=f[f.horizon==h].set_index('method');chosen=sub.loc['mean_median_075']
        for ref in ('historical_mean','original'):
            for metric in ('mae','rmse'):
                add(f'Legacy synthetic H{h}',metric,sub.loc[ref,metric],chosen[metric],'INR',int(chosen.n_forecast_instances),ref,'frozen blend',F/'selected_comparison.csv','F','Production unchanged: failed validation RMSE guard; overlaps/unequal series composition.')
    intervals=read(F/'test_interval_coverage.csv')
    for h in (7,15,30):
        sub=intervals[(intervals.scope=='pooled')&(intervals.group=='all')&(intervals.horizon==h)&(intervals.nominal_coverage==.9)].set_index('method')
        add(f'Legacy synthetic H{h}','90% interval coverage',sub.loc['historical_mean','empirical_coverage']*100,sub.loc['mean_median_075','empirical_coverage']*100,'percent',int(sub.loc['mean_median_075','n_forecast_instances']),'historical mean','frozen blend',F/'test_interval_coverage.csv','F','Empirical marginal coverage; not IID guarantee, conditional platform undercoverage retained.')
    vol=read(V/'test_metrics.csv').query("level=='pooled'").set_index('model');selected='grid_cv30_0.45_0.75'
    for metric in ('macro_f1','high_recall','balanced_accuracy','high_to_low'):
        add('Forward CV, global train cutoffs',metric,vol.loc['runtime_cv30',metric],vol.loc[selected,metric],'count' if metric=='high_to_low' else 'fraction',247,'runtime CV30 .35/.75','selected .45/.75',V/'test_metrics.csv','V','Synthetic; HIGH recall unchanged; HIGH-to-LOW errors worsen. No production replacement.')
    router=read(R/'test_mean.csv')
    for scenario in ('central','stress'):
        sub=router[(router.scenario==scenario)&(router.execution=='engine_budget')].set_index('policy')
        for metric in ('shortfall_rate','forced_liquidation_rate','months_below_1','final_net_wealth','ever_cleared','ever_contributed'):
            rate=metric.endswith('_rate') or metric.startswith('ever_');unit='percent' if rate else 'months' if metric.startswith('months') else 'INR'
            add(f'Router simulation {scenario}',metric,sub.loc['original_gate',metric]*(100 if rate else 1),sub.loc['revised_gate',metric]*(100 if rate else 1),unit,50000,'original gate','revised gate',R/'test_mean.csv','R','5x10000 paired users; assumed cash-flow/asset process, common engine budget; not real-world safety.')
    score=read(S/'test_metrics.csv').set_index('model')
    for target in ('corrected_calibrated','fit_corrected_factors'):
        for metric in ('auc','brier','ece10'):
            add('Score simulated 6-month outcome',metric,score.loc['original_calibrated',metric],score.loc[target,metric],'fraction',50000,'calibrated original',target,S/'test_metrics.csv','S','Corrected scalar rejected; learned risk model not production health weights. CIs in score table.')
    for name in ('original','corrected'):source(S/f'{name}_expense_monotonicity.json')
    a=json.loads((S/'original_expense_monotonicity.json').read_text());b=json.loads((S/'corrected_expense_monotonicity.json').read_text())
    add('Score expense +10% intervention','spurious score increases',a['score_increased'],b['score_increased'],'count',50000,'original score','research corrected score',S/'corrected_expense_monotonicity.json','S','TRAIN intervention; production defect remains because corrected scalar failed predictive guard.')
    engine=read(E/'engine_summary.csv');before=engine[engine.stage=='before'].iloc[0];after=engine[(engine.stage=='after')&(engine.method=='proposed')].iloc[0]
    for metric in ('minimum_violations','percentage_violations','eligible','allocations'):
        add('Engine valid-contract enumeration',metric,before[metric],after[metric],'count',1728,'original allocator','revised allocator',E/'engine_summary.csv','E','Same profiles; fewer selected products, 1080 vs792 allocations. Minimum count is allocations, percent count is profiles.')
    controlled=read(E/'controlled_summary.csv');corrupt=['number999','product','wrong_number_context']
    add('LLM controlled corruption','corrupt responses accepted',controlled[(controlled.stage=='before')&controlled['case'].isin(corrupt)].accepted.sum(),controlled[(controlled.stage=='after')&controlled['case'].isin(corrupt)].accepted.sum(),'count',375,'schema-only validator','snapshot-bound templates',E/'controlled_summary.csv','C','125 snapshots x3 corruptions; not free-prose semantic understanding.')
    live=read(E/'live_summary.csv');live=live[live.seed.astype(str)=='all'].iloc[0]
    for metric in ('api_success','strict_schema_pass','raw_facts_faithful','fallback','timeout','latency_mean_ms','latency_p95_ms'):
        add('LLM live pinned model',metric,None,live[metric],'ms' if metric.startswith('latency') else 'count',125,'not measured on matched old live set','gpt-oss-20b template selection',E/'live_summary.csv','L','19 HTTP429 retained; latency includes fast failures, excludes pacing; successful-only faithfulness106/106.')
    dedup=json.loads((D/'dedupe_summary.json').read_text());add('Data canonicalization','rows',dedup['raw_rows'],dedup['canonical_rows'],'count',1380,'all donors','one whole donor/platform',D/'dedupe_summary.json','D','Population changed; NOT an algorithm-performance improvement. Conflicting keys retained in audit.')
    real=read(D/'forecast_metrics.csv').query("dataset=='real_single_driver'")
    for h in (7,15,30):
        sub=real[real.horizon==h].set_index('method')
        for target in ('original','frozen_mean_median075'):
            for metric in ('mae','rmse'):
                add(f'Real one-driver H{h}',metric,sub.loc['historical_mean',metric],sub.loc[target,metric],'USD',int(sub.loc[target,'target_pairs']),'historical mean',target,D/'forecast_metrics.csv','D','Zero-filled calendar earnings; one author, gross receipts; no population CI, no retraining/selection.')
    syn=read(D/'new_synthetic_pooled_forecast.csv')
    for h in (7,15,30):
        sub=syn[syn.horizon==h].set_index('method')
        for metric in ('mae','rmse'):
            add(f'New synthetic transfer H{h}',metric,sub.loc['historical_mean',metric],sub.loc['frozen_mean_median075',metric],'INR',int(sub.loc['historical_mean','target_pairs']),'historical mean','frozen blend',D/'new_synthetic_pooled_forecast.csv','D','Five fixed seeds; frozen blend loses both metrics. New hypothetical generator, not real wages.')
    vtransfer=read(D/'volatility_metrics.csv').query("dataset=='real_single_driver'").set_index('method')
    for metric in ('macro_f1','high_recall'):
        add('Real CV relative-target transfer',metric,vtransfer.loc['runtime_cv30',metric],vtransfer.loc['frozen_selected_cv30',metric],'fraction',17,'runtime .35/.75','frozen .45/.75',D/'volatility_metrics.csv','D','PER-HISTORY cutoffs differ from legacy global target. HIGH support0; recall NA, not zero.')
    full=pd.DataFrame(rows);full.to_csv(tables/'before_after_all_metrics.csv',index=False,mode='x')
    copies={
        'forecast_full_comparison.csv':F/'selected_comparison.csv','forecast_ci.csv':F/'test_bootstrap_ci.csv',
        'forecast_intervals.csv':F/'test_interval_coverage.csv','forecast_dm.csv':F/'test_dm_vs_mean.csv',
        'volatility_models.csv':V/'final_tables/pooled_model_comparison.csv','volatility_confusion.csv':V/'test_confusion.csv',
        'router_all_scenarios.csv':R/'test_mean.csv','router_paired_ci.csv':R/'test_paired_deltas.csv','router_grid.csv':R/'validation_pareto_grid.csv',
        'score_models.csv':S/'test_metrics.csv','score_calibration.csv':S/'calibration_bins.csv','score_weight_sensitivity.csv':S/'validation_weight_sensitivity.csv',
        'engine_constraints.csv':E/'engine_summary.csv','llm_live.csv':E/'live_summary.csv','llm_controlled.csv':E/'controlled_summary.csv',
        'data_all_forecasts.csv':D/'forecast_metrics.csv','data_volatility_transfer.csv':D/'volatility_metrics.csv',
        'new_synthetic_forecast.csv':D/'new_synthetic_pooled_forecast.csv','real_provenance.json':D/'real_provenance.json'}
    for name,p in copies.items():source(p);shutil.copy2(p,tables/name)
    pd.DataFrame([dict(source_id=k,file=v,sha256=inputs[v]) for k,v in sources.items()]).to_csv(tables/'metric_provenance.csv',index=False,mode='x')
    pd.DataFrame([dict(command_id=k,command=v) for k,v in COMMANDS.items()]).to_csv(tables/'commands.csv',index=False,mode='x')
    log=ROOT/'CHANGES_results.md'
    if log.exists():log=out/'CHANGES_results.md'
    with log.open('x',encoding='utf-8') as f:f.write(f'# Consolidated results log\n\nRead all six task CHANGES logs; extracted {len(full)} measured comparisons/after-only rows from executed CSV/JSON sources. No models/API rerun or earlier results edited. Added paper_results/build.py and plot.py; generated RESULTS_FOR_PAPER.md plus full-precision CSVs and standard matplotlib PNGs. References vs research comparators are explicitly not deployments. Negatives, conditional CIs, changed targets, unknown provenance and live rate limits remain. Numeric values come from source files; NA is not zero.\n\nReproduce consolidation: forecast_audit/.venv/Scripts/python.exe paper_results/build.py --out paper_results/reproduction --report paper_results/reproduction/RESULTS_FOR_PAPER.md; run bundled Python paper_results/plot.py --out paper_results/reproduction. Plot dependencies come from the read-only bundled workspace runtime; no install.\n')
    logs=sorted(ROOT.glob('CHANGES_*.md'))
    for p in logs:p.read_text(encoding='utf-8');inputs[p.name]=sha(p)
    def fmt(x):return 'NA' if x is None or pd.isna(x) else str(int(x)) if abs(x-round(x))<1e-12 else f'{x:.6f}'
    lines=['# Results for paper revision','',
       'Generated from executed, archived experiments. No paper text or old result was rewritten. This report is an evidence ledger, not a claim of conference acceptance.',
       '', 'The table uses **reference/comparator** meanings of before/after for research models; only the engine/LLM rows represent deployed code fixes. Full precision, relative changes, denominators, qualifications and complete commands are in the CSV. Display uses symmetric six-decimal rounding; NA is unmeasured/undefined, never zero.',
       '', '## Before/reference versus after/evaluated metrics','',
       '| Scope | Metric | Before/reference | After/evaluated | Before | After | Change | Unit | N | File / command |',
       '|---|---|---|---|---:|---:|---:|---|---:|---|']
    for r in rows:lines.append(f"| {r['scope']} | {r['metric']} | {r['reference']} | {r['evaluated']} | {fmt(r['before'])} | {fmt(r['after'])} | {fmt(r['absolute_change'])} | {r['unit']} | {r['n']} | {r['source']} / {r['command_id']} |")
    lines+=['','## Claims supported by the evidence','',
       '- Chronological baseline evaluation exposes a failed forecasting deployment guard: the frozen blend improves legacy test MAE but not all-horizon validation RMSE. Production remains unchanged. It loses to historical mean on the NEW seeded generator and transfers poorly to the real one-driver case.',
       '- Global-training forward-CV calibration improves legacy synthetic macro-F1, while HIGH recall stays unchanged and HIGH-to-LOW errors rise. Transfer performance and zero real HIGH support prevent a general risk-classification claim.',
       '- In the declared cash-flow simulator, revised gating reduces forced sales at lower participation; unpaid shortfall is largely unchanged. The common engine reserve masks router liquidity cutoffs below three months. This is simulation-based outcome evidence, not oracle agreement or validated real-world safety.',
       '- A regularized six-factor model predicts simulated six-month shortfall better than a calibrated original scalar. The simple corrected hand scalar loses; production weights/formula remain unchanged under the frozen guard. Monotonicity alone is insufficient.',
       '- The allocator now meets parsed per-product minima, integer budgets and displayed percentage totals in the measured enumeration. Baselines also satisfy constraints; ranking profitability/suitability superiority is unmeasured.',
       '- A constrained LLM template/fact contract rejects the tested numeric/product/context corruptions. The live run retains rate-limit failures and distinguishes successful facts from unavailable responses. This is not free-form explanation-quality validation.',
       '- A licensed, attributed author-reported real earnings case now supplements separately labeled synthetic results. Canonicalization and the new seeded generator improve auditability, not representativeness.',
       '', '## Claims NOT supported / limitations that must remain','',
       '- Optimal 30/25/20/15/10 weights, score70, liquidity3 or debt.5; real financial safety, prevention of hardship, profitability, product suitability, or superiority over commercial robo-advisors.',
       '- Any blanket forecasting improvement over historical mean; a universal HIGH detector; a claim that synthetic rule reconstruction is independent validation; or equal investment exposure when comparing gates.',
       '- Independent workers inferred from platform files; all synthetic paths counted as new observed people; country/currency pooling; treating zero recorded trip days as verified no income; or real shortfall validation without real expenses/debt.',
       '- Human-rated LLM usefulness, readability, arbitrary prose fidelity, or guaranteed service availability. Output is selected from approved templates; source errors can still propagate. Forecast-direction explanation remains ill-defined.',
       '- IID/conditional conformal guarantees, broad external significance from five platform clusters, simultaneous forecast-path coverage, or higher-horizon superiority from composition-confounded pooled errors.',
       '', '## Reproducibility and unresolved defects','',
       '- Original repository generation seed/script could not be recovered. NEW generator parameters are explicit assumptions, not recovered provenance. Duplicate keys include conflicting incomes; canonicalization changes the population. Archived all-donor metrics remain historical.',
       '- The score candidate fixes directional defects offline but fails predictive guard; the production income-insensitivity/debt-denominator issues remain. Learned log-odds coefficients are not interchangeable with health weights or phases.',
       '- Legacy volatility target uses global training terciles; data-credibility transfer uses per-history terciles and different splits/stride. Do not call those before/after method improvements or compare them to old35.6% original-label agreement.',
       '- Router simulator assumes monthly settlement, hypothetical liquid assets, expenses/debt/shocks and independent returns; no product lock-ins/minima/ranking are simulated. Later engine fixes do not retroactively change those archived gate-and-budget results.',
       '- Live model ID is pinned, not an immutable weight revision. The observed API latency/counts depend on provider/quota/time: replaying archived rows is reproducible; exact new live responses/429 incidence/latency are not guaranteed. No retries hid the19 failures.',
       '- Real source: one author, USD receipts before operating costs; 265/626 calendar days zero-filled, unknown timestamp timezone, actual4270 records rather than article4379. Public self-report is not independent Uber authentication. Retain the AGPL license/attribution with the derivative.',
       '- Legacy DM H15/H30 comparisons have insufficient common origins (NA); H7 has only8. Selected90% interval coverage is below nominal pooled H7 and notably on blinkit. Use the complete CI/DM/coverage exports, not selected p-values.',
       '- Original fit diagnostics retain3 finite nonconverged fits and69 warning fits. Earlier helper failures and the corrected small-cohort simulator error are logged; failed/negative experiments were not deleted.',
       '- Historical preservation tests pin older service bytes. Later authorized engine/LLM edits intentionally invalidate checks against the CURRENT working tree; reproduce those historical checks against archived service snapshots, rather than treating newer code as the old experiment. Old result tables remain preserved.',
       '', '## Tests and changed production files','',
       'This prompts.md sequence executed6 score checks,19 Node tests (8 new plus11 retained), and7 data checks:32 passed,0 failed. Logs are archived in their result folders. Earlier forecast13, volatility20 and router20 checks are historical stage results, not an additive current-version coverage percentage. No blanket line-coverage claim is made.',
       '', 'Production changes in this sequence: server/services/investmentEngineService.js, aiExplanationService.js and groqService.js; new server/tests/engineExplanation.test.cjs. Forecaster, runtime volatility, health weights/formula and router policy remain unchanged. Original paper untouched.',
       '', '## Files, figures and commands','',
       f'Full data table: `{(tables/"before_after_all_metrics.csv").relative_to(ROOT).as_posix()}`. Other CSVs retain CIs, all scenarios, reliability bins, validation grid, unsupported comparisons and source counts. Figures use these archived numeric tables without refitting.',
       '', 'Figures: forecast_legacy.png, volatility_confusions.png, router_tradeoff.png, score_calibration.png, real_forecast.png and engine_llm.png, under the output figures/ folder. Their CSV sources are under tables/.',
       '', 'Exact staged reproduction commands are in the six task change logs; never reuse an existing result output directory. Condensed command IDs below reference those staged prerequisites. Consolidation itself requires no API or model fitting.', '']
    for k,command in COMMANDS.items():lines.append(f'- **{k}**: `{command}`')
    lines+=['','Source IDs (SHA-256 in tables/metric_provenance.csv):','']
    for k,p in sources.items():lines.append(f'- **{k}**: `{p}`')
    lines+=['','Source task logs read: '+', '.join(p.name for p in logs)+'.','',
       'Real-source attribution: [nrrb/uber-analytics-project](https://github.com/nrrb/uber-analytics-project), pinned commit4221faf501de74ecd68aec17ddf1045a29202175; full license/notice in data_audit/results_20261017. Groq model/schema references: [models](https://console.groq.com/docs/models), [structured outputs](https://console.groq.com/docs/structured-outputs).']
    with report.open('x',encoding='utf-8') as f:f.write('\n'.join(lines)+'\n')
    with (out/'source_manifest.json').open('x',encoding='utf-8') as f:json.dump(inputs,f,indent=2)
    with (out/'build_summary.json').open('x',encoding='utf-8') as f:json.dump(dict(rows=len(full),input_tables=len(sources),change_logs=[p.name for p in logs],report=str(report)),f,indent=2)
    print('Built',report,'rows:',len(full))


if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--out',default='paper_results/results_20261017');p.add_argument('--report',default='RESULTS_FOR_PAPER.md');args=p.parse_args()
    main((ROOT/args.out).resolve(),(ROOT/args.report).resolve())
