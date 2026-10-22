# Prompt5: full replay and paper-number export

Executed all existing forecasting, volatility, router, score, data, engine/LLM,
legacy experiments and tests after prompts3/4, into revision_audit/final_20261018.
Every forecasting candidate was refit using fresh caches. No test tuning,
dataset/label changes, additional dependencies or further production changes.
Historical research comparators and deployment are explicitly distinct.

Commands executed (repository root; use a NEW output prefix to reproduce):

```
forecast_audit/.venv/Scripts/python.exe revision_audit/run_final.py
forecast_audit/.venv/Scripts/python.exe revision_audit/run_legacy_final.py
forecast_audit/.venv/Scripts/python.exe revision_audit/evaluate.py volatility --out revision_audit/final_volatility
forecast_audit/.venv/Scripts/python.exe revision_audit/paper_export.py
forecast_audit/.venv/Scripts/python.exe revision_audit/verify_final.py
```

The staged runners contain all exact model/test command vectors. Exit codes and
logs: final_20261018/commands.json and legacy/commands.json. A loopback FastAPI
process was started with ml_service/.venv/Scripts/python.exe -m uvicorn app:app
--host 127.0.0.1 --port 18081 (cwd ml_service), used by the existing
research_eval/evaluate_performance.cjs runner with output redirected in memory
to final_20261018/legacy, then stopped. Existing metadata/manifest collectors ran
with the same write-only output-path redirection. No original output was replaced.
Fresh Python integration fixtures were generated before Node tests; the test
environment points to them through ROUTER_INTEGRATION_FIXTURES.

The full ablation rerun uses ablate.py --no-publish and matches root
ablation_results.json exactly, all78 aggregate rows. Additional original
policies are checked against the same accounting implementation. Default health
scoring, production router predicates, investment engine and LLM logic remain
unchanged. Current source edits versus baseline are limited to the explicitly
documented runtime/snapshot/test/data-comparator/README changes; baseline's earlier
six dirty production files predate this task. Context prompts.md was already
changed concurrently during baseline capture and was not edited by this task.

## Results and failures

- Forecast primary comparison, confidence intervals, coverage and DM outputs
  reproduce the baseline numerical results. Validation still rejects replacement.
- Forward-CV deployed macro-F1 .6033091202582729 versus .32435757244395846;
  gain .2789515478143144, paired95%CI[.01340388007054677,.3380322580645161].
  HIGH recall remains .72;14/50 HIGH cases are missed and2 become LOW. Target
  labels and train-only terciles remain unchanged. All5000 bootstrap draws are
  valid; reporting of this denominator was added and recomputed without changing
  any bound or choosing parameters on test.
- The original calibrated health predictor worsens after changed volatility
  features: AUC .832601984961839 -> .828172078762587; Brier
  .09764599486659681 -> .09947136314390209. The eligible corrected hand scalar
  still loses on validation/test, so health is retained. Full/no-score outcomes
  are identical in these simulations; there is no measured incremental score
  contribution. Diagnostic learned risk models are not deployed health weights.
- Current central original-gate forced sales3.394% versus revised1.132%; revised
  mean wealth minus original is -22.66477773398219 INR. Baseline's older
  whole-system difference is -21.218564925089595. The full gate's own central
  outcomes are unchanged; original-gate analytics/health inputs changed.
- Matched-savings forced sales .698% beats full1.132%; matched-random2.126%
  is worse. Matching is monthly clearance, not exact investor participation.
  Every scenario and unfavorable comparison is retained.
- Fresh live LLM:108/125 success and17 HTTP429 fallbacks,0 timeouts;108/108
  successful responses pass strict schema and numerical faithfulness. Baseline
  replay was109/125; this is network/provider variation, not an algorithm gain.
  Mean latency389.617240000001ms, p95602.0544799999974ms, excluding pacing.
- Unique suites:142 tests,138 passed,4 failed,0 errors/skips. Twelve new
  revision tests pass. Retained failures: zero-income volatility, income-insensitive
  health score, old-router truth table with incomplete fixtures, and falling/rising
  forecast-direction fallback. The obsolete router fixture failure is not current
  policy false-block evidence; the other limitations remain explicit.

## Deliverables and consistency

results_for_paper.json contains current table aliases IV–X, original-paper
historical records, forecasting/per-platform/CI/interval/DM results, deployed
volatility, simulator rows/CIs, all ablations, health models, fixtures, allocator,
LLM, transfer data, performance, test counts and source/command provenance.
Its before_after_headlines.csv has exact current-versus-baseline comparisons.
paper_table_updates.tex and ablation_table.tex are copyable table snippets;
changes_summary.md explains numerical and scientific consequences.

Required checks: wealth-text FAIL (preserved older narrative is stale and no
updated manuscript was supplied); volatility gain/CI PASS;665 count-derived
percentages plus18 interval fractions PASS; test-suite counts PASS. Generated
wealth text is consistent with the new table. Supplied original PDF has no
simulation wealth in TableVI and ends at TableVII; proposed revision numbering
is explicitly documented. The original paper was not edited.

The first export is preserved in revision_audit/first_export. Final export adds
the valid bootstrap-draw denominator and explicitly states the downstream health
negative; it changes no experimental metric. Structural LaTeX checks pass;
snippets were not rendered as a standalone document. No PDF is claimed.

Final independent verification: baseline JSON unchanged, all16 original CSVs
unchanged,315 archived files unchanged, original PDF hash unchanged, all665
event percentages rechecked, full ablation replay exact. Full results and source
hashes are in revision_audit/final_verification.json and completion manifests.
