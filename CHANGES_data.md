# Data credibility change log

2026-10-17, third prompts.md task. Read README, source CSVs, old seed scripts and
previous evaluation protocols. Original generation script/seed could not be
recovered. New reproducible generator will be labeled NEW synthetic scenarios.
Frozen protocol: data_audit/PROTOCOL.md; no source data/results edited.

Public-source search (primary sources, checked2026-10-17):
- https://github.com/nrrb/uber-analytics-project : author's real Uber driving
  earnings, data/rides.csv, repository AGPL-3.0 license. Pin commit before download.
  Selected for separate one-driver USD evaluation, not net-worker-income validation.
- https://www.gigindex.org/press : CC BY-SA4.0, city quarterly index; unsuitable
  for individual daily forecasting. No invented daily observations.
- https://github.com/nikhgarg/driver_surge_rideaustin : external data.world download
  dependency; not adopted because source access/license not established in this run.
- NYC TLC https://www.nyc.gov/site/tlc/about/tlc-trip-record-data.page and its
  HVFHV data dictionary: driver_pay exists, but public trip data do not provide
  complete identified worker income/cost trajectories; not silently substituted.
- https://github.com/Ajaypatel06/Gig-Worker-Earnings explicitly says synthetic;
  rejected as REAL data. Search results alone are not evidence of real provenance.

No external messages or credential-restricted account scraping. Public author's
published CSV only; raw personal location columns will not be retained.

## Executed data changes (separate derived files only)

Added data_audit/run.py, report.py, test_data.py, PROTOCOL.md. All output in
data_audit/results_20261017. Original16 CSVs passed preservation hashes; no source
labels, earlier metrics or production functions changed. Runtime Python3.11.9,
numpy2.3.4/pandas2.3.3/sklearn1.7.2; no installation. Code snapshot retained.

Canonicalization, BEFORE any new-data scoring: 1,380 normal rows→**660 rows**,
720 rows excluded from this canonical evaluation. **600 repeated platform/date
key groups, 587 with conflicting incomes**. These are not all byte-identical
duplicate observations: stable/volatile donors overlap calendars but differ in
earnings. Resolve by longest WHOLE history per platform, filename ascending tie:
blinkit_stable/snabbit_stable/swiggy_stable/uber_stable/gig_income_data.csv.
No splicing of presumed workers. Derived canonical dataset has unique platform/date
keys; discarded/conflicting rows remain in canonicalization_rows.csv and originals.
Old all-donor results remain unchanged and are NOT a comparable before/after
algorithm improvement. Five volatility CSVs duplicate volatile incomes and are
excluded from forecasting data. No original generator was recovered.

NEW generator (not a reconstruction): 5 seeds×5 platforms×180 days = **4,500 rows**.
Regime/work/outage/incentive provenance columns retained; only past incomes feed
models. Seeds11/23/37/53/71; separate years2020–2024 avoid key collisions across
seed replicates. Exact platform pay/sigma/work rates, weekday multipliers, Markov
entry/recovery, incentives, drift, rounding are in frozen PROTOCOL.md and run.py.
All parameters are hypothetical, not estimates of Indian workers' actual earnings.

## Real source provenance / license / processing

