# Frozen audit protocol (2026-10-15)

Written before new model validation/test runs. Earlier audits already examined these
synthetic files. "Test" below means excluded from this run's configuration selection;
it does not mean previously unseen external data. No paper or historical audit output
is changed. No live API experiment is needed for these three targets.

## Router

Permission requires finite numeric nonnegative balance/debt, positive expenses,
balance >= three months' expenses, debt <= half a month's expenses, health score
in [70,100] with consistent phase, known low/medium volatility, and structurally
complete usable analytics. Missing/error/unknown/invalid analytics block investment.
Fresh ML responses may omit status; a supplied status must equal ready. Features
require at least three entries, positive mean income, finite nonnegative SD/CV and
consistent rounded SD/mean. Forecast horizon is an integer in [1,30], points have
consecutive valid ISO dates and nonnegative finite incomes, at least one positive
income, and a recognized method. This is an engineering policy, not an empirically
validated financial suitability standard. The check does not establish provenance,
timestamp freshness, original-income agreement, or financial outcome safety.

Evaluate original and revised router on the same 1,792 complete fixtures from the
prior boundary grid, now with explicit complete analytics. Original weaker oracle
results are preserved separately. Add a deterministic invalid/missing-input matrix,
cached-flag bypass cases and application integration tests. Positive = policy allow;
report TP/FP/FN/TN, precision, recall, false allows/blocks and original exceptions.

## Forecast

Eleven normal CSVs only; derived volatility duplicates excluded. Each file's final
60 observations are split into validation (first 30) and test (last 30). Origins
are n-60, n-45 for validation and n-30, n-15 for test. Horizon/step=15, expanding
training prefix, nonoverlapping evaluated targets within split. Later origins may
use previously realized targets, as in operational rolling forecasting. Freeze one
global candidate using validation alone, before scoring any test forecasts.

Fixed candidate family: original; historical mean; moving means 7/14/30/60;
seasonal naive 7; SES alpha .05/.1/.2/.4/.6/.8; damped Holt alpha .1/.3,
beta .05/.2, phi .9/.98; autoregressive AR(1) OLS with lag coefficient clipped to
[-.98,.98]; mean/median mixtures with median weight .25/.5/.75/1. No stochastic
training. Statistical methods clamp negative future income to zero. SES initializes
from the first observation; Holt initializes level at the first observation and
trend zero. AR(1) fits intercept/lag from training only and forecasts recursively.
Global selection minimizes MAE/validation historical-mean MAE plus
RMSE/validation historical-mean RMSE; exact ties follow declared candidate order.
Deployment eligibility requires both validation MAE and RMSE below historical mean
and original. Test results do not determine deployment or change configuration.
If no eligible candidate exists, retain the original application forecaster and
recommend historical mean as the smallest empirical comparison alternative.

## Volatility

Five labeled CSVs, kept separate, date ordered. Predict original volatility_label
as primary target; never include either label column or precomputed rolling
statistics in features. Per-file rows 0:60 train, 60:90 validation, 90:120 test.
Evaluate rows with >=30 observed values for every window candidate; warmup train
rows 0:29 excluded. Features at day t may include today's income: classification
is contemporaneous, not next-day forecasting. Adjacent windows overlap, and no
claim of independent financial-risk truth is possible.

Candidates: majority class (training only), existing classifier (30/default CV),
CV rule at 7/14/30 with training-only .33/.66 quantiles; supervised ordered-CV
threshold classifiers for 7/14/30 (thresholds learned from training labels only);
Gaussian naive Bayes with variance smoothing 1e-6/.01/.1, standardized nearest
centroid with unit or inverse-class-size prediction priors; and kNN k=5/15/31,
standardized using training only. Features: mean, sample SD and CV at 7/14/30,
zero fraction over 30, and latest income/30-day mean. No random seed is required
because all candidates are deterministic. Select global configuration by highest
original-target validation macro-F1, then balanced accuracy, then candidate order.
Refit chosen configuration on train+validation before one final test report;
report every fixed candidate's test metrics for transparency without reselection.

Separately reconstruct derived volatility_label_stat with seven-entry sample CV
and .30/.60 boundaries as a diagnostic only. Report class distributions and
confusion/per-class metrics for both targets, explicitly separated. Retain the
runtime volatility classifier unless independent label meaning can be justified;
experimental label classifiers must not silently change financial readiness.
