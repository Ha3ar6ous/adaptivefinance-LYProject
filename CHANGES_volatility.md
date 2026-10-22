# Volatility change log

## 2026-10-17 — inspection and fixed scope

- Inspected README.md, repository layout, both CSV label columns,
  ml_service/modules/volatility.py, paper_audit/experiments.py/protocol and the
  latest isolated scientific environment. No applicable AGENTS.md was found.
- Runtime describes trailing 30-entry sample CV, with defaults 0.35/0.75 when
  the optional artifact is absent. Offline calibration instead uses seven-entry
  CV quantiles. Neither old label column documents a forward-looking target.
- Existing labels/data/results and production code stay unchanged. New derived
  target tables are explicitly separate and must not be compared numerically to
  old-label scores as if they measured the same task.
- Reuse the existing forecast_audit/.venv scientific runtime (no install/change).
  Pin the required subset separately for independent reproduction.
- New protocol: forecast next-14-day realized CV from strictly earlier income;
  freeze training-tercile target boundaries; purge label windows crossing split
  boundaries; select on validation only with an explicit HIGH-recall constraint.
- Scripts/results are added under volatility_audit/. Commands and executed
  before/after metrics will be appended here; no result is estimated in advance.

## Pre-test diagnostic reporting amendment

- Initial forward validation completed. NB/logistic/GB had no configuration
  meeting runtime validation HIGH recall; kNN had an admissible configuration.
- Before any new forward test examples were computed, added compare.py and
  DIAGNOSTIC_AMENDMENT.md to freeze unconstrained validation family winners for
  diagnostic comparison. These rejected configurations cannot replace the
  original recall-constrained overall selection. Original protocol/selection
  files remain unchanged; supplementary output uses family_diagnostics/.
- This makes negative comparisons visible rather than omitting rejected models.
- First diagnostic freeze failed before test: sparse validation CSV fields loaded
  as NaN cannot be serialized as strict JSON. Retained the incomplete file in
  family_diagnostics/; remove irrelevant NaN fields in the helper and write the
  corrected freeze/results to family_diagnostics_v2/. No metrics were changed.

## Executed result — forward target, production unchanged

**Finding:** validation-selected CV boundaries improve pooled agreement with the
new future-CV target, but do not improve HIGH recall and introduce HIGH-to-LOW
errors. Do not present this as a validated financial-safety improvement or as an
improvement on the old labels. No production classifier/artifact was replaced.

### Files and preservation

- Added `volatility_audit/run.py`: exclusive-write, staged preparation, legacy
  audit, validation selection, frozen test evaluation, confusion/per-class/group
  tables, clustered bootstrap and preservation hashes.
- Added `PROTOCOL.md` before scoring; `requirements.txt` and `.gitignore`.
- Added `compare.py` and `DIAGNOSTIC_AMENDMENT.md` before test: diagnostic family
  winners only; failed initial freeze retained, corrected output in `_v2`.
- Added `test_audit.py`, `test_results.py`, `report.py`: leakage/boundary and result
  integrity checks, final copyable CSVs and captured test output.
- All results: `volatility_audit/results_20261017/`. Main paper-ready comparisons:
  `final_tables/pooled_model_comparison.csv`; all per-class/confusion tables in
  `final_tables/`; detailed group CIs in `family_diagnostics_v2/`.
- SHA-256 check: **127 pre-existing data/code/report files unchanged**, including
  prior forecasting/audit results and already-modified server files. Frozen
  source/protocol, runtime snapshot, thresholds and selection hashes are saved.
  Final output hashes: `final_tables/all_results_sha256.json`.
- Base Git HEAD: `db3fc1d56a8f38042a91e21ec6164ac8be0dfe40`; working tree was
  already dirty. No paper, source dataset, existing result or core behavior edit.

### Environment and provenance

Windows build 22631 (Python platform string Windows-10-10.0.22631-SP0), Python
3.11.9; NumPy 2.3.4, pandas 2.3.3, SciPy 1.16.3, scikit-learn 1.7.2.
Reused `forecast_audit/.venv`; no dependency install or changes. Exact required
pins: `volatility_audit/requirements.txt`; environment saved in results.

`data/normal/*.csv`: 11 daily synthetic-looking histories, 1,380 rows, five
platforms. Ten stable/volatile files have 120 days (2024-01-01–2024-04-29);
`gig_income_data.csv` has 180 days (2024-01-01–2024-06-28), platform zomato.
Inventory records filenames, lengths, zero-income counts, dates; source hashes
are in `preserved_sha256.json`. All dates are contiguous, incomes finite and
nonnegative. These are histories, **not 11 documented independent workers**.
The exact CSV generator, sampling population and generation seed were not found;
unseeded database demo seed scripts were not run. These data have been inspected
by previous audits and are not an external prospective dataset.

