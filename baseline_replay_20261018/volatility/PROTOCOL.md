# Forward volatility protocol — fixed before new scoring, 2026-10-17

## Target and data

Use eleven raw data/normal CSVs as separate histories. Do not double-count the
five volatility CSVs, whose income histories duplicate *_volatile.csv. Audit both
old label columns separately, including original agreement and reconstruction of
seven-entry CV-derived labels; never use those labels or rolling columns as model
features or silently substitute the new target into old results.

Decision origin t is exclusive: observe only y[0:t], through day t-1. Target is
sample SD(y[t:t+14], ddof=1)/mean(y[t:t+14]), over the next 14 observed daily dates.
Require exactly 14 contiguous valid observations. An all-zero future window has
undefined CV, is recorded unavailable, and is not assigned an artificially safe
LOW label. No source record/label is changed. This outcome measures future
relative income variability, not future insolvency, hardship or suitability.

Require 30 past entries. Training label days are confined to indices [0,60):
t=30..46. Validation label days are confined to [60,90): t=60..76. Test label days
are confined to [90,n): t=90..n-14. Daily origins overlap within each partition;
purge origins whose 14-day outcome window crosses a boundary. Training features
and outcomes cannot overlap validation label days; final refit uses only training
and validation examples whose outcomes finish before test starts. Past features
can use any already observed income, including purged gap observations.

Compute global CV cutoffs using np.quantile(training realized CV,[1/3,2/3],
method='linear') once. LOW if CV<q1, MEDIUM if q1<=CV<q2, HIGH if CV>=q2. Freeze
these cutoffs before validation scoring and never refit them after validation.
Report quantile values, ties, all class counts, unavailable cases and data hashes.
The original CSV generation seed/provenance is unknown. Prior audits already
examined these synthetic files: temporal test exclusion is not new external data.

## Features

From strictly y[:t]: mean, sample SD, CV and zero fraction for trailing 7/14/30;
latest income / trailing-30 mean; trailing-7 mean / trailing-30 mean; trailing-7
CV minus trailing-30 CV; and a zero-mean indicator for trailing 30. Ratios use 0
when denominator zero, retaining the explicit indicator. All model scaling and
class weights use only the fit examples. No identifiers/platform, old labels,
precomputed rolling columns or future inputs enter learned models. Current day t
is not available. Actual source dates are sorted and checked for daily continuity.

## Models and validation-only selection

Baselines: actual frozen runtime trailing-30 CV classifier; training-majority;
always HIGH (safety-trivial baseline); trailing CV at 7/14/30 classified with the
frozen future-target cutoffs; and training-optimized ordered CV thresholds at
7/14/30 (training macro-F1 objective, no validation/test threshold learning).

Gaussian NB var_smoothing in [1e-9,.001,.1]; standardized kNN k in [5,15,31],
weights uniform/distance; standardized logistic regression C in [.1,1,10],
class_weight None/balanced, lbfgs, max_iter=2000 (deterministic); gradient boosting
classifier depths 1/2, 80 stages, learning_rate=.05, min_samples_leaf=5,
subsample=.8, sample weights None/train-class-balanced. GB seeds
[11,23,37,53,71]. Every GB configuration is compared using the arithmetic mean
of all five probability vectors; also report individual-seed metrics/variation.
Do not select a seed. Deterministic models need no repeated pseudo-random fits.

For each probabilistic configuration compare argmax and fixed HIGH overrides
at probabilities [.20,.35,.50]. Override rule: if p(HIGH)>=threshold choose HIGH,
else choose the higher-probability LOW/MEDIUM class. Argmax is separate. These
decision rules are selected on validation, never test.

Admissible candidates must have validation HIGH recall >= actual runtime HIGH
recall. Among them select highest macro-F1, then HIGH recall, balanced accuracy,
then declared candidate order. Freeze one winner per family (NB/kNN/logistic/GB)
and one overall winner. Frozen baselines and all three training-CV rules are also
tested. Preserve all unsuccessful validation configurations. No seed, family,
target definition or cutoff is selected on test. Refit learned classifiers on
train+validation examples using the ORIGINAL frozen target cutoffs. If a fit
fails, use the training-majority fallback for all its evaluation cases and retain
the failure; never drop prediction rows. Record warnings and seeds.

## Threshold sensitivity

Validation ONLY, trailing-30 predictor CV. Low boundaries [.25,.30,.35,.40,.45],
high boundaries [.60,.675,.75,.825,.90] (25 cells; includes .35/.75). Future-target
cutoffs and labels remain unchanged. Show macro-F1 and HIGH recall, confusion
counts and validation sample count in every cell, with matrix-form CSVs. Choose
one grid cell under the SAME validation recall-constrained rule and freeze it as
an additional threshold-rule comparator before test. Do not evaluate/reselect
the entire grid on test. Grid cutoffs belong to a predictor, not target relabeling.

## Test metrics and uncertainty

Primary: macro-F1 over fixed LOW/MEDIUM/HIGH labels, zero_division=0; HIGH recall
is undefined if there is no actual HIGH sample (report NA and support). Report
accuracy, per-class precision/recall/F1, balanced accuracy among supported actual
classes, confusion matrices (actual rows/predicted columns), HIGH->LOW and HIGH->
MEDIUM misses. Pooled, per-platform and per-series tables. Do not count five seed
replicas as five independent outcomes; ensemble is one prediction per origin.

Whole-platform cluster bootstrap retains all series/overlapping origins within
each sampled platform. Five fixed seeds [11,23,37,53,71], 1000 draws each,
combined percentile 95% CIs (5000). For per-platform CIs resample entire series
clusters, not overlapping target windows. Report valid bootstrap draws if HIGH
support vanishes. Report paired selected-minus-runtime CIs on the same resamples.
Only five platforms and two/three series per platform: intervals are conditional,
coarse and do not imply real-world generalization or independent risk validation.

Secondary fixed overlap diagnostic: test origins 90,104,118,... at step 14, full
outcomes only, no within-series overlap. This subset never affects selection.
Report all main-family/baseline predictions on it, with support/metrics. No
production classifier, artifact, old evaluation or label column is replaced by
this experiment. A documented future target is a research task, not a validated
financial safety signal or a claim that LOW means adequate earnings.
