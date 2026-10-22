# Research evidence and results

[Overview](../README.md) · [Architecture](ARCHITECTURE.md) · [Reproduction guide](DEVELOPMENT.md)

This guide indexes the latest completed research audit, recorded on **2026-10-18**. Documentation was reorganized on 2026-10-19; no experiments were rerun for that documentation change. Numbers below describe the archived evaluation conditions, not an assurance about arbitrary users, future provider behavior, or the current frontend.

## Which results to use

| Artifact | Role |
|---|---|
| [results_for_paper.json](../results_for_paper.json) | Latest consolidated numerical export, provenance, source manifests, comparisons, and qualifications |
| [changes_summary.md](../changes_summary.md) | Human-readable current findings, negative results, and consistency checks |
| [before_after_headlines.csv](../revision_audit/final_20261018/before_after_headlines.csv) | Current-versus-captured-baseline headline comparisons |
| [final_verification.json](../revision_audit/final_verification.json) | Dated test totals, preservation checks, and known consistency failure |
| [baseline_results.json](../baseline_results.json) | Preserved pre-revision baseline and hashes |
| [paper_table_updates.tex](../paper_table_updates.tex), [ablation_table.tex](../ablation_table.tex) | Paper-table snippets; structurally checked, not rendered as standalone documents |
| [CHANGES_paper_metrics.md](../CHANGES_paper_metrics.md) | Final export methodology and change record |

[amend_test.md](../amend_test.md), [PAPER_METRICS_AUDIT.md](../PAPER_METRICS_AUDIT.md), and [RESULTS_FOR_PAPER.md](../RESULTS_FOR_PAPER.md) are earlier reports. Preserve them as historical records; do not assume every narrative number reflects the latest export. In particular, the old wealth-difference text is explicitly flagged as stale below.

## Data and evaluation boundaries

The project data is predominantly synthetic, with unresolved original generation and label provenance. The original files contain duplicates and conflicting overlapping series. Do not describe file count or repeated rows as independent workers.

- The original inventory has 16 CSV files and 1,980 physical rows: 11 normal income files with 1,380 rows and five derived files with 600 rows.
- Main forecasting and forward-target classification protocols use the 11 normal files, keeping derived duplicates out of their input sets. Shared-platform series remain correlated.
- A separate deduplicated transfer audit selects one whole series per platform, retaining 660 rows. Its results must not be mixed with the original benchmark's sample counts.
- Additional seeded synthetic data and a public single-driver dataset are separate transfer checks. They do not repair the provenance of the original data or establish broad population validity.
- The single-driver data has separate licensing and attribution obligations. See the [real-data notice](../data_audit/results_20261017/REAL_DATA_NOTICE.md).

[PROVENANCE.md](../PROVENANCE.md) documents file history, recovered notebook evidence, unresolved generator seeds, and label origins. The [data audit log](../CHANGES_data.md) documents duplicates and transfer evaluation.

## Forecasting

The [frozen forecasting protocol](../forecast_audit/PROTOCOL.md) uses chronological training, validation, interval-calibration, and test partitions. Rolling origins advance by three observations, retaining only complete horizons. Origins can use outcomes already observed by that time. Overlapping forecasts are not independent observations.

Evaluated families include the deployed mathematical method, last-observation naive, weekly seasonal naive, historical mean, moving averages, median/blend rules, ETS, ARIMA/SARIMA, and gradient-boosting squared-error, Huber, and quantile variants. Selection is validation-only. Stochastic models use the documented five seeds. Separate tables report per-platform metrics, uncertainty, Diebold–Mariano comparisons, and conformal interval coverage.

Selected rows from the archived [pooled test table](../revision_audit/final_20261018/forecast/test_pooled.csv), rounded for reading:

| Horizon (days) | Deployed method MAE | Deployed method RMSE | Rolling windows | Forecast/target pairs |
|---:|---:|---:|---:|---:|
| 7 | 535.231 | 761.722 | 108 | 756 |
| 15 | 526.055 | 770.653 | 86 | 1,290 |
| 30 | 437.309 | 616.350 | 31 | 930 |

The deployed forecaster does not beat historical mean on the main benchmark. A fixed mean/median research blend improves several test metrics, but failed the validation adoption guard and was not deployed. At horizon 30 its test RMSE also loses to historical mean. Additional synthetic and real-data checks do not show a general forecasting advantage.

Use [selected comparisons](../revision_audit/final_20261018/forecast/selected_comparison.csv), [bootstrap intervals](../revision_audit/final_20261018/forecast/test_bootstrap_ci.csv), [DM comparisons](../revision_audit/final_20261018/forecast/test_dm_vs_mean.csv), and [prediction-interval coverage](../revision_audit/final_20261018/forecast/test_interval_coverage.csv) for the full interpretation. Do not describe evaluated conformal intervals or experimental models as deployed features.

## Volatility classification

The forward-looking research target is sample CV of the next 14 days, categorized by tercile cutoffs fitted on training targets only. Features use past data. This target is distinct from both historical dataset labels and runtime recent-income labels. Reconstructing a synthetic labeling formula is not independent predictive validation.

The frozen examples comprise 187 training, 187 validation, and 247 test samples. Candidate selection included simple rules, naive Bayes, kNN, logistic regression, and gradient boosting. The validation-selected CV30 rule uses thresholds 0.45/0.75 and was deployed without changing the original labels or forward target. The historical comparator uses 0.35/0.75.

| Test metric | Historical CV30 rule | Deployed CV30 rule |
|---|---:|---:|
| Macro-F1 | 0.324358 | 0.603309 |
| Balanced accuracy | 0.445479 | 0.621610 |
| HIGH recall | 0.720000 | 0.720000 |
| HIGH test support | 50 | 50 |
| HIGH classified LOW | 0 | 2 |