Legacy `data/volatility/*_with_volatility_label.csv`: five files, 600 rows,
income sequences exactly duplicate the normal volatile files; excluded from
forward modeling to prevent duplication. Original labels LOW/MEDIUM/HIGH:
167/255/178; statistical labels: 25/132/443. Columns agree on 229/600 rows.
The statistical column reconstructs trailing-seven sample CV thresholds .30/.60
on **600/600** rows (max CV discrepancy 3.68594044175552e-14). This is synthetic
rule reconstruction, **not independent predictive validation**. Original label
semantics/generator remain unknown; normal-file Stable/Volatile labels are also
not used as the new target.

Original runtime trailing-30 rule, defaults .35/.75, optional artifact absent:
**162/455 = 35.6044%** agreement with original labels; **333/455 = 73.1868%**
with statistical labels, using indices 29–119 in each old-label file. Existing
trainer instead computes global quantiles of stored seven-day CV, without this
audit's chronological split. This explains incompatible window/calibration
contracts, not which old label is scientifically correct.

### Target and split (new task, explicitly derived)

At exclusive origin t, features observe `income[:t]`; target is sample standard
deviation / mean of `income[t:t+14]` (ddof=1). All-zero future mean is undefined,
not LOW; **0 unavailable/excluded examples** in the executed partitions.
Future-CV target cutoffs are training-only linear terciles:
**0.531709662312071 / 0.7739171644202268**. LOW `<q1`; MEDIUM `[q1,q2)`;
HIGH `>=q2`. No existing label column is overwritten. Terciles define relative
classes in this training population; they are not financial-risk tolerances.

| Partition | Origins per 120-day series (exclusive t) | N | LOW | MEDIUM | HIGH |
|---|---|---:|---:|---:|---:|
| Train | 30–46 | 187 | 62 | 62 | 63 |
| Validation | 60–76 | 187 | 94 | 27 | 66 |
| Test | 90–106 | 247 | 124 | 73 | 50 |

The 180-day series contributes test origins 90–166. Purge t=47–59 and 77–89
in every series: 286 crossing origins omitted, so label days never cross split
boundaries. Models refit on 374 train+validation examples, retaining ORIGINAL
train-only target cutoffs. Each test origin uses only income observed by then;
earlier observed test-period incomes may be used for later-origin features, but
no test labels or model/threshold updates. No random split or test tuning.

Features: trailing 7/14/30 mean, sample SD, CV, zero fraction; latest/30-day mean,
7-day/30-day mean, CV7−CV30, zero-mean indicator (16 total). No platform IDs,
legacy labels, stored rolling columns or future inputs. Zero-denominator ratios
are zero with an explicit indicator. Model scaling/weights fit on fit data only.

### Selection and configurations

- Fixed baselines: exact frozen runtime; training-majority (HIGH by 63 training
  examples); always-HIGH; past CV7/14/30 with frozen target cutoffs.
- Training-tuned rules: each window searches ordered pairs from its 21 training
  CV quantiles (0,.05,…,1), maximizing training macro-F1. Frozen cutoffs:
  CV7 `.5132376899509923/.7158396582455895`;
  CV14 `.575508492836488/.6294755139642916`;
  CV30 `.5465811707824876/.8918541430114246`.
- NB smoothing `{1e-9,.001,.1}`; standardized kNN k `{5,15,31}` ×
  uniform/distance; standardized logistic C `{.1,1,10}` × None/balanced,
  lbfgs/max_iter=2000; GB depth `{1,2}` × None/balanced training sample weights,
  80 stages, learning_rate=.05, min_leaf=5, subsample=.8.
- GB uses seeds **11,23,37,53,71**, averages their probabilities before decisions;
  no seed selection. Deterministic estimators are not falsely counted as random
  replications. Decision rules: argmax or HIGH override at pHIGH .20/.35/.50;
  otherwise choose higher-probability LOW/MEDIUM. All configurations retained.
- Overall eligibility: validation HIGH recall ≥ runtime **60/66=.909091**;
  maximize macro-F1, ties HIGH recall, balanced accuracy, declared order.
- The selected grid rule is trailing30 CV **.45/.75**, validation macro-F1
  **.683996**, HIGH recall **.909091** (runtime .525145/.909091).
  Only kNN has an eligible learned configuration: k=31, uniform, override .20,
  validation .476675/.924242; it loses on macro-F1.
