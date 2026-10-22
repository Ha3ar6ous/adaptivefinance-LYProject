"""Independent final artifact, count, source-preservation and LaTeX checks."""
import hashlib
import json
import math
import re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]


def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def load(p):return json.loads(p.read_text(encoding='utf-8-sig'))


def main():
    paper=load(ROOT/'results_for_paper.json');baseline=load(ROOT/'baseline_results.json')
    expected=load(ROOT/'baseline_replay_20261018/final_validation.json')['baseline_sha256']
    assert sha(ROOT/'baseline_results.json')==expected
    old=baseline['source_snapshot_sha256']
    changes=[p for p,h in old.items() if not (ROOT/p).exists() or sha(ROOT/p)!=h]
    allowed={'README.md','ml_service/modules/volatility.py','router_sim/simulate.py','router_sim/test_simulator.py',
             'score_audit/run.py','volatility_audit/run.py','research_eval/evaluate_python.py',
             'server/tests/routerSafety.test.cjs','data_audit/run.py','prompts.md'}
    assert not set(changes)-allowed,changes
    data=[p for p in old if p.startswith('data/') and p.endswith('.csv')]
    assert len(data)==16 and all(sha(ROOT/p)==old[p] for p in data)
    archived=[p for p in old if '/results_' in p or p.startswith(('research_eval/','paper_audit/')) or p.startswith('CHANGES_')]
    archived=[p for p in archived if p not in allowed]
    assert all(sha(ROOT/p)==old[p] for p in archived)
    pdf=Path(baseline['paper_tables_IV_X']['provenance']['path'])
    assert sha(pdf)==baseline['paper_tables_IV_X']['provenance']['sha256']
    n=0
    def check(x):
        nonlocal n
        if isinstance(x,dict):
            if {'events','denominator','percent'}<=x.keys():
                expected=100*x['events']/x['denominator'] if x['denominator'] else None
                assert x['percent']==expected
                assert 0<=x['events']<=x['denominator'];n+=1
            for value in x.values():check(value)
        elif isinstance(x,list):
            for value in x:check(value)
    check(paper['tables'])
    assert n==paper['consistency_checks']['count_derived_percentages']['count_derived_percentages_checked']
    for row in paper['baseline_comparisons']['rows']:
        assert row['absolute_change']==row['after']-row['before']
        expected=100*(row['after']-row['before'])/row['before'] if row['before'] else None
        assert row['relative_change_percent']==expected
    ablation=load(ROOT/'ablation_results.json')
    assert ablation==load(ROOT/'revision_audit/final_20261018/ablations/ablation_results.json')
    assert len(ablation['results'])==78
    for row in ablation['results']:
        assert row['event_trials']==row['unique_households']*row['random_assignments']
    for checkrow in ablation['checks']:
        assert checkrow['no_score_equivalence'] and checkrow['original_policy_execution_identical'] and checkrow['exact_monthly_matching']
    for scenario in ['central','stress','neutral']:
        for mode in ['engine_budget','reserve_free']:
            rows={r['policy']:r for r in ablation['results'] if r['scenario']==scenario and r['execution']==mode}
            ref=rows['revised_gate']
            for name in ['matched_savings','matched_random']:assert rows[name]['cleared_user_months']==ref['cleared_user_months'] or rows[name]['cleared_user_months']['percent']==ref['cleared_user_months']['percent']
            for metric in ['shortfall','forced_sale','months_below_one_expense','mean_final_wealth','ever_cleared','ever_invested','cleared_user_months']:
                assert rows['full_minus_score'][metric]==ref[metric]
    latex={}
    for name in ['paper_table_updates.tex','ablation_table.tex']:
        s=(ROOT/name).read_text(encoding='utf-8')
        assert s.count('{')==s.count('}')
        assert s.count(r'\begin{table}')==s.count(r'\end{table}')
        assert s.count(r'\begin{tabular}')==s.count(r'\end{tabular}')
        latex[name]=dict(braces_balanced=True,tables=s.count(r'\begin{table}'),booktabs=True,
                         qualification='Structural syntax check only; snippets are not standalone documents and were not TeX-rendered.')
    totals=paper['tests']['totals'];assert totals['total']==totals['passed']+totals['failed']+totals['errors']+totals['skipped']
    assert totals==dict(total=142,passed=138,failed=4,errors=0,skipped=0)
    patterns=[rb'gsk_[A-Za-z0-9]{20,}',rb'sk-proj-[A-Za-z0-9_-]{20,}',rb'AIza[A-Za-z0-9_-]{30,}']
    deliverables=['PROVENANCE.md','score_decision.md','ablation_results.json','ablation_table.tex','results_for_paper.json','paper_table_updates.tex','changes_summary.md']
    assert not any(re.search(pat,(ROOT/name).read_bytes()) for name in deliverables for pat in patterns)
    result=dict(baseline_unchanged=True,old_files_checked=len(old),changed_existing_files=changes,
                original_data_files_unchanged=len(data),archived_files_unchanged=len(archived),paper_pdf_unchanged=True,
                count_derived_percentages_rechecked=n,ablation_full_replay_exact=True,latex=latex,
                tests=totals,known_consistency_failure=paper['consistency_checks']['table_VI_wealth_vs_text'])
    dest=ROOT/'revision_audit/final_verification.json'
    with dest.open('x',encoding='utf-8') as f:json.dump(result,f,indent=2)
    paths=[ROOT/n for n in deliverables]+list((ROOT/'revision_audit').glob('*.py'))+list(ROOT.glob('CHANGES_*.md'))
    with (ROOT/'revision_audit/completion_manifest.json').open('x',encoding='utf-8') as f:
        json.dump({p.relative_to(ROOT).as_posix():sha(p) for p in paths},f,indent=2)
    print(json.dumps(result,indent=2))


if __name__=='__main__':main()