Selected source: [nrrb/uber-analytics-project](https://github.com/nrrb/uber-analytics-project),
pinned commit **4221faf501de74ecd68aec17ddf1045a29202175**, data/rides.csv.
Repository declares AGPL-3.0; full license and separate derivative notice/attribution
included beside real_uber_daily_USD_AGPL3.csv. This is use of its published data,
not a copy of its scraping code or access to Uber's private API. No location/ID
columns are retained in the derivative. Source and license SHA-256 are recorded.

Actual retrieved cleaned CSV: **4,270 trips**, not the article headline4,379.
Duplicate trip IDs0; invalid/non-completed exclusions0. Aggregate published earnings
once by recorded ride_start date; do not add tips/surge again. **626 calendar days**,
2023-01-10–2024-09-26; **361 recorded-trip days**, **265 zero-filled unrecorded
days**. Source raw hash ee4b1b89a3100ab2635d587449c4948d49b8018eb18637426a856da8aa0c3bb3.
Retained real data is daily USD earnings, includes reported tips/surge, before
vehicle/fuel/other operating costs. Author claims own driving history; not independently
authenticated by Uber. One driver, Chicago; not representative Indian gig workers.
Zero filling means zero RECORDED platform earnings, not confirmed unemployment,
no work or no other income. Source timestamps are naive; timezone is unverified.

## Evaluation (no new model selection)

Per history chronological train0:floor(.6n), validation:.8n, held-out last20%.
Frozen comparators: production trend/weekday, historical mean, trailing30mean,
seasonal naive7, earlier validation-selected .25mean+.75median. No new model or
threshold selected on any new test. Rolling origins every7 days, full horizons
only. MASE scale = mean absolute weekly difference in TRAIN, not test.
Absolute errors are in each dataset's currency; NEVER pool USD with INR.
Overlapping windows/one author prevent independent-population inference; no CI
or significance claim is invented for the real case. All five synthetic seeds
retained and seed means/SD reported, not a best seed.

### Real one-driver held-out results (USD, calendar zero-fill assumption)

Train end375, test starts500. Horizons7/15/30: **18/16/14 windows**, **126/240/420**
forecast pairs; overlapping targets are not unique new days.

| H | Method | MAE USD | RMSE USD | sMAPE % | MASE |
|---|---|---:|---:|---:|---:|
| 7 | Production original | 70.708889 | 87.948331 | 94.792829 | 1.162821 |
| 7 | Historical mean | 74.964364 | 90.151198 | 97.688451 | 1.232803 |
| 7 | Prior selected blend | 80.382615 | 100.546099 | 113.010508 | 1.321908 |
| 15 | Production original | 71.991042 | 89.746702 | 97.290748 | 1.183907 |
| 15 | Historical mean | 75.992485 | 90.828931 | 99.901437 | 1.249711 |
| 15 | Prior selected blend | 81.014678 | 101.374824 | 115.013925 | 1.332302 |
| 30 | Production original | 76.390238 | 96.241827 | 104.309741 | 1.256252 |
| 30 | Historical mean | 76.527075 | 91.689611 | 102.057477 | 1.258502 |
| 30 | Prior selected blend | 81.314686 | 102.184041 | 117.547715 | 1.337236 |

Moving30 and seasonal7 results retained in forecast_metrics.csv. Production does
better at7/15 than historical mean here, but H30 RMSE is worse and the prior selected
blend transfers poorly. This is a case study, not a general forecasting win or
reason to reverse the earlier validation deployment decision.

### NEW synthetic pooled test (INR, five seeds)

| H | Method | Windows | Pairs | MAE | RMSE |
|---|---|---:|---:|---:|---:|
| 7 | Production original | 125 | 875 | 507.973851 | 696.066749 |
| 7 | Historical mean | 125 | 875 | 489.052403 | 669.529373 |
| 7 | Frozen blend | 125 | 875 | 490.025832 | 673.907801 |
| 15 | Production original | 100 | 1500 | 502.599833 | 672.470866 |
| 15 | Historical mean | 100 | 1500 | 480.959172 | 641.940510 |
| 15 | Frozen blend | 100 | 1500 | 482.948930 | 647.350459 |
| 30 | Production original | 25 | 750 | 511.334973 | 706.009377 |
| 30 | Historical mean | 25 | 750 | 488.213735 | 673.408058 |
| 30 | Frozen blend | 25 | 750 | 491.213353 | 679.525242 |

Historical mean beats both on all horizons. Every method/seed, sMAPE/MASE and SD
remain in CSVs. No production change or favorable subset selection.

### Forward volatility transfer — a distinct data-definition audit

Next14-day realized sample CV; **PER-HISTORY training terciles** here, unlike the
earlier global187-window training cutoff. Thus these metrics must NOT be presented
as same-target before/after changes to CHANGES_volatility.md. No old label column
is replaced. Test stride7; all-zero future CV unavailable, counts saved. Frozen
runtime.35/.75 and prior-selected.45/.75 evaluated without new tuning.

| Dataset | N | Runtime macro-F1 | Frozen selected macro-F1 | HIGH recall (both) |
|---|---:|---:|---:|---|
| All repository histories | 24 | .174242 | .396424 | .250000 |
| Canonical repository subset | 12 | .055556 | .238095 | .000000 |
| NEW synthetic pooled | 100 | .211765 | .211765 | .205128 |
| Real one-driver | 17 | .047619 | .047619 | NA (HIGH support0) |

Real training CV cutoffs **.925491/1.686289** (full precision in inventory);307
available training target windows. Real test class supports LOW10/MEDIUM7/HIGH0;
past14-CV persistence with train cutoffs macro-F1 .504762, balanced accuracy .757143,
HIGH recall still NA. Runtime/frozen rules balanced accuracy .071429. No excluded
all-zero test target windows. Real safety-critical HIGH detection is **not
evaluated** because support is zero. NEW synthetic past14-cutoff macro-F1 .397781,
HIGH recall .410256; fixed CV rules generalize poorly. Confusions/per-class results
and all seed outcomes retained. No change of target to make the method look better.

## Tests, limitations, exact reproduction

**Seven tests passed, zero failed**: generator reproducibility, key uniqueness,
provenance work/incentive constraints, contiguous location-free real derivative,
currency separation, chronological complete horizons, original source preservation.
No experiment failed. After scoring, removed a dead conditional expression in
source and added offline clone support; original executed code snapshot is retained,
no numerical change or old result rewrite. Unsupported horizons are explicit in
unsupported_horizons.csv: the last20% of120-day histories cannot support H30.

```powershell
$py='forecast_audit/.venv/Scripts/python.exe'
# Offline fresh evaluation from archived, licensed derived inputs:
& $py data_audit/run.py --out data_audit/reproduction --stage clone
& $py data_audit/run.py --out data_audit/reproduction --stage evaluate
$env:DATA_AUDIT_RESULTS='data_audit/reproduction'
& $py data_audit/report.py
# Or online acquisition/generation into a different NEW directory:
& $py data_audit/run.py --out data_audit/reacquired --stage prepare
& $py data_audit/run.py --out data_audit/reacquired --stage evaluate
```

Actual run used --out data_audit/results_20261017 with prepare/evaluate, then report.py.
Complete forecast/CV metrics, confusions, original/canonical datasets, seeds, URLs,
license and hashes are under that directory. No health/router/portfolio financial
outcome validation is possible from the real dataset: expenses, debts, balances,
shocks and operating costs are absent. Do not manufacture those as 'real outcomes'.
The new generator improves reproducibility, not population realism. Neither source
deduplication nor a one-driver external case repairs the original sampling limitations.
