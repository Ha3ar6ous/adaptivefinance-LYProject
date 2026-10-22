# Results for paper revision

Generated from executed, archived experiments. No paper text or old result was rewritten. This report is an evidence ledger, not a claim of conference acceptance.

The table uses **reference/comparator** meanings of before/after for research models; only the engine/LLM rows represent deployed code fixes. Full precision, relative changes, denominators, qualifications and complete commands are in the CSV. Display uses symmetric six-decimal rounding; NA is unmeasured/undefined, never zero.

## Before/reference versus after/evaluated metrics

| Scope | Metric | Before/reference | After/evaluated | Before | After | Change | Unit | N | File / command |
|---|---|---|---|---:|---:|---:|---|---:|---|
| Legacy synthetic H7 | mae | historical_mean | frozen blend | 507.079577 | 491.689656 | -15.389921 | INR | 756 | T1 / F |
| Legacy synthetic H7 | rmse | historical_mean | frozen blend | 740.183307 | 733.350074 | -6.833232 | INR | 756 | T1 / F |
| Legacy synthetic H7 | mae | original | frozen blend | 535.230913 | 491.689656 | -43.541257 | INR | 756 | T1 / F |
| Legacy synthetic H7 | rmse | original | frozen blend | 761.721537 | 733.350074 | -28.371463 | INR | 756 | T1 / F |
| Legacy synthetic H15 | mae | historical_mean | frozen blend | 498.618682 | 483.431016 | -15.187667 | INR | 1290 | T1 / F |
| Legacy synthetic H15 | rmse | historical_mean | frozen blend | 748.936323 | 742.676699 | -6.259624 | INR | 1290 | T1 / F |
| Legacy synthetic H15 | mae | original | frozen blend | 526.054961 | 483.431016 | -42.623946 | INR | 1290 | T1 / F |
| Legacy synthetic H15 | rmse | original | frozen blend | 770.652686 | 742.676699 | -27.975987 | INR | 1290 | T1 / F |
| Legacy synthetic H30 | mae | historical_mean | frozen blend | 404.916075 | 400.860312 | -4.055763 | INR | 930 | T1 / F |
| Legacy synthetic H30 | rmse | historical_mean | frozen blend | 575.710608 | 576.431447 | 0.720839 | INR | 930 | T1 / F |
| Legacy synthetic H30 | mae | original | frozen blend | 437.308559 | 400.860312 | -36.448247 | INR | 930 | T1 / F |
| Legacy synthetic H30 | rmse | original | frozen blend | 616.350071 | 576.431447 | -39.918624 | INR | 930 | T1 / F |
| Legacy synthetic H7 | 90% interval coverage | historical mean | frozen blend | 90.740741 | 89.417989 | -1.322751 | percent | 756 | T2 / F |
| Legacy synthetic H15 | 90% interval coverage | historical mean | frozen blend | 92.480620 | 91.705426 | -0.775194 | percent | 1290 | T2 / F |
| Legacy synthetic H30 | 90% interval coverage | historical mean | frozen blend | 93.225806 | 93.225806 | 0 | percent | 930 | T2 / F |
| Forward CV, global train cutoffs | macro_f1 | runtime CV30 .35/.75 | selected .45/.75 | 0.324358 | 0.603309 | 0.278952 | fraction | 247 | T3 / V |
| Forward CV, global train cutoffs | high_recall | runtime CV30 .35/.75 | selected .45/.75 | 0.720000 | 0.720000 | 0 | fraction | 247 | T3 / V |
| Forward CV, global train cutoffs | balanced_accuracy | runtime CV30 .35/.75 | selected .45/.75 | 0.445479 | 0.621610 | 0.176131 | fraction | 247 | T3 / V |
| Forward CV, global train cutoffs | high_to_low | runtime CV30 .35/.75 | selected .45/.75 | 0 | 2 | 2 | count | 247 | T3 / V |
| Router simulation central | shortfall_rate | original gate | revised gate | 31.124000 | 31.124000 | 0 | percent | 50000 | T4 / R |
| Router simulation central | forced_liquidation_rate | original gate | revised gate | 3.156000 | 1.132000 | -2.024000 | percent | 50000 | T4 / R |
| Router simulation central | months_below_1 | original gate | revised gate | 3.020300 | 3.014200 | -0.006100 | months | 50000 | T4 / R |
| Router simulation central | final_net_wealth | original gate | revised gate | 52073.674947 | 52052.456382 | -21.218565 | INR | 50000 | T4 / R |
| Router simulation central | ever_cleared | original gate | revised gate | 74.544000 | 51.768000 | -22.776000 | percent | 50000 | T4 / R |
| Router simulation central | ever_contributed | original gate | revised gate | 53.240000 | 43.012000 | -10.228000 | percent | 50000 | T4 / R |
| Router simulation stress | shortfall_rate | original gate | revised gate | 39.968000 | 39.960000 | -0.008000 | percent | 50000 | T4 / R |
| Router simulation stress | forced_liquidation_rate | original gate | revised gate | 5.672000 | 2.336000 | -3.336000 | percent | 50000 | T4 / R |
| Router simulation stress | months_below_1 | original gate | revised gate | 3.656900 | 3.646480 | -0.010420 | months | 50000 | T4 / R |
| Router simulation stress | final_net_wealth | original gate | revised gate | 19430.222850 | 19472.395686 | 42.172836 | INR | 50000 | T4 / R |
| Router simulation stress | ever_cleared | original gate | revised gate | 71.998000 | 47.808000 | -24.190000 | percent | 50000 | T4 / R |
| Router simulation stress | ever_contributed | original gate | revised gate | 50.854000 | 39.854000 | -11 | percent | 50000 | T4 / R |
| Score simulated 6-month outcome | auc | calibrated original | corrected_calibrated | 0.832602 | 0.779483 | -0.053119 | fraction | 50000 | T5 / S |
| Score simulated 6-month outcome | brier | calibrated original | corrected_calibrated | 0.097646 | 0.109427 | 0.011781 | fraction | 50000 | T5 / S |
| Score simulated 6-month outcome | ece10 | calibrated original | corrected_calibrated | 0.007967 | 0.022596 | 0.014628 | fraction | 50000 | T5 / S |
| Score simulated 6-month outcome | auc | calibrated original | fit_corrected_factors | 0.832602 | 0.888228 | 0.055626 | fraction | 50000 | T5 / S |
| Score simulated 6-month outcome | brier | calibrated original | fit_corrected_factors | 0.097646 | 0.081197 | -0.016449 | fraction | 50000 | T5 / S |
| Score simulated 6-month outcome | ece10 | calibrated original | fit_corrected_factors | 0.007967 | 0.007313 | -0.000654 | fraction | 50000 | T5 / S |
| Score expense +10% intervention | spurious score increases | original score | research corrected score | 20312 | 0 | -20312 | count | 50000 | T7 / S |
| Engine valid-contract enumeration | minimum_violations | original allocator | revised allocator | 312 | 0 | -312 | count | 1728 | T8 / E |
| Engine valid-contract enumeration | percentage_violations | original allocator | revised allocator | 120 | 0 | -120 | count | 1728 | T8 / E |
| Engine valid-contract enumeration | eligible | original allocator | revised allocator | 216 | 216 | 0 | count | 1728 | T8 / E |
| Engine valid-contract enumeration | allocations | original allocator | revised allocator | 1080 | 792 | -288 | count | 1728 | T8 / E |
| LLM controlled corruption | corrupt responses accepted | schema-only validator | snapshot-bound templates | 375 | 0 | -375 | count | 375 | T9 / C |
| LLM live pinned model | api_success | not measured on matched old live set | gpt-oss-20b template selection | NA | 106 | NA | count | 125 | T10 / L |
| LLM live pinned model | strict_schema_pass | not measured on matched old live set | gpt-oss-20b template selection | NA | 106 | NA | count | 125 | T10 / L |
| LLM live pinned model | raw_facts_faithful | not measured on matched old live set | gpt-oss-20b template selection | NA | 106 | NA | count | 125 | T10 / L |
| LLM live pinned model | fallback | not measured on matched old live set | gpt-oss-20b template selection | NA | 19 | NA | count | 125 | T10 / L |
| LLM live pinned model | timeout | not measured on matched old live set | gpt-oss-20b template selection | NA | 0 | NA | count | 125 | T10 / L |
| LLM live pinned model | latency_mean_ms | not measured on matched old live set | gpt-oss-20b template selection | NA | 392.204282 | NA | ms | 125 | T10 / L |
| LLM live pinned model | latency_p95_ms | not measured on matched old live set | gpt-oss-20b template selection | NA | 570.313040 | NA | ms | 125 | T10 / L |
| Data canonicalization | rows | all donors | one whole donor/platform | 1380 | 660 | -720 | count | 1380 | T11 / D |
| Real one-driver H7 | mae | historical mean | original | 74.964364 | 70.708889 | -4.255475 | USD | 126 | T12 / D |
| Real one-driver H7 | rmse | historical mean | original | 90.151198 | 87.948331 | -2.202867 | USD | 126 | T12 / D |
| Real one-driver H7 | mae | historical mean | frozen_mean_median075 | 74.964364 | 80.382615 | 5.418251 | USD | 126 | T12 / D |
| Real one-driver H7 | rmse | historical mean | frozen_mean_median075 | 90.151198 | 100.546099 | 10.394901 | USD | 126 | T12 / D |
| Real one-driver H15 | mae | historical mean | original | 75.992485 | 71.991042 | -4.001443 | USD | 240 | T12 / D |
| Real one-driver H15 | rmse | historical mean | original | 90.828931 | 89.746702 | -1.082229 | USD | 240 | T12 / D |
| Real one-driver H15 | mae | historical mean | frozen_mean_median075 | 75.992485 | 81.014678 | 5.022193 | USD | 240 | T12 / D |
| Real one-driver H15 | rmse | historical mean | frozen_mean_median075 | 90.828931 | 101.374824 | 10.545893 | USD | 240 | T12 / D |
| Real one-driver H30 | mae | historical mean | original | 76.527075 | 76.390238 | -0.136837 | USD | 420 | T12 / D |
| Real one-driver H30 | rmse | historical mean | original | 91.689611 | 96.241827 | 4.552216 | USD | 420 | T12 / D |
| Real one-driver H30 | mae | historical mean | frozen_mean_median075 | 76.527075 | 81.314686 | 4.787611 | USD | 420 | T12 / D |
| Real one-driver H30 | rmse | historical mean | frozen_mean_median075 | 91.689611 | 102.184041 | 10.494430 | USD | 420 | T12 / D |
| New synthetic transfer H7 | mae | historical mean | frozen blend | 489.052403 | 490.025832 | 0.973429 | INR | 875 | T13 / D |
| New synthetic transfer H7 | rmse | historical mean | frozen blend | 669.529373 | 673.907801 | 4.378428 | INR | 875 | T13 / D |
| New synthetic transfer H15 | mae | historical mean | frozen blend | 480.959172 | 482.948930 | 1.989758 | INR | 1500 | T13 / D |
| New synthetic transfer H15 | rmse | historical mean | frozen blend | 641.940510 | 647.350459 | 5.409949 | INR | 1500 | T13 / D |
| New synthetic transfer H30 | mae | historical mean | frozen blend | 488.213735 | 491.213353 | 2.999618 | INR | 750 | T13 / D |
| New synthetic transfer H30 | rmse | historical mean | frozen blend | 673.408058 | 679.525242 | 6.117184 | INR | 750 | T13 / D |
| Real CV relative-target transfer | macro_f1 | runtime .35/.75 | frozen .45/.75 | 0.047619 | 0.047619 | 0 | fraction | 17 | T14 / D |
| Real CV relative-target transfer | high_recall | runtime .35/.75 | frozen .45/.75 | NA | NA | NA | fraction | 17 | T14 / D |

