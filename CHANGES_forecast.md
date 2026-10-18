# Forecast changes and experiment log

## 2026-10-17 — scope and baseline preservation

- Request: rolling-origin horizons 7/15/30; real statistical and lag-feature boosting
  baselines; validation-only selection; bootstrap intervals, DM comparisons and
  conformal coverage. No existing result, dataset or label may be overwritten.
- Inspected README.md, repository layout, production forecast module,
  research_eval/evaluate_python.py, paper_audit/experiments.py and its protocol.
  No applicable AGENTS.md was found. Existing unrelated router changes remain.
- Prior results are retrospective: these synthetic CSVs were examined before this
  task. New test partitions are excluded from this run's model selection; they
  are not new external data.
- Added an isolated forecast_audit workspace/environment. Production dependencies
  and code remain unchanged at this stage. Scientific package versions are pinned
  for this experiment; transitive versions will be recorded after installation.
- All experiment outputs use new directories and exclusive writes. Existing
  research_eval/, paper_audit/ and root reports are fingerprinted before work.
- Protocol and exact commands/results will be appended below after execution.

## Implementation before scoring

- Added `forecast_audit/PROTOCOL.md`, `preserve.py`, `run.py`, `analyze.py`,
  `test_forecast.py`, pinned `requirements.txt` and `environment.lock.txt`.
- Why: earlier evaluations lacked real ETS/ARIMA/boosting, separate interval
  calibration, multiple horizons and dependence-aware inference.
- Baseline replay (same historical 48 windows / 720 targets): current method
  MAE/RMSE **575.646542 / 847.263357**; historical mean
  **529.523517 / 791.634420**. Exact agreement with prior saved results verified.
- New design: initial 28 observations; validation targets 28:60; calibration
  targets 60:90; test targets 90:end. Origins every three days, full horizons
  only; calibration target blocks do not overlap. New windows differ from prior
  audits: before/after deltas will use identical new windows exclusively.
- Models: fixed baselines, statsmodels ETS/ARIMA/SARIMA, sklearn squared-error,
  Huber and median-quantile boosting (two depths), five seeds each. One global
  validation-selected configuration; never choose a test winner or best seed.
- Prediction intervals use frozen normalized calibration residuals. CIs retain
  platform/series clusters; DM uses HAC and finite-sample correction, with explicit
  missing results when origins are insufficient. Existing data were already seen
  in earlier audits; this is retrospective evidence, not external validation.
- Initial tests: **10 passed / 0 failed**. Full model/currency and metric sanity
  checks passed before selection. No production edit or result was made to improve
  a score. Initial metrics for the new design are pending, not estimated.

Executed setup/baseline commands (repository root):

```powershell
python -m venv forecast_audit/.venv
& forecast_audit/.venv/Scripts/python.exe -m pip install -r forecast_audit/requirements.txt
python forecast_audit/preserve.py --out forecast_audit/results_20261017
& forecast_audit/.venv/Scripts/python.exe -m unittest discover -s forecast_audit -p test_forecast.py -v
& forecast_audit/.venv/Scripts/python.exe forecast_audit/run.py select --out forecast_audit/results_20261017
```