- Diagnostic unconstrained family winners were frozen before test:
  NB smoothing .1/override .20; kNN31 uniform/override .35;
  logistic C=.1 unweighted/override .35; GB depth1 unweighted/override .20.
  All fail the validation recall constraint. They remain rejected even if their
  test recall later looks better. The original selection is not changed.

### Final pooled test results (same new target, N=247)

| Method | Val macro-F1 | Val HIGH recall | Test macro-F1 | Test HIGH recall | Test balanced accuracy | HIGH→LOW |
|---|---:|---:|---:|---:|---:|---:|
| Runtime CV30 .35/.75 | .525145 | .909091 | .324358 | .720000 | .445479 | 0 |
| Selected CV30 .45/.75 | .683996 | .909091 | .603309 | .720000 | .621610 | 2 |
| Past CV14 / target cutoffs | .631444 | .818182 | .607867 | .540000 | .603000 | 4 |
| Always HIGH / train-majority | .173913 | 1.000000 | .112233 | 1.000000 | .333333 | 0 |
| Eligible kNN, override .20 | .476675 | .924242 | .467998 | .800000 | .572308 | 10 |
| Rejected NB diagnostic | .543957 | .530303 | .503671 | .680000 | .547590 | 14 |
| Rejected kNN diagnostic | .554410 | .833333 | .496235 | .720000 | .567405 | 14 |
| Rejected logistic diagnostic | .535169 | .500000 | .466985 | .720000 | .553706 | 14 |
| Rejected GB diagnostic, five-seed ensemble | .469411 | .727273 | .535172 | .900000 | .625784 | 5 |

All 15 evaluated configurations/baselines appear in the complete CSV, including
unsuccessful training-tuned rules; all 110 validation candidates are retained.
Past-CV14 has higher test macro-F1 than the selected model, but was ineligible
on validation. GB test HIGH recall .90 does not justify post-test reselection.

| Metric | Runtime | Selected | Absolute change | Relative change |
|---|---:|---:|---:|---:|
| Macro-F1 | .324358 | .603309 | +.278952 | +86.0012% |
| HIGH recall | .720000 | .720000 | .000000 | .0000% |
| Balanced accuracy | .445479 | .621610 | +.176131 | +39.5373% |
| Accuracy | .327935 | .635628 | +.307692 | +93.8272% |

Confusions: rows actual LOW/MEDIUM/HIGH, columns predicted LOW/MEDIUM/HIGH.

| Actual | Runtime LOW | MEDIUM | HIGH | Selected LOW | MEDIUM | HIGH |
|---|---:|---:|---:|---:|---:|---:|
| LOW | 0 | 116 | 8 | 91 | 25 | 8 |
| MEDIUM | 4 | 45 | 24 | 19 | 30 | 24 |
| HIGH | 0 | 14 | 36 | 2 | 12 | 36 |

Selected per-class precision/recall/F1: LOW **.812500/.733871/.771186**;
MEDIUM **.447761/.410959/.428571**; HIGH **.529412/.720000/.610169**.
Full per-class/confusion tables are saved for every baseline/family/platform/series.

### Bootstrap uncertainty and overlap

Percentile 95% cluster bootstrap, **5,000** draws: 1,000 per fixed seed listed
above. Pooled resampling unit is whole platform (5 clusters), retaining all
histories and overlapping windows together. Per-platform CIs resample whole
series (2, or 3 for zomato). Metrics use fixed three-class macro-F1 with zero
division=0; balanced accuracy averages supported actual-class recalls; no-HIGH
replicates have undefined HIGH recall and are excluded for that metric, with
valid draw counts reported. These coarse, conditional CIs are not independent
worker-level generalization guarantees.

| Pooled quantity | Estimate | 95% CI |
|---|---:|---|
| Runtime macro-F1 | .324358 | [.215682, .474869] |
| Selected macro-F1 | .603309 | [.394946, .656675] |
| Selected minus runtime macro-F1 (paired) | .278952 | [.013404, .338032] |
| Runtime / selected HIGH recall | .720000 | [.222222, 1.000000] |
| Selected minus runtime HIGH recall (paired) | .000000 | [.000000, .000000] |

The HIGH boundary remains .75, so identical HIGH predictions explain zero recall
delta; this is not evidence of improved HIGH detection. Macro-F1 gains largely
recover LOW predictions. Selected macro-F1 decreases on blinkit (.288889→.271605)
and swiggy (.489899→.450216), is unchanged on snabbit (.173913), and increases
on uber (.139535→.528361) and zomato (.238255→.500202). Both rules have **zero
HIGH recall on blinkit and uber**. Zomato contributes 111/247 test windows,
other platforms 34 each. Pooled gains do not establish uniform performance.