## Claims supported by the evidence

- Chronological baseline evaluation exposes a failed forecasting deployment guard: the frozen blend improves legacy test MAE but not all-horizon validation RMSE. Production remains unchanged. It loses to historical mean on the NEW seeded generator and transfers poorly to the real one-driver case.
- Global-training forward-CV calibration improves legacy synthetic macro-F1, while HIGH recall stays unchanged and HIGH-to-LOW errors rise. Transfer performance and zero real HIGH support prevent a general risk-classification claim.
- In the declared cash-flow simulator, revised gating reduces forced sales at lower participation; unpaid shortfall is largely unchanged. The common engine reserve masks router liquidity cutoffs below three months. This is simulation-based outcome evidence, not oracle agreement or validated real-world safety.
- A regularized six-factor model predicts simulated six-month shortfall better than a calibrated original scalar. The simple corrected hand scalar loses; production weights/formula remain unchanged under the frozen guard. Monotonicity alone is insufficient.
- The allocator now meets parsed per-product minima, integer budgets and displayed percentage totals in the measured enumeration. Baselines also satisfy constraints; ranking profitability/suitability superiority is unmeasured.
- A constrained LLM template/fact contract rejects the tested numeric/product/context corruptions. The live run retains rate-limit failures and distinguishes successful facts from unavailable responses. This is not free-form explanation-quality validation.
- A licensed, attributed author-reported real earnings case now supplements separately labeled synthetic results. Canonicalization and the new seeded generator improve auditability, not representativeness.