Implementation references: [statsmodels ETS](https://www.statsmodels.org/stable/generated/statsmodels.tsa.exponential_smoothing.ets.ETSModel.html),
[SARIMAX](https://www.statsmodels.org/stable/generated/statsmodels.tsa.statespace.sarimax.SARIMAX.html),
[sklearn gradient boosting](https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.GradientBoostingRegressor.html).
Installed versions are pinned locally; live documentation may describe newer versions.

## Validation freeze and reporting checks

- Validation selected `mean_median_075`; no configuration was changed afterward.
  Its MAE improves on historical mean, but RMSE worsens at all horizons:
  7-day **828.137018 vs 825.496902**; 15-day **790.785792 vs 788.830970**;
  30-day **855.699782 vs 854.036667**. Production replacement is therefore blocked
  by the predeclared rule, independent of subsequent test performance.
- Validation had **0 fit fallbacks**. Nonconvergence/warnings remain recorded
  individually rather than discarded. Separate calibration and test follow the
  frozen selection. Per-seed prediction rows never count as independent targets.
- Added `report.py` for append-only measured outcomes and `check_results.py` for
  retained tests/preservation verification. Added artifact checks for frozen
  selection/quantiles and complete five-seed/window coverage. A synthetic-data
  smoke check executed bootstrap, DM, interval scoring and aggregation successfully;
  those artificial smoke values are not paper results.
- Added `.gitignore` for isolated runtime and reconstructible prediction caches.
  CSVs, configs, fit diagnostics and raw prediction trails remain available.


## Final measured results — results_20261017


Production forecaster **unchanged**. Validation selected **`mean_median_075`**. All-horizon deployment gate passed: **False**. The predeclared validation requirements were not satisfied; test outcomes do not reverse that decision.


No earlier result artifact or dataset was modified: 69 preserved files verified. Source snapshot, environment versions and exact split/model rules are in the new output directory and `forecast_audit/PROTOCOL.md`. Existing paper/router work is untouched.


### Validation-only choice

| Model | Horizon | Validation MAE | Validation RMSE |
| --- | --- | --- | --- |
| original | 7 | 595.23 | 867.17 |
| original | 15 | 588.58 | 844.41 |
| original | 30 | 650.66 | 945.79 |
| historical_mean | 7 | 554.61 | 825.50 |
| historical_mean | 15 | 530.58 | 788.83 |
| historical_mean | 30 | 557.99 | 854.04 |
| mean_median_075 | 7 | 545.77 | 828.14 |
| mean_median_075 | 15 | 522.93 | 790.79 |
| mean_median_075 | 30 | 543.58 | 855.70 |

One configuration was chosen globally by equal-horizon normalized validation MAE+RMSE; no seed, platform-specific model, test winner or CI/p-value was selected. The five-seed arithmetic ensemble defines each boosting candidate. All candidate and individual-seed metrics remain in the CSVs.


### Identical-test-window comparisons

| Model | Horizon | Windows | Forecast pairs | Unique targets | MAE | RMSE | sMAPE (%) | MASE |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| original | 7 | 108 | 756 | 368 | 535.23 | 761.72 | 59.11 | 0.7959 |
| original | 15 | 86 | 1290 | 390 | 526.05 | 770.65 | 57.49 | 0.7991 |
| original | 30 | 31 | 930 | 390 | 437.31 | 616.35 | 47.07 | 0.8203 |
| historical_mean | 7 | 108 | 756 | 368 | 507.08 | 740.18 | 56.38 | 0.7554 |
| historical_mean | 15 | 86 | 1290 | 390 | 498.62 | 748.94 | 54.76 | 0.7608 |
| historical_mean | 30 | 31 | 930 | 390 | 404.92 | 575.71 | 44.27 | 0.7735 |
| mean_median_075 | 7 | 108 | 756 | 368 | 491.69 | 733.35 | 55.61 | 0.7348 |
| mean_median_075 | 15 | 86 | 1290 | 390 | 483.43 | 742.68 | 53.96 | 0.7414 |
| mean_median_075 | 30 | 31 | 930 | 390 | 400.86 | 576.43 | 44.20 | 0.7710 |

| Reference | Horizon | Metric | Selected absolute change | Selected relative change |
| --- | --- | --- | --- | --- |
| original | 7 | mae | -43.5413 | -8.14% |
| original | 7 | rmse | -28.3715 | -3.72% |
| original | 7 | smape | -3.4987 | -5.92% |
| original | 7 | mase | -0.0611 | -7.68% |
| historical_mean | 7 | mae | -15.3899 | -3.04% |
| historical_mean | 7 | rmse | -6.8332 | -0.92% |
| historical_mean | 7 | smape | -0.7670 | -1.36% |
| historical_mean | 7 | mase | -0.0206 | -2.73% |
| original | 15 | mae | -42.6239 | -8.10% |
| original | 15 | rmse | -27.9760 | -3.63% |
| original | 15 | smape | -3.5375 | -6.15% |
| original | 15 | mase | -0.0577 | -7.23% |
| historical_mean | 15 | mae | -15.1877 | -3.05% |
| historical_mean | 15 | rmse | -6.2596 | -0.84% |
| historical_mean | 15 | smape | -0.8007 | -1.46% |
| historical_mean | 15 | mase | -0.0194 | -2.55% |
| original | 30 | mae | -36.4482 | -8.33% |
| original | 30 | rmse | -39.9186 | -6.48% |
| original | 30 | smape | -2.8689 | -6.10% |
| original | 30 | mase | -0.0493 | -6.01% |
| historical_mean | 30 | mae | -4.0558 | -1.00% |
| historical_mean | 30 | rmse | 0.7208 | 0.13% |
| historical_mean | 30 | smape | -0.0712 | -0.16% |
| historical_mean | 30 | mase | -0.0026 | -0.33% |

Errors are computed on forecast instances (origin,lead), with duplicates across overlapping windows explicitly counted. Whole files/platforms are retained; the longer Zomato gig series contributes more pooled forecasts. Per-file/platform tables and equal-series macro metrics expose that imbalance. These are synthetic, previously examined histories, not an unseen external cohort.

Cross-horizon pooled errors are composition-confounded: the long gig series contributes 28/108 seven-day origins, 26/86 fifteen-day origins and 21/31 thirty-day origins. A lower pooled thirty-day error is not evidence that longer-horizon prediction is easier. Compare models within identical horizons and inspect equal-series/per-platform results.


### Bootstrap uncertainty

| Model | Horizon | Metric | Estimate | 95% lower | 95% upper | Clusters |
| --- | --- | --- | --- | --- | --- | --- |
| original | 7 | mae | 535.2309 | 428.2230 | 694.8543 | 5 |
| original | 7 | rmse | 761.7215 | 601.9492 | 963.5702 | 5 |
| original | 7 | smape | 59.1079 | 52.2644 | 70.7418 | 5 |
| original | 7 | mase | 0.7959 | 0.6777 | 0.9277 | 5 |
| original | 15 | mae | 526.0550 | 419.3418 | 702.8436 | 5 |
| original | 15 | rmse | 770.6527 | 589.1622 | 1011.1644 | 5 |
| original | 15 | smape | 57.4933 | 50.1289 | 71.2402 | 5 |
| original | 15 | mase | 0.7991 | 0.6641 | 0.9668 | 5 |
| original | 30 | mae | 437.3086 | 394.0848 | 662.0720 | 5 |
| original | 30 | rmse | 616.3501 | 526.6310 | 955.5798 | 5 |
| original | 30 | smape | 47.0673 | 43.0685 | 67.9112 | 5 |
| original | 30 | mase | 0.8203 | 0.6939 | 0.8790 | 5 |
| historical_mean | 7 | mae | 507.0796 | 411.5936 | 669.4058 | 5 |
| historical_mean | 7 | rmse | 740.1833 | 567.5471 | 963.7341 | 5 |
| historical_mean | 7 | smape | 56.3762 | 50.1342 | 66.8702 | 5 |
| historical_mean | 7 | mase | 0.7554 | 0.6690 | 0.8784 | 5 |
| historical_mean | 15 | mae | 498.6187 | 395.4052 | 684.8177 | 5 |
| historical_mean | 15 | rmse | 748.9363 | 548.2651 | 1017.9130 | 5 |
| historical_mean | 15 | smape | 54.7565 | 47.3270 | 67.5154 | 5 |
| historical_mean | 15 | mase | 0.7608 | 0.6592 | 0.9289 | 5 |
| historical_mean | 30 | mae | 404.9161 | 357.7752 | 650.0485 | 5 |
| historical_mean | 30 | rmse | 575.7106 | 471.6462 | 937.1906 | 5 |
| historical_mean | 30 | smape | 44.2696 | 40.1170 | 64.4268 | 5 |
| historical_mean | 30 | mase | 0.7735 | 0.6767 | 0.8783 | 5 |
| mean_median_075 | 7 | mae | 491.6897 | 398.0366 | 650.8998 | 5 |
| mean_median_075 | 7 | rmse | 733.3501 | 557.9325 | 957.7341 | 5 |
| mean_median_075 | 7 | smape | 55.6092 | 49.4222 | 66.1271 | 5 |
| mean_median_075 | 7 | mase | 0.7348 | 0.6398 | 0.8512 | 5 |
| mean_median_075 | 15 | mae | 483.4310 | 382.1460 | 672.4964 | 5 |
| mean_median_075 | 15 | rmse | 742.6767 | 531.9894 | 1015.4568 | 5 |
| mean_median_075 | 15 | smape | 53.9559 | 46.5526 | 66.7659 | 5 |
| mean_median_075 | 15 | mase | 0.7414 | 0.6318 | 0.9069 | 5 |
| mean_median_075 | 30 | mae | 400.8603 | 356.1177 | 633.5219 | 5 |
| mean_median_075 | 30 | rmse | 576.4314 | 471.8837 | 937.0732 | 5 |
| mean_median_075 | 30 | smape | 44.1984 | 40.2822 | 63.2611 | 5 |
| mean_median_075 | 30 | mase | 0.7710 | 0.6380 | 0.8549 | 5 |

5000 whole-platform bootstrap draws: five fixed seeds x 1000 draws. All series/origins/leads in a sampled platform stay together; no IID resampling of overlapping target errors. Per-platform CIs resample entire series within that platform. With only five platforms and two/three series per platform, these intervals are coarse, conditional on the fitted models and synthetic corpus, and do not establish external significance.

Paired selected-minus-historical-mean intervals (negative error delta favors selected):

| Horizon | Metric | Delta | 95% lower | 95% upper |
| --- | --- | --- | --- | --- |
| 7 | mae | -15.3899 | -23.1693 | -8.8074 |
| 7 | rmse | -6.8332 | -17.7265 | 6.7374 |
| 7 | smape | -0.7670 | -1.1836 | -0.5062 |
| 7 | mase | -0.0206 | -0.0350 | -0.0122 |
| 15 | mae | -15.1877 | -22.0528 | -8.3863 |
| 15 | rmse | -6.2596 | -18.4552 | 7.7286 |
| 15 | smape | -0.8007 | -1.1374 | -0.5848 |
| 15 | mase | -0.0194 | -0.0344 | -0.0113 |
| 30 | mae | -4.0558 | -23.2605 | -0.4829 |
| 30 | rmse | 0.7208 | -10.1081 | 8.2282 |
| 30 | smape | -0.0712 | -1.7486 | 0.2513 |
| 30 | mase | -0.0026 | -0.0387 | 0.0048 |

Interpretation: the selected model's pooled MAE-difference intervals exclude zero at all horizons, but RMSE-difference intervals include zero at all horizons. The thirty-day point RMSE is worse than historical mean. These conditional bootstrap findings do not establish an external or all-metric forecasting win.


### Diebold–Mariano vs historical mean

| Model | Horizon | Loss | Common origins | HAC lag | DM statistic | Raw p | BH p | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| mean_median_075 | 7 | absolute | 8 | 2 | -4.6155 | 0.0024 | 0.0497 | ok_small_sample_caution |
| mean_median_075 | 7 | squared | 8 | 2 | -4.6463 | 0.0024 | 0.0491 | ok_small_sample_caution |
| mean_median_075 | 15 | absolute | 6 | 4 | NA | NA | NA | insufficient_origins |
| mean_median_075 | 15 | squared | 6 | 4 | NA | NA | NA | insufficient_origins |
| mean_median_075 | 30 | absolute | 1 | 9 | NA | NA | NA | insufficient_origins |
| mean_median_075 | 30 | squared | 1 | 9 | NA | NA | NA | insufficient_origins |
| original | 7 | absolute | 8 | 2 | 2.2027 | 0.0635 | 0.2841 | ok_small_sample_caution |
| original | 7 | squared | 8 | 2 | 0.8080 | 0.4457 | 0.6553 | ok_small_sample_caution |
| original | 15 | absolute | 6 | 4 | NA | NA | NA | insufficient_origins |
| original | 15 | squared | 6 | 4 | NA | NA | NA | insufficient_origins |
| original | 30 | absolute | 1 | 9 | NA | NA | NA | insufficient_origins |
| original | 30 | squared | 1 | 9 | NA | NA | NA | insufficient_origins |

794 comparisons were estimable and 1348 were explicitly unavailable across all scope/model/loss combinations. DM averages losses over the horizon at each origin, uses Newey-West/Bartlett HAC and HLN finite-sample correction, and never concatenates independent series. Only common dates with fixed series composition enter pooled/platform tests. Horizon-15/30 common panels are especially short; insufficient origins are NA, not p=1 or p=0. Full per-file/platform/common-panel results are in `test_dm_vs_mean.csv`. BH p-values cover all estimable comparisons; small-sample/dependence assumptions remain limitations.


### Frozen conformal intervals

| Model | Horizon | Nominal coverage | Observed coverage | Mean width (Rs) | Mean interval score | Calibration scores |
| --- | --- | --- | --- | --- | --- | --- |
| original | 7 | 0.90 | 0.9114 | 2244.34 | 3036.81 | 308 |
| original | 7 | 0.95 | 0.9497 | 2715.74 | 3459.86 | 308 |
| original | 15 | 0.90 | 0.9271 | 2339.08 | 2992.91 | 330 |
| original | 15 | 0.95 | 0.9643 | 2759.48 | 3413.23 | 330 |
| original | 30 | 0.90 | 0.9462 | 2063.14 | 2373.10 | 330 |
| original | 30 | 0.95 | 0.9882 | 2584.73 | 2726.85 | 330 |
| historical_mean | 7 | 0.90 | 0.9074 | 2239.34 | 3015.86 | 308 |
| historical_mean | 7 | 0.95 | 0.9656 | 2724.72 | 3487.52 | 308 |
| historical_mean | 15 | 0.90 | 0.9248 | 2276.86 | 3017.14 | 330 |
| historical_mean | 15 | 0.95 | 0.9698 | 2691.39 | 3505.48 | 330 |
| historical_mean | 30 | 0.90 | 0.9323 | 1878.88 | 2314.93 | 330 |
| historical_mean | 30 | 0.95 | 0.9634 | 2201.62 | 2609.66 | 330 |
| mean_median_075 | 7 | 0.90 | 0.8942 | 2082.44 | 3080.56 | 308 |
| mean_median_075 | 7 | 0.95 | 0.9656 | 2726.25 | 3531.60 | 308 |
| mean_median_075 | 15 | 0.90 | 0.9171 | 2197.05 | 3061.02 | 330 |
| mean_median_075 | 15 | 0.95 | 0.9667 | 2706.68 | 3543.21 | 330 |
| mean_median_075 | 30 | 0.90 | 0.9323 | 1882.64 | 2339.84 | 330 |
| mean_median_075 | 30 | 0.95 | 0.9634 | 2200.90 | 2630.98 | 330 |

Selection uses rows 28:60; calibration uses only 60:90 and nonoverlapping full-horizon target blocks; test starts at 90. Finite-sample rank-adjusted absolute residual quantiles are frozen before test. Scaling uses only the preceding 30 training incomes. Coverage is empirical marginal coverage over forecast instances, not simultaneous path coverage. Serial dependence, rolling refits, cross-series heterogeneity and pooled calibration prevent an ordinary IID conformal coverage guarantee. Per-platform and lead coverage are reported, including undercoverage; intervals are not tuned to test coverage.

Selected-model nominal 90% coverage by platform:

| Platform | Horizon | Observed coverage | Mean width (Rs) |
| --- | --- | --- | --- |
| blinkit | 7 | 0.8036 | 2618.69 |
| snabbit | 7 | 0.9732 | 1349.52 |
| swiggy | 7 | 0.8929 | 2378.12 |
| uber | 7 | 0.8750 | 2787.71 |
| zomato | 7 | 0.9058 | 1789.99 |
| blinkit | 15 | 0.8444 | 2703.41 |
| snabbit | 15 | 0.9778 | 1455.96 |
| swiggy | 15 | 0.8778 | 2438.54 |
| uber | 15 | 0.9111 | 3037.62 |
| zomato | 15 | 0.9351 | 1929.47 |
| blinkit | 30 | 0.8500 | 2662.12 |
| snabbit | 30 | 0.9833 | 1660.28 |
| swiggy | 30 | 0.9000 | 2512.02 |
| uber | 30 | 0.9167 | 3247.73 |
| zomato | 30 | 0.9391 | 1660.76 |

Blinkit undercoverage and wide intervals show that acceptable pooled coverage does not imply conditional usefulness. Both 90% and 95% levels remain reported; no level/model was chosen to hide coverage failure. Intervals are implemented in the experiment scripts; the application response schema remains unchanged.


### Failures, tests and remaining limits

- New test suite: **13 tests, 13 passed, 0 failures, 0 errors**. Full output is retained. Leakage/split/seed checks and artifact freezing checks are included.

- Across all stages, **0 fit exceptions/nonfinite-output fallbacks**, **3 nonconverged finite fits**, and **69 fits with warnings** were retained. Diagnostics identify stage/model/origin/seed and error; no failed case was deleted. Finite nonconverged fits remain part of the named model result. Caches store only source/prefix/config/seed-keyed predictions and diagnostics.

- sMAPE uses 200*absolute error/(abs actual + abs predicted), 0/0=0. Seasonal MASE uses only training-prefix lag-7 absolute differences; zero denominators are NA with `mase_n` reported, never silently replaced by a favorable scale.

- Horizon 30 has one complete test origin in each 120-day series after independent calibration. The longer 180-day series supplies the remaining rolling origins. No extra test data or fabricated independent windows were generated.

- All configurations and five seeds were fixed before validation/test scoring. If a different configuration happens to have a better test score, it remains unselected. No claim of statistical significance follows solely from lower pooled error. These are library baselines and a small lag-feature experiment, not a novel model or proof of practical financial benefit.

- Production inference, package manifests, router contracts and previous metrics are unchanged. No test result was used to authorize a production replacement.


### Files and reproduction

`forecast_audit/run.py`: model fitting and exclusive staged outputs. `analyze.py`: metrics, bootstrap, DM and interval coverage. `test_forecast.py`: automated checks. `preserve.py`: baseline replay and preservation verification. `PROTOCOL.md`: fixed design. `requirements.txt`/`environment.lock.txt`: isolated dependency versions. `report.py`: append-only measured changelog. All CSV/JSON/log results live in `forecast_audit/results_20261017`.

Important CSVs: `validation_metrics.csv`, `validation_selection_scores.csv`, `test_metrics.csv`, `test_equal_series_macro_metrics.csv`, `test_seed_variability.csv`, `test_bootstrap_ci.csv`, `test_vs_mean_paired_bootstrap_ci.csv`, `test_dm_vs_mean.csv`, `conformal_quantiles.csv`, `test_interval_coverage.csv`, `test_interval_coverage_by_lead.csv`, `fit_diagnostics.csv`, and `selected_comparison.csv`. Prediction CSVs retain the complete audit trail. Prior reports remain historical, unchanged.

```powershell
# Use a NEW results directory: outputs refuse overwrites.
python -m venv forecast_audit/.venv
& forecast_audit/.venv/Scripts/python.exe -m pip install -r forecast_audit/environment.lock.txt
python forecast_audit/preserve.py --out forecast_audit/results_reproduction
& forecast_audit/.venv/Scripts/python.exe forecast_audit/run.py select --out forecast_audit/results_reproduction
& forecast_audit/.venv/Scripts/python.exe forecast_audit/run.py calibrate --out forecast_audit/results_reproduction
& forecast_audit/.venv/Scripts/python.exe forecast_audit/run.py test --out forecast_audit/results_reproduction
& forecast_audit/.venv/Scripts/python.exe forecast_audit/analyze.py --out forecast_audit/results_reproduction
& forecast_audit/.venv/Scripts/python.exe forecast_audit/check_results.py --out forecast_audit/results_reproduction
python forecast_audit/preserve.py --out forecast_audit/results_reproduction --verify
```

## Final export and preservation

- Added `forecast_audit/export_tables.py`: read-only reshaping of the already
  computed metrics into `test_pooled.csv`, `test_per_platform.csv` and
  `test_per_series.csv` (deterministic or five-seed ensemble variants). No metric,
  prediction, selection, interval or existing artifact changes.
- `artifacts_manifest.json` fingerprints scripts, frozen inputs and result tables.
  Reproduce this final export after the staged commands above:

```powershell
& forecast_audit/.venv/Scripts/python.exe forecast_audit/export_tables.py --out forecast_audit/results_reproduction
```

- The seven-day DM common panel contains only eight origins; longer-horizon common
  panels are insufficient. Its small-sample p-values and the full-sample platform
  bootstrap answer different composition/uncertainty questions. Neither overturns
  the failed validation deployment gate or proves a general financial benefit.

### Export repair (no result overwrite)

The first final-export attempt wrote the three summary CSVs, then failed when
fingerprinting a relative output path against the absolute repository path.
Fixed `export_tables.py` to resolve the output path and verify existing exports
against the same computed rows before retaining them. No CSV, metric, dataset or
previous result was edited; the artifact manifest is created only after this check.
