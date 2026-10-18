# Data credibility protocol — fixed before new-data scoring

Never overwrite old CSVs/results or call synthetic data real. No original synthetic
generator was recovered; unseeded server DB seed scripts do not establish provenance.
Provide a NEW stated generator, not a claimed reconstruction of original labels.

Repository canonicalization: normalize platform lowercase; choose ONE entire source
history per platform, longest length then filename ascending. Do not stitch different
synthetic workers/regimes at shared platform/date keys. Retain discarded/conflicting
rows in audit tables, not source edits. Assert canonical platform/date uniqueness.
This removes dependence/duplication under the requested key, but source histories
are not known to be one worker; no performance gain may be credited to the method
because the evaluation population changes. Five volatility tables are duplicate
volatile income histories and excluded entirely from forecasting data.

New synthetic generator: seeds11,23,37,53,71, five platforms180days per seed; distinct
calendar years2020–2024 for key uniqueness. Base/log-sigma/work-probability:
blinkit900/.35/.85, snabbit800/.40/.75, swiggy1100/.30/.85,
uber1300/.50/.80, zomato1000/.35/.85. Weekday multipliers Mon–Sun
[.95,.90,.95,1,1.10,1.25,1.20]; Friday–Sunday independent .30 incentive chance
adding .15*base if worked. Markov adverse-state start off, entry .05/recovery .25,
adverse multiplier .55; linear trend1+.0005*day; mean-one lognormal noise; .02
independent zero-income outage plus nonwork days. Round currency2 decimals.
Save work/state/incentive parameters as provenance, never as classifier features.
These are hypothetical INR scenarios, not fitted to population wage statistics.

Real source: nrrb/uber-analytics-project commit
4221faf501de74ecd68aec17ddf1045a29202175, data/rides.csv, repository LICENSE AGPL-3.0.
Retain license/attribution for separate derived data. Download source into memory;
retain hash, not addresses/locations/IDs. Dedupe trip ID; fail on conflicting IDs.
Use published earnings once (already includes listed tips/surge), completed trips,
finite earnings>=0 and valid recorded ride_start date. Audit exclusions. Aggregate
to calendar-day sums in USD. Reindex first-to-last recorded date; absence means
zero RECORDED platform earnings, NOT confirmed zero work/income. Timezone is the
source's naive recorded timestamp, no invented conversion. Costs/other platforms
are unavailable. Do not mix currencies or real/synthetic pools. This is one author's
published data, self-reported provenance, not independently authenticated by Uber.

For each dataset/history: train [0,floor(.6n)), validation [.6n,.8n), test [.8n,n).
No new model selection on any of these tests. Frozen forecasting comparators:
production trend/weekday, historical mean, trailing30mean, seasonal naive7, and
the prior validation-selected .25mean+.75median. Rolling test origins every7 days,
full horizons7/15/30. Past observed test incomes may inform later origins. MAE,
RMSE, sMAPE (0/0=0), MASE with trailing-training weekly-difference scale, windows
and target pairs. Unsupported horizons/zero MASE scale are explicitly recorded.

Forward volatility target: next14 calendar-day sample CV, training-only terciles
fitted to origins30..train_end−14; all-zero future windows undefined, excluded with
counts. Frozen predictors runtime CV30 .35/.75, previously selected CV30 .45/.75,
pastCV14 with that dataset's frozen training target cutoffs. Test origins every7,
full14day outcomes, macro-F1 fixed3 classes, HIGH recall, balanced accuracy, perclass
and confusion. No original labels substituted. No grid search or test tuning.

Report original repository (all donors) and canonical subset separately, not as
like-for-like algorithm before/after improvement. New synthetic seeds report pooled
and per-seed; real separately, never pooled with INR. Daily zero filling is a strong
assumption: report fraction zero/missing and whether zero target windows are omitted.
No claim of real health/router outcome validation: actual expenses/debt/shocks absent.