## Claims NOT supported / limitations that must remain

- Optimal 30/25/20/15/10 weights, score70, liquidity3 or debt.5; real financial safety, prevention of hardship, profitability, product suitability, or superiority over commercial robo-advisors.
- Any blanket forecasting improvement over historical mean; a universal HIGH detector; a claim that synthetic rule reconstruction is independent validation; or equal investment exposure when comparing gates.
- Independent workers inferred from platform files; all synthetic paths counted as new observed people; country/currency pooling; treating zero recorded trip days as verified no income; or real shortfall validation without real expenses/debt.
- Human-rated LLM usefulness, readability, arbitrary prose fidelity, or guaranteed service availability. Output is selected from approved templates; source errors can still propagate. Forecast-direction explanation remains ill-defined.
- IID/conditional conformal guarantees, broad external significance from five platform clusters, simultaneous forecast-path coverage, or higher-horizon superiority from composition-confounded pooled errors.

## Reproducibility and unresolved defects

- Original repository generation seed/script could not be recovered. NEW generator parameters are explicit assumptions, not recovered provenance. Duplicate keys include conflicting incomes; canonicalization changes the population. Archived all-donor metrics remain historical.
- The score candidate fixes directional defects offline but fails predictive guard; the production income-insensitivity/debt-denominator issues remain. Learned log-odds coefficients are not interchangeable with health weights or phases.
- Legacy volatility target uses global training terciles; data-credibility transfer uses per-history terciles and different splits/stride. Do not call those before/after method improvements or compare them to old35.6% original-label agreement.
- Router simulator assumes monthly settlement, hypothetical liquid assets, expenses/debt/shocks and independent returns; no product lock-ins/minima/ranking are simulated. Later engine fixes do not retroactively change those archived gate-and-budget results.
- Live model ID is pinned, not an immutable weight revision. The observed API latency/counts depend on provider/quota/time: replaying archived rows is reproducible; exact new live responses/429 incidence/latency are not guaranteed. No retries hid the19 failures.
- Real source: one author, USD receipts before operating costs; 265/626 calendar days zero-filled, unknown timestamp timezone, actual4270 records rather than article4379. Public self-report is not independent Uber authentication. Retain the AGPL license/attribution with the derivative.
- Legacy DM H15/H30 comparisons have insufficient common origins (NA); H7 has only8. Selected90% interval coverage is below nominal pooled H7 and notably on blinkit. Use the complete CI/DM/coverage exports, not selected p-values.
- Original fit diagnostics retain3 finite nonconverged fits and69 warning fits. Earlier helper failures and the corrected small-cohort simulator error are logged; failed/negative experiments were not deleted.
- Historical preservation tests pin older service bytes. Later authorized engine/LLM edits intentionally invalidate checks against the CURRENT working tree; reproduce those historical checks against archived service snapshots, rather than treating newer code as the old experiment. Old result tables remain preserved.