Fixed non-overlapping test diagnostic, origins 90,104,…: **26** examples,
HIGH support **6**. Runtime/selected macro-F1 **.297143/.559707** and HIGH recall
**.666667/.666667**. All-model subset tables retained; this did not select models.
For GB diagnostic, five individual seeds yield macro-F1 mean **.535053**, sample
SD **.000267**, range **.534576–.535172**; HIGH recall **.900000**, SD **0**.
The ensemble remains one prediction per origin, not five independent samples.

### Validation threshold sensitivity (N=187; target labels held fixed)

Rows LOW cutoff; columns HIGH cutoff; values macro-F1. Entire grid is validation
only. One frozen selected cell, not the whole grid, was evaluated on test.

| LOW \ HIGH | .600 | .675 | .750 | .825 | .900 |
|---|---:|---:|---:|---:|---:|
| .25 | .279721 | .372420 | .388655 | .351504 | .333025 |
| .30 | .279721 | .372420 | .388655 | .351504 | .333025 |
| .35 | .407804 | .512301 | .525145 | .484883 | .465431 |
| .40 | .442544 | .551835 | .563016 | .521299 | .501329 |
| .45 | .552388 | .683238 | .683996 | .633908 | .610624 |

HIGH recall at each column, identical across these LOW cutoffs:
**.969697 / .924242 / .909091 / .712121 / .545455**. Full sample counts and nine
confusion cells per grid cell: `validation_threshold_grid.csv`; matrix CSVs in
`final_tables/`. The winner is at the LOW-grid edge: no claim of global optimality
and no expansion of the grid after test inspection.

### Failures, tests, defensible claims

- One helper serialization failure (NaN from sparse CSV), fixed and logged above;
  no model fit failures, warnings, dropped test predictions or majority fallbacks
  activated. Validation and test fit-event JSON files are empty lists.
- **20 unittest checks passed, 0 failed**. Checks cover future-feature poisoning,
  undefined CV, boundary semantics, chronological purges, train-only target
  thresholds, selection hashes, no test grid sweep, complete prediction rows,
  recomputed metrics, five-seed ensemble, cluster configuration and preservation.
  Output and command: `final_tables/test_run.txt` / `test_execution.json`.
  No coverage percentage claimed; these tests validate the experiment contract,
  not financial safety or the original label correctness.
- Safe to cite: a documented forward 14-day relative-variability target; leakage
  controls; the full held-out comparison and CIs; observed macro-F1 gain against
  runtime under a validation recall constraint; negative model/safety findings.
- Must retain: synthetic/unknown provenance; few correlated histories/platforms;
  overlapping daily outcomes; broad CIs; temporal class shift; previously seen
  source files; no real-worker/external validation; relative CV is not hardship,
  adequate income or investment suitability. Original zero-mean runtime labels
  remain LOW, whereas this research target marks zero-mean future CV unavailable.
- Recommendation: use this as an empirical target-definition/calibration audit,
  not a new deployable risk model. HIGH recall did not improve; HIGH→LOW errors
  worsen. Future safety work needs independent outcomes and an explicit cost for
  HIGH→LOW mistakes on new validation data, not further tuning on this test set.

### Exact reproduction commands (PowerShell, repository root)

Use a **new output directory**: all scripts refuse to overwrite prior results.
The following reruns the final protocol, including rejected diagnostic families;
the preserved initial failed serialization attempt need not be repeated.

```powershell
$py = 'forecast_audit/.venv/Scripts/python.exe'
$out = 'volatility_audit/reproduction_20261017'
& $py volatility_audit/run.py --out $out --stage prepare
& $py volatility_audit/run.py --out $out --stage select
& $py volatility_audit/compare.py --out $out --stage freeze
& $py volatility_audit/run.py --out $out --stage test
& $py volatility_audit/compare.py --out $out --stage test
& $py volatility_audit/report.py --out $out
# Standalone regression rerun against that output:
$env:VOL_AUDIT_RESULTS = $out
& $py -m unittest discover -s volatility_audit -p 'test_*.py' -v
```

Commands actually executed used `--out volatility_audit/results_20261017` in the
same prepare/select/freeze/test/test/report order. The first freeze failed on NaN,
then succeeded after the logged serialization-only helper fix, before test.
If the reusable interpreter is unavailable, create a separate Python 3.11 venv
and install only the pinned `volatility_audit/requirements.txt`; the executed
audit did not install anything. Do not rerun existing old audit scripts into
their old output directories.
