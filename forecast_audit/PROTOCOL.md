# Forecast protocol frozen before new validation/test scoring — 2026-10-17

## Data and chronological partitions

Use all eleven data/normal/*.csv as separate daily series; never add their
feature-engineered volatility duplicates. Check hashes and daily continuity.
All dataset/label files and existing result artifacts remain unchanged.
There is no known original synthetic generation seed. Five platforms, not ten
capitalization variants; series sharing a platform are correlated clusters.

Initial training prefix: rows [0,28). Validation targets: [28,60). Calibration
targets: [60,90). Test targets: [90,n). The 120-day files have 30 test days; the
180-day gig_income_data file has 90. This longer file is retained transparently,
with equal-series and platform summaries alongside forecast-instance pooling.
This split is newly frozen, but old audits already exposed these data; no claim
of new external confirmation. No test scores enter selection or calibration.

Horizons 7/15/30. Validation/test origins start at their respective partition
boundaries with step 3, retaining only full-horizon targets inside the partition.
Each origin uses only earlier observed values; later origins can use outcomes
already realized, never future income. Explicitly count origins, forecast-instance
pairs, and unique target dates. Overlap is not independent sample replication.

## Fixed models and randomness

- Existing unchanged trend/weekday method, last-observation naive, seasonal-naive
  7, historical mean, moving means 7/14/30, prefix median, and fixed prior-audit
  25% mean / 75% median blend.
- statsmodels ETSModel additive-error level-only; additive damped trend; additive
  weekly seasonality without trend. Fit on training-mean-scaled income, zero
  initialization randomness, estimated initialization, maximum 200 iterations.
- statsmodels ARIMA(1,0,0) with constant; ARIMA(0,1,1) without drift; SARIMAX
  (1,0,0)x(1,0,0,7) with constant; SARIMAX (0,1,1)x(0,1,1,7) without drift.
  Stationarity/invertibility constraints enabled, maximum 100 iterations.
- sklearn GradientBoostingRegressor: squared_error, huber(alpha=.9) and quantile
  (alpha=.5) losses; depth 1 or 2; 80 trees, learning_rate=.05, min_samples_leaf=5,
  subsample=.8. Five seeds: [11,23,37,53,71], never select a seed. Univariate
  recursive prediction, fitting each series separately. Features: lag 1/2/3/7/14,
  trailing mean/SD 7/14, zero fraction 14, and target-day weekday sin/cos. Every
  feature uses only values before its target. All scaling uses the current
  training prefix mean (floor 1). Recursive future features use predictions,
  never future actual observations. Five-seed arithmetic ensemble is a separate
  fully specified deployed-candidate prediction; also report every seed's metrics
  and across-seed variation. No test-dependent ensemble weighting.

Clip all predictions to nonnegative currency amounts and round to two decimals.
Cache forecasts to 30 steps per (file,origin,configuration,seed) to avoid refitting
the same model for each horizon. Origin/seed input hashes protect cache identity.
Optimization warnings/nonconvergence with finite forecasts are retained/logged.
Exceptions or nonfinite forecasts trigger historical-mean fallback for that whole
origin and remain in every metric; report fallback counts, never drop failures.

## Selection and production rule

One global model/configuration, not a separate winner per platform. Minimize the
equal-horizon average of validation MAE / historical-mean MAE plus validation
RMSE / historical-mean RMSE. GB configurations use the prescribed five-seed
ensemble, not the best seed. Exact ties follow model declaration order. Save and
fingerprint selection.json before calibration or test prediction.

Replacement requires strictly lower validation MAE AND RMSE than both original
and historical mean at ALL THREE horizons, no fit fallbacks in validation, and
production compatibility/cold-start tests. Test results cannot change this gate.
If the gate fails, keep production and record negatives. If it passes but the
runtime/deployment contract is unsupported, leave the result experimental and
state the specific reason; do not rewrite the architecture for this evaluation.

## Metrics, uncertainty and significance

Report pooled, per-file and per-platform MAE, RMSE, sMAPE and seasonal MASE.
sMAPE = 200*|y-p|/(|y|+|p|), with 0/0 set to zero. MASE divides absolute error by
the origin-training mean |y[t]-y[t-7]|. If that denominator is zero, MASE is
undefined for those rows and report its evaluated denominator explicitly.

Bootstrap: whole-platform cluster resampling, keeping all series, origins and
lead errors within each sampled cluster, so overlapping errors are never sampled
as if independent. Five fixed bootstrap seeds [11,23,37,53,71], 1000 replicates
each, combined percentile 95% CIs (5000 draws). Report selected-vs-mean paired
metric-difference CIs too. Per-platform intervals, conditional on that platform,
instead resample entire series clusters; a platform with one series has no
estimable nonparametric cluster uncertainty (explicitly NA). Only five platform
clusters exist; CI reliability/generalization is limited. No CI-based selection.

DM: two-sided, absolute and squared loss, loss averaged over leads for each
origin. Compare each fixed candidate/ensemble against historical mean. Per-file,
per-platform common-origin averages and pooled common-origin averages; do NOT
concatenate unrelated series into one time series. Newey-West/Bartlett HAC lag
ceil(horizon/3)-1; Harvey-Leybourne-Newbold finite-sample correction, t reference
with n-1 degrees of freedom. Require n > 2*ceil(horizon/3); otherwise mark
insufficient origins. Zero/nonpositive HAC variance is NA, not an invented p-value.
Common-origin pooling uses fixed composition (intersection of origin dates).
Report actual n, lag, statistic, raw p and BH-adjusted p across all estimable
comparisons. Small sample power and synthetic dependence remain limitations.

## Prediction intervals

After selection is frozen, use only calibration-period rolling forecasts. To
avoid overlapping calibration target blocks, origins advance by the horizon
(60,67,74,81 for h=7; 60,75 for h=15; 60 for h=30). Fit on each earlier prefix.
Pool normalized absolute residuals per model and horizon across series/leads:
score=|y-p|/max(sampleSD(last30 training incomes),1). For alpha .10/.05 use order
statistic ceil((m+1)*(1-alpha)), clamped only through infinity if rank exceeds m.
Test interval = [max(0,p-q*past_scale), p+q*past_scale]. Quantiles stay frozen;
test outcomes never recalibrate or select intervals. Report nominal/empirical
coverage, width and interval score (Winkler), per platform/horizon and pooled.
These are empirical normalized split-conformal intervals: time dependence,
cross-series heterogeneity and rolling refits defeat ordinary IID exchangeability
guarantees. No simultaneous-path or conditional-coverage guarantee is claimed.