## Tests and changed production files

This prompts.md sequence executed6 score checks,19 Node tests (8 new plus11 retained), and7 data checks:32 passed,0 failed. Logs are archived in their result folders. Earlier forecast13, volatility20 and router20 checks are historical stage results, not an additive current-version coverage percentage. No blanket line-coverage claim is made.

Production changes in this sequence: server/services/investmentEngineService.js, aiExplanationService.js and groqService.js; new server/tests/engineExplanation.test.cjs. Forecaster, runtime volatility, health weights/formula and router policy remain unchanged. Original paper untouched.

## Files, figures and commands

Full data table: `paper_results/results_20261017/tables/before_after_all_metrics.csv`. Other CSVs retain CIs, all scenarios, reliability bins, validation grid, unsupported comparisons and source counts. Figures use these archived numeric tables without refitting.

Figures: forecast_legacy.png, volatility_confusions.png, router_tradeoff.png, score_calibration.png, real_forecast.png and engine_llm.png, under the output figures/ folder. Their CSV sources are under tables/.

Exact staged reproduction commands are in the six task change logs; never reuse an existing result output directory. Condensed command IDs below reference those staged prerequisites. Consolidation itself requires no API or model fitting.

- **F**: `forecast_audit/.venv/Scripts/python.exe forecast_audit/analyze.py --out <fresh-forecast-run> (run.py select/calibrate/test first)`
- **V**: `forecast_audit/.venv/Scripts/python.exe volatility_audit/run.py --out <fresh-volatility-run> --stage test (prepare/select and compare.py freeze first)`
- **R**: `forecast_audit/.venv/Scripts/python.exe router_sim/simulate.py --out <fresh-router-run> --stage test (prepare/validation first)`
- **S**: `forecast_audit/.venv/Scripts/python.exe score_audit/run.py --out <fresh-score-run> --stage test (prepare/select first)`
- **E**: `node engine_llm_audit/evaluate.cjs before --archive-before; node engine_llm_audit/evaluate.cjs after (ENGINE_AUDIT_OUT must be a fresh directory)`
- **L**: `node engine_llm_audit/live.cjs (fresh ENGINE_AUDIT_OUT, synthetic snapshots, API quota); engine_llm_audit/summarize.py`
- **C**: `node engine_llm_audit/evaluate.cjs before --archive-before; node engine_llm_audit/evaluate.cjs after; node engine_llm_audit/orchestration.cjs`
- **D**: `forecast_audit/.venv/Scripts/python.exe data_audit/run.py --out <fresh-data-run> --stage clone; same --stage evaluate`