Macro-F1 gain is 0.278952, with paired 95% platform-cluster bootstrap interval [0.013404, 0.338032]. The calculation uses 5,000 draws across seeds 11, 23, 37, 53, and 71. The improvement does **not** improve HIGH recall: 14 HIGH examples are still missed, and two become LOW predictions under the revised rule.

Sources: [deployment comparison](../revision_audit/final_volatility/volatility_deployment.json), [all-model metrics](../revision_audit/final_20261018/volatility/final_tables/pooled_model_comparison.csv), [confusion matrices](../revision_audit/final_20261018/volatility/final_tables/all_models_confusion.csv), [validation threshold grid](../revision_audit/final_20261018/volatility/validation_threshold_grid.csv), and [protocol](../volatility_audit/PROTOCOL.md).

## Router enforcement and outcome simulation

The conservative policy's complete-input engineering oracle checks 1,914 cases: **54 true allows, 1,860 true blocks, zero false allows, and zero false blocks**. This proves consistency on those fixtures, not actual financial safety. The [architecture guide](ARCHITECTURE.md#conservative-readiness-router) defines the policy and validation limits.

Outcome evaluation uses a documented Monte Carlo cash-flow model: dataset-based block-bootstrap income, parametric regimes, expenses, debt service, shocks, assumed returns, and monthly accounting. There are 10,000 users per household seed across five seeds, or **50,000 unique simulated households**, followed for 12 months. Central, stress, and neutral scenarios and two investment-budget modes are reported separately.

In the central scenario with the engine budget, original versus revised gates produce forced-liquidation rates of **3.394% versus 1.132%**. Revised-gate mean final wealth is **52,052.456382**, versus **52,075.121159** for the original gate. Lower forced liquidation is not improved wealth or elimination of shortfall.

The ablations are essential: a savings-ranked policy matched for monthly clearance has a **0.698%** forced-liquidation rate in that same setting, beating the full revised gate; matched random clearance has **2.126%**. Removing the health-score component changes no measured full-gate outcome across the reported scenario/budget combinations. Matching monthly clearance does not match which households actually invest. Random-assignment repeats are dependent trials, not additional unique households.

See [simulation change log](../CHANGES_router.md), [final per-seed results](../revision_audit/final_20261018/router/test_per_seed.csv), [validation trade-off grid](../revision_audit/final_20261018/router/validation_pareto_grid.csv), and [ablation results](../ablation_results.json). All outcome claims must say **simulation-based** and retain the assumed-generative-process qualification. Thresholds are not empirically optimal real-world cutoffs.

## Financial health

The current weighted score remains deployed. Sensitivity tests expose limited income responsiveness and an expense-related monotonicity defect. A corrected scalar failed its validation/test adoption guard. Diagnostic learned risk predictors are not substitutes for an interpretable health phase or the score-70 gate.

The volatility revision also worsened the original calibrated score's test AUC and Brier score; this downstream negative result remains in the [current summary](../changes_summary.md). See [score_decision.md](../score_decision.md), [test metrics](../revision_audit/final_20261018/score/test_metrics.csv), and [weight sensitivity](../revision_audit/final_20261018/score/validation_weight_sensitivity.csv). Do not claim optimal weights or an independently demonstrated benefit from the score gate.

## Investment engine and explanations

The [engine audit](../revision_audit/final_20261018/engine/engine_summary.csv) exercises 1,728 representative profiles; 216 are eligible. The revised allocator produces 792 allocations with zero observed minimum-investment, displayed-percentage, hard-filter, or budget violations. These are finite synthetic constraint checks, not suitability or profitability tests. The allocator fixes predate the captured revision baseline; they are not new improvements from the latest threshold change.

The latest [live constrained-explanation audit](../revision_audit/final_20261018/engine/live_summary.csv) records 125 requests: 108 successful provider responses, 17 HTTP-429 failures handled by fallback, and zero timeouts. All 108 successful responses pass strict schema and numerical-fact checks. Mean request latency is 389.617 ms and p95 is 602.054 ms, including failed requests but excluding request-spacing delays. These figures are network/provider measurements, not local computation times.

The model is constrained to selecting approved templates and echoing snapshot facts; the server renders the text. This supports numerical fidelity within that design. It does not measure reader comprehension, usefulness, persuasion, general explanation quality, or the separate free-form chat service.

## Tests and remaining consistency failure

The archived final verification records **142 tests: 138 passed, four failed, zero errors, zero skipped**. The failures remain visible:

1. All-zero income is classified as LOW volatility.
2. The health score is insensitive to some income improvements.
3. A legacy router truth table expects the old permissive rule and uses incomplete fixtures; it is not evidence of false blocks against the current conservative oracle.
4. A deterministic explanation trend-direction case reports steady for rising/falling data.

The preserved `RESULTS_FOR_PAPER.md` quotes an older simulation wealth difference of −21.218565. The current revised-minus-original difference is **−22.664778**. The final consistency check therefore intentionally reports FAIL for that historical narrative. Use the current export/snippets when revising the manuscript; the original paper and historical report were not edited.

## Defensible research position

The evidence supports an auditable pipeline with explicit conservative rules, evaluated failure handling, a measured target-specific volatility improvement, constrained allocation, and honest simulation trade-offs. It does not establish general forecast superiority, optimal financial-health weights, a unique advantage over liquidity ranking, real-world safety, investment performance, or validated user outcomes.

Use the [development guide](DEVELOPMENT.md#research-protocols-and-replay) for exact command records and replay cautions. Keep original and revised conditions, datasets, sample units, and failed comparisons explicit when citing results.