Source IDs (SHA-256 in tables/metric_provenance.csv):

- **T1**: `forecast_audit/results_20261017/selected_comparison.csv`
- **T2**: `forecast_audit/results_20261017/test_interval_coverage.csv`
- **T3**: `volatility_audit/results_20261017/test_metrics.csv`
- **T4**: `router_sim/results_20261017/test_mean.csv`
- **T5**: `score_audit/results_20261017/test_metrics.csv`
- **T6**: `score_audit/results_20261017/original_expense_monotonicity.json`
- **T7**: `score_audit/results_20261017/corrected_expense_monotonicity.json`
- **T8**: `engine_llm_audit/results_20261017/engine_summary.csv`
- **T9**: `engine_llm_audit/results_20261017/controlled_summary.csv`
- **T10**: `engine_llm_audit/results_20261017/live_summary.csv`
- **T11**: `data_audit/results_20261017/dedupe_summary.json`
- **T12**: `data_audit/results_20261017/forecast_metrics.csv`
- **T13**: `data_audit/results_20261017/new_synthetic_pooled_forecast.csv`
- **T14**: `data_audit/results_20261017/volatility_metrics.csv`
- **T15**: `forecast_audit/results_20261017/test_bootstrap_ci.csv`
- **T16**: `forecast_audit/results_20261017/test_dm_vs_mean.csv`
- **T17**: `volatility_audit/results_20261017/final_tables/pooled_model_comparison.csv`
- **T18**: `volatility_audit/results_20261017/test_confusion.csv`
- **T19**: `router_sim/results_20261017/test_paired_deltas.csv`
- **T20**: `router_sim/results_20261017/validation_pareto_grid.csv`
- **T21**: `score_audit/results_20261017/calibration_bins.csv`
- **T22**: `score_audit/results_20261017/validation_weight_sensitivity.csv`
- **T23**: `data_audit/results_20261017/real_provenance.json`

Source task logs read: CHANGES_data.md, CHANGES_engine_llm.md, CHANGES_forecast.md, CHANGES_results.md, CHANGES_router.md, CHANGES_score.md, CHANGES_volatility.md.

Real-source attribution: [nrrb/uber-analytics-project](https://github.com/nrrb/uber-analytics-project), pinned commit4221faf501de74ecd68aec17ddf1045a29202175; full license/notice in data_audit/results_20261017. Groq model/schema references: [models](https://console.groq.com/docs/models), [structured outputs](https://console.groq.com/docs/structured-outputs).
