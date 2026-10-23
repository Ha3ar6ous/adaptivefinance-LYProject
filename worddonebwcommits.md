# Research Evaluation and Reproducibility Work Report

- **Project:** Adaptive Finance — risk-aware financial decision support for gig workers
- **Report prepared:** 23 October 2026
- **Purpose:** Document the substantial research, implementation, testing, and documentation work delivered in the large research revision, including unsuccessful experiments and remaining limitations.

## 1. Commit range and scope

This report uses explicit commit IDs rather than relative terms such as “previous commit,” which change as new commits are added.

| Reference | Commit | Description |
|---|---|---|
| Starting revision | `db3fc1d56a8f38042a91e21ec6164ac8be0dfe40` | Earlier application revision: `feat : small enhancements to the UI` |
| Completed research work package | `6eeab72eca31d52e0e30bde157a148c33525a203` | `Publish research audits, safety fixes, tests, and project documentation` |
| Integration into `main` | `ebbce1d` | Merge of pull request #1 from `revision-ablations` |

The substantive comparison is **`db3fc1d → 6eeab72`**. The later merge integrates that work with the main branch. The separate collaborator commit `d925cf4`, concerning chat-message state, is not attributed to this research package.

The comparison contains 25,380 changed files and 6,836,977 inserted lines. These figures include extensive saved predictions, fit caches, repeated experiment outputs, snapshots, and audit records. They are **not** counts of independently authored features, independent experiments, or independent observations. The meaningful contribution is the evaluation design, evidence, reproducibility infrastructure, and targeted fixes described below.

This report was prepared from committed source differences and already-executed experiment artifacts. No new benchmark, model tuning, data generation, or live API evaluation was performed to write it. The principal final research run is dated 18 October 2026.

## 2. Executive overview

The work moved the project beyond a primarily descriptive system presentation toward a more auditable empirical evaluation. It addressed the major concerns about weak forecasting comparisons, unclear volatility labels, arbitrary health weights, limited router scenarios, qualitative investment evaluation, untested explanation failures, and absent automated checks.

| Workstream | Work completed | Honest outcome |
|---|---|---|
| Reproducibility | Captured source/data hashes, baselines, command records, environments, seeds, and replay results | Deterministic results reproduced; timing/API variation and retained failures were recorded |
| Forecasting | Rolling-origin, multi-horizon comparisons with statistical and learned baselines, intervals, uncertainty, and diagnostics | Existing forecaster did not beat historical mean; candidate replacement was rejected |
| Volatility | Investigated label provenance, defined a separate future-CV target, compared classifiers, and calibrated thresholds on validation | Macro-F1 improved on the defined target; HIGH recall did not improve |
| Router | Strengthened mandatory input/readiness checks and expanded boundary/adversarial fixtures | No false allows or false blocks against the documented conservative policy in the evaluated fixtures |
| Financial outcomes | Built a paired cash-flow simulator and policy/threshold/ablation comparisons | Conditional reductions in forced sales, with important unfavorable comparisons and no real-world safety claim |
| Health score | Tested monotonicity, weights, corrections, calibration, and outcome discrimination | Proposed scalar correction was not adopted; optimal weights and incremental gate benefit were not established |
| Investment engine | Quantified filtering/ranking/allocation behavior and corrected allocation rounding/minimums | Observed allocation-constraint violations were eliminated in the evaluated synthetic grid |
| Explanation layer | Added snapshot-bound validation, controlled corruptions, fallback checks, and live API measurements | Strong numerical fidelity within a deliberately constrained template design; no unrestricted language-quality claim |
| Testing and delivery | Added automated suites, paper-facing exports, verification, and current project documentation | Final research suite retained four visible failures; outputs and limitations were published |

## 3. Baseline preservation and reproducibility

### What was done

The existing application, initial evaluation scripts, research outputs, datasets, and available tests were inspected before further revision. A reproducibility baseline was captured in [baseline_results.json](baseline_results.json), with supporting records under [baseline_replay_20261018/](baseline_replay_20261018).

The capture includes source and dataset fingerprints, runtime information, seeds, fixture objects, numerical tables, command arguments, output locations, and exit codes. This matters because the working tree already contained research and application changes when the baseline was captured: the earlier Git commit alone did not represent that entire state.

### What reproduced and what did not

- Of 107 compared CSVs, 102 matched exactly. The five differing tables concerned timing or live API behavior; deterministic metric differences were zero.
- The replay compared 246,237 numerical CSV cells. All nine archived fixture objects reproduced exactly.
- A single-thread health-score sensitivity replay produced 72 floating-point differences. A separate replay using the original default-thread environment matched all nine archived score CSVs exactly. These differences were retained rather than concealed.
- Network/API success counts and latencies varied between runs, as expected for live measurements. They were not presented as deterministic algorithm improvements.
- One original paper router example no longer reproduced its permissive outcome because its fixture lacked analytics required by the revised policy. This was documented as an input-contract/policy change.

The final verification records unchanged hashes for all 16 original CSVs, 315 archived files, the captured baseline JSON, and the supplied paper PDF. These are checks from the archived evaluation, not newly rerun preservation claims for this report.

**Evidence:** [CHANGES_baseline.md](CHANGES_baseline.md), [final_verification.json](revision_audit/final_verification.json).

## 4. Income forecasting: stronger evaluation, no forced success

### Evaluation work

A dedicated [forecast_audit/](forecast_audit) workspace was added. The evaluation expanded from limited comparisons to chronological rolling-origin forecasting at horizons of 7, 15, and 30 days.

The frozen procedure uses an initial training prefix of 28 observations, validation targets at indices 28–59, interval-calibration targets at 60–89, and test targets from 90 onward. Origins advance by three observations, and only complete horizons within a partition are scored. A later origin can use outcomes that have already occurred; it cannot use future income.

Compared methods include last-observation naive, weekly seasonal naive, historical mean, moving averages, median and fixed mean/median blends, ETS, ARIMA/SARIMA, and lag-feature gradient boosting with squared-error, Huber, and quantile losses. Stochastic models use five documented seeds. Model selection uses validation results, with a separate calibration partition for prediction intervals.

Reporting includes MAE, RMSE, sMAPE, MASE, per-series/per-platform summaries, bootstrap confidence intervals, Diebold–Mariano comparisons with dependence-aware variance, fit warnings/failures, and conformal prediction-interval coverage. Overlapping forecast pairs and repeated seeds are not treated as independent new observations.

### Representative held-out results

The following are pooled results on the same frozen test windows; values are rounded to three decimals. The research blend is 25% historical mean plus 75% historical median.

| Horizon | Windows | Forecast/target pairs | Existing MAE | Existing RMSE | Historical-mean MAE | Historical-mean RMSE | Research-blend MAE | Research-blend RMSE |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 7 | 108 | 756 | 535.231 | 761.722 | 507.080 | 740.183 | 491.690 | 733.350 |
| 15 | 86 | 1,290 | 526.055 | 770.653 | 498.619 | 748.936 | 483.431 | 742.677 |
| 30 | 31 | 930 | 437.309 | 616.350 | 404.916 | 575.711 | 400.860 | 576.431 |

**Decision:** The production forecaster was retained. Although the blend has favorable test MAE and some favorable test RMSE comparisons, it failed the predeclared validation adoption rule: its validation RMSE was worse than historical mean at every horizon. At horizon 30, it also loses to historical mean on test RMSE. Test results were not used to reverse the validation decision.

The source data had already been examined in earlier audits. The new split prevents selection leakage within this evaluation, but is not fresh external confirmation. Separate transfer experiments also failed to establish a general forecasting advantage.

**Evidence:** [forecast protocol](forecast_audit/PROTOCOL.md), [forecast change log](CHANGES_forecast.md), [final comparison table](revision_audit/final_20261018/forecast/selected_comparison.csv).

## 5. Volatility classification: target definition and measured improvement

### Problem investigated

The existing implementation and dataset labels did not describe the same task consistently. The runtime classifier used recent-entry CV, while offline calibration and historical statistical-label code used shorter windows and different thresholds. The original `volatility_label` origin remained unverified.

Git-history inspection recovered deleted notebook evidence for `volatility_label_stat`: grouped trailing seven-entry sample standard deviation divided by mean, categorized with thresholds 0.3/0.6. Recovering that transformation does not establish the provenance of the original income or original label column.

### Work completed

A distinct forward-looking target was introduced in the research tooling: realized sample CV of the **next 14 days**, categorized using training-only terciles. Inputs use past observations, and target windows crossing partition boundaries are purged. Original labels were preserved; the new task was not silently substituted for them.

The evaluation compared runtime and threshold rules, naive Bayes, kNN, logistic regression, and gradient boosting. It included class distributions, confusion matrices, per-class metrics, macro-F1, balanced accuracy, HIGH recall, validation threshold sensitivity, and bootstrap uncertainty. Rejected classifier configurations remained visible in supplementary diagnostics.

There were 187 training, 187 validation, and 247 test examples. The selected runtime change retained the 30-entry CV window and revised the lower threshold from 0.35 to 0.45; the upper threshold remained 0.75. The runtime was also prevented from silently loading an incompatible legacy seven-day calibration artifact.

| Same-target test metric | Historical CV30 rule, 0.35/0.75 | Revised CV30 rule, 0.45/0.75 |
|---|---:|---:|
| Macro-F1 | 0.324358 | 0.603309 |
| Balanced accuracy | 0.445479 | 0.621610 |
| HIGH recall | 0.720000 | 0.720000 |
| HIGH examples missed | 14 of 50 | 14 of 50 |
| HIGH predicted LOW | 0 | 2 |

The macro-F1 gain is 0.278952, or 86.001% relative to the comparator. Its paired 95% whole-platform bootstrap interval is [0.013404, 0.338032], using 5,000 draws across five fixed bootstrap seeds.

**Interpretation:** This is a measured classification improvement on the documented forward target. It is not a HIGH-recall improvement, a recovered original-label result, or proof of improved real-world financial safety. The all-zero-income LOW-label defect also remains.

**Evidence:** [PROVENANCE.md](PROVENANCE.md), [volatility change log](CHANGES_volatility.md), [deployment comparison](revision_audit/final_volatility/volatility_deployment.json).

## 6. Decision router: explicit policy and fail-closed checks

The earlier router allowed investing with one month of liquidity and debt up to twice monthly expenses, and did not adequately reject unknown/malformed analytics. The revised router requires every mandatory condition to pass.

| Policy/input check | Revised behavior |
|---|---|
| Liquidity | Bank balance at least three months of expenses |
| Debt | Debt at most half one month's expenses |
| Health | Score at least 70, within range, with a matching phase |
| Volatility | Only known LOW or MEDIUM accepted |
| Financial values | Finite numeric inputs, nonnegative balance/debt, positive expenses |
| Analytics | Available, structurally valid, error-free, and ready when a status is supplied |
| Forecast | Recognized method, valid horizon/count, consecutive dates, finite nonnegative points, and positive income support |
| CV features | Enough entries, positive mean, valid standard deviation/CV, and internal numerical consistency |

Tests cover combinations of violations, exact thresholds, sub-rupee boundaries, missing/malformed requests, failed analytics, and forged/stale cached permissions. The investment path rechecks eligibility with the current profile rather than trusting a stored allowed flag.

On the same 1,914-case conservative-policy fixture set:

| Metric | Earlier implementation | Revised implementation |
|---|---:|---:|
| True allows | 54 | 54 |
| False allows | 367 | 0 |
| True blocks | 1,493 | 1,860 |
| False blocks | 0 | 0 |
| Unhandled exceptions | 6 | 0 |
| Allow precision | 0.128266 | 1.000000 |
| Allow recall | 1.000000 | 1.000000 |

Exception counts are reported separately by the harness, not added as independent cases to the confusion matrix. The oracle encodes the intended conservative policy. Perfect agreement demonstrates implementation consistency on these inputs, not independent financial safety validation. Structural validation does not establish analytics freshness or agreement with underlying records.

**Evidence:** [router source](server/services/decisionRouterService.js), [router tests](server/tests/routerSafety.test.cjs), [fixture results](revision_audit/final_20261018/legacy/router_results.json).

## 7. Financial outcome simulation and policy ablations

### Work completed

A reproducible cash-flow simulator was added to evaluate outcomes beyond agreement with the router's own policy. It combines seven-day income block bootstrap from permitted chronological donor partitions with declared income regimes, expenses, debt service, arrears, medical/vehicle-repair shocks, and assumed investment returns.

Held-out evaluation follows 10,000 households per seed across five household seeds: **50,000 unique households over 12 months**. The same households and random events are paired across policies. Central, stress, and neutral scenarios are separate, as are the existing engine budget and a reserve-free diagnostic budget. Repeated policies, scenarios, and assignment seeds are not additional independent households.

Comparators include always investing, the original gate, the revised gate, score-only readiness, and no investing. Validation threshold sweeps vary liquidity from one to six months and debt from 0.25 to twice monthly expenses. Later ablations remove or isolate components and compare monthly-clearance-matched savings and random policies.

### Selected central-scenario findings

These results use the **engine budget** and are **simulation-based**, not observed worker outcomes.

| Policy | Forced-liquidation rate |
|---|---:|
| Original gate | 3.394% |
| Full revised gate | 1.132% |
| Monthly-clearance-matched savings ranking | 0.698% |
| Monthly-clearance-matched random selection | 2.126% |

The revised gate lowers forced liquidation relative to the original gate in this setting, but the savings-ranked comparator performs better. Revised-gate mean final wealth is ₹52,052.456382 versus ₹52,075.121159 for the original gate: a difference of **−₹22.664778**, not an improvement in wealth.

Removing the health-score gate produces identical full-gate outcomes across the measured scenario/budget combinations. The evidence therefore does not establish an incremental benefit from that component. Matching monthly clearance also does not match which households ultimately invest.

The simulator documents trade-offs conditional on its assumptions. It does not demonstrate optimal real-world thresholds, realistic event frequencies for the population, investment profitability, or elimination of financial shortfall.

**Evidence:** [simulation protocol](router_sim/PROTOCOL.md), [router change log](CHANGES_router.md), [ablation change log](CHANGES_ablations.md), [ablation results](ablation_results.json).

## 8. Financial-health score: sensitivity and outcome validation

The original 30/25/20/15/10 weights were examined through synthetic combinations, one-factor interventions, component removal/perturbation, phase distributions, and outcome prediction. A separate six-month no-investing shortfall outcome was used so validation did not merely reconstruct the score/router oracle.

Train, validation, and test each contain 50,000 simulated households. A corrected hand-designed scalar changed debt normalization and added income sufficiency. Calibrated scalar models and learned factor-based risk predictors were evaluated separately. The latter are diagnostic risk models, not replacements for the 0–100 score or phase thresholds.

Selected final held-out results after the volatility revision:

| Predictor | AUC | Brier score |
|---|---:|---:|
| Original scalar with fitted probability calibration | 0.828172 | 0.099471 |
| Corrected scalar with fitted probability calibration | 0.764614 | 0.112192 |
| Learned corrected-factor risk predictor | 0.890767 | 0.080079 |

The corrected hand scalar did not pass the adoption guard and was not deployed. The original weights remain engineering choices, not empirically optimal weights.

Monotonicity testing exposed an important defect: increasing reported expenses by 10%, with other inputs fixed, increased the original score in 20,312 of 50,000 training profiles in the earlier score audit. A candidate eliminated that directional defect in its evaluated formulation, but worse outcome discrimination prevented adoption.

The volatility threshold revision also worsened the original calibrated score's held-out AUC from 0.832602 to 0.828172 and Brier from 0.097646 to 0.099471. This downstream negative result was recorded rather than hidden behind the classifier's macro-F1 gain.

**Evidence:** [health change log](CHANGES_score.md), [selection decision](score_decision.md), [final test metrics](revision_audit/final_20261018/score/test_metrics.csv).

## 9. Investment engine: quantitative constraints and allocation fixes

The 37-product catalogue was evaluated over a deterministic grid of 1,728 financial profiles varying income, savings, debt, volatility, risk preference, and forecast trend. There were 216 eligible profiles in the controlled valid-input grid. Filtering counts, risk/ranking behavior, recommendation overlap, allocation minimums, budget conservation, and percentage sums were recorded.

The allocation implementation was corrected to preserve product minimums, allocate integer rupees using stable largest-remainder rounding, drop infeasible low-ranked products, redistribute the available budget, and calculate displayed percentages from actual allocations. Ranking alternatives used the same filters and corrected allocator for fair constraint comparisons.

| Synthetic-grid measure | Original allocator | Revised allocator |
|---|---:|---:|
| Profiles | 1,728 | 1,728 |
| Eligible profiles | 216 | 216 |
| Product allocations | 1,080 | 792 |
| Below-minimum allocations | 312 | 0 |
| Profiles with percentages not summing to 100 | 120 | 0 |
| Hard-filter violations | 0 | 0 |
| Budget violations | 0 | 0 |

The lower allocation count reflects dropping infeasible products rather than allocating nominally across too many products. Ranking disagreement with equal-weight/risk-only alternatives was measured, but no suitability ground truth establishes that the proposed ranking is superior. Product return projections remain catalogue-based assumptions, not backtested profitability.

**Evidence:** [engine/explanation change log](CHANGES_engine_llm.md), [engine summary](revision_audit/final_20261018/engine/engine_summary.csv).

## 10. Explanation layer: numerical validation and fallback evaluation

The explanation path was changed from permissive generated content to a snapshot-bound contract. The provider selects an approved template and returns exact typed snapshot facts; the backend validates them and renders the public explanation. Extra fields, changed values, invented products, altered decisions, and unauthorized prose are rejected. The JSON transport pins the model/configuration and exposes a timeout boundary.

Controlled evaluation used 125 synthetic snapshots. Before the fix, each of three corruption families—score 999, invented product, and wrong contextual number—was accepted in all 125 cases. The revised validator rejected **375/375** of those corruptions while accepting **125/125** valid responses. Separate mocked orchestration exercised 625 cases, including injected transport timeouts, malformed schema, altered facts, and unauthorized prose, to verify fallback and snapshot preservation.

The final live run measured:

| Live measurement | Result |
|---|---:|
| Requests | 125 |
| Successful provider responses | 108 |
| HTTP-429 failures handled by fallback | 17 |
| Live timeouts | 0 |
| Successful responses passing schema and numerical checks | 108/108 |
| Mean latency, all requests | 389.617 ms |
| p95 latency, all requests | 602.054 ms |

Latency includes network/provider processing and failed requests, but excludes artificial request spacing. Earlier runs had different success/fallback counts; the final live numbers are run-dependent observations, not a deterministic improvement over those runs.

The strict contract deliberately limits creative output. It supports numerical fidelity within approved templates, not validated free-form explanation quality, user comprehension, or decision utility. The separate chat service does not have this validator/fallback guarantee. Snapshot-construction or database failures can also occur outside the provider fallback boundary.

**Evidence:** [explanation test cases](server/tests/engineExplanation.test.cjs), [controlled results](revision_audit/final_20261018/engine/controlled_summary.csv), [live results](revision_audit/final_20261018/engine/live_summary.csv).

## 11. Dataset credibility and transfer checks

The data audit documented 16 original CSVs: 11 normal files with 1,380 rows and five derived volatility files with 600 rows. Overlapping files were not treated as independent workers. Canonicalization for a separate evaluation retained one whole history per platform, producing 660 rows and excluding 720 normal rows. It identified 600 repeated platform/date key groups, 587 with conflicting incomes; these are not simply identical duplicates to delete silently.

A new, explicitly hypothetical generator produced 4,500 rows across five seeds and five platform scenarios. It was not described as a recovered original generator. A separate attributed public single-driver dataset provided 4,270 trips aggregated into 626 calendar days, including 265 zero-filled days. Its USD units and licensing were kept separate from the development data and Indian-rupee simulation assumptions.

Transfer tests reported negative outcomes: the selected forecast blend did not establish a general improvement on the new generator, and the single-driver case did not support broad generalization. The original income generator, original label definition, seeds, collection process, and claimed external-data linkage remain unverified.

**Evidence:** [data audit](CHANGES_data.md), [provenance investigation](PROVENANCE.md), [real-data notice](data_audit/results_20261017/REAL_DATA_NOTICE.md).

## 12. Automated testing, final replay, and paper-facing outputs

Automated checks were added for forecasting, volatility, score properties, router boundaries/failure inputs, investment filtering/allocation, explanation validation/fallback, simulator accounting, artifact consistency, and deployment guards. The backend uses Node's built-in test runner; research checks use Python unittest and artifact-specific validators.

The following totals refer to different recorded stages, not a before/after test execution at the two Git commits:

| Recorded stage | Total tests | Passed | Failed | Errors | Skipped |
|---|---:|---:|---:|---:|---:|
| Captured mid-work baseline replay | 130 | 126 | 4 | 0 | 0 |
| Final consolidated research replay | 142 | 138 | 4 | 0 | 0 |

The additional 12 revision tests passed. The four retained failures concerned all-zero volatility, income-insensitive health scoring, a legacy permissive-router truth table with incomplete fixtures, and forecast-direction wording in deterministic fallback. The legacy router mismatch is distinct from current conservative-policy false blocks; it was not silently relabeled as a pass.

The full final replay refit forecasting candidates into fresh caches and reran the existing experiment families. All 78 aggregate ablation rows reproduced exactly. Verification independently checked 665 count-derived percentages and 18 interval fractions.

The final exports include [results_for_paper.json](results_for_paper.json), [changes_summary.md](changes_summary.md), [paper_table_updates.tex](paper_table_updates.tex), and [ablation_table.tex](ablation_table.tex). Proposed paper-table numbering is distinguished from the original manuscript's numbering. LaTeX snippets received structural checks, not standalone rendering.

A consistency failure remains explicit: preserved older narrative quotes a wealth difference of −₹21.218565, whereas the final comparison is −₹22.664778. The current export uses the latter; the original paper and historical report were not overwritten to conceal the discrepancy.

Performance tooling separated local computation from provider latency. A preserved baseline pipeline measurement had a maximum above two milliseconds, so an unconditional “every call is below two milliseconds” claim was not retained.

## 13. Source and documentation changes

Most of the work lives in new research/evaluation directories rather than UI code. Existing-file changes in the substantive commit comparison were:

| File / area | Change |
|---|---|
| `ml_service/modules/volatility.py` | Deployed validation-selected CV thresholds; isolated runtime behavior from incompatible legacy artifacts |
| `server/services/decisionRouterService.js` | Explicit conservative policy, input/analytics validation, fail-closed routing |
| `server/services/investmentEngineService.js` | Eligibility revalidation, minimum-aware integer allocation, percentage conservation |
| `server/controllers/investmentController.js` | Current-profile recommendation read path rather than trusting persisted permissions |
| `server/services/aiExplanationService.js` | Snapshot-bound facts, approved templates, semantic rejection and fallback |
| `server/services/groqService.js` | Pinned structured-response transport, request settings, optional seeds and timeout behavior |
| `server/package.json` | Automated backend test command |
| `README.md`, `README2.md`, `localrun_steps.md` | Current overview and redirects to maintained references |

The deployed forecasting implementation and production health-score formulation were not replaced. No frontend implementation file changed within `db3fc1d → 6eeab72`.

New documentation includes [STARTUP.md](STARTUP.md), architecture/API/development/research references under [docs/](docs), experiment protocols, detailed `CHANGES_*.md` records, provenance, and paper-oriented reports. Startup instructions were corrected to match actual configuration, route behavior, service boundaries, and distinct explanation/chat failure behavior.

The publication added scoped `.gitattributes` rules so byte-hashed research artifacts are not changed by automatic line-ending conversion. Reviewed research execution logs were included despite the generic log ignore rule. Credentials, virtual environments, dependency directories, and builds were excluded.

## 14. What this work supports—and what it does not

The defensible contribution is an **auditable decision-support pipeline with substantially stronger empirical evaluation**: explicit engineering policy, better-defined predictive targets, quantitative constraints, controlled failure handling, paired simulation comparisons, and traceable negative findings.

It supports a target-specific macro-F1 improvement, correct enforcement of the stated readiness policy on evaluated fixtures, improved allocation feasibility on the tested grid, and numerical fidelity of constrained explanations. It also documents conditional financial-outcome trade-offs under stated simulation assumptions.

It does **not** establish superior forecasting in general, optimal health weights, uniquely superior financial routing, real-world safety or suitability, profitable investments, population-representative data, or improved user understanding. Several experiments were useful precisely because they showed that an initially attractive claim was not supported.

## 15. How to inspect and reproduce the evidence

To inspect the historical source scope without changing files:

```powershell
git show --no-patch --format=fuller db3fc1d
git show --no-patch --format=fuller 6eeab72
git diff --shortstat db3fc1d 6eeab72
git diff --name-only --diff-filter=M db3fc1d 6eeab72
git diff db3fc1d 6eeab72 -- ml_service server
```

For exact executed experiment commands, environments, and exit codes, use [final commands.json](revision_audit/final_20261018/commands.json), [legacy commands.json](revision_audit/final_20261018/legacy/commands.json), the per-task change logs, and [the development/reproduction guide](docs/DEVELOPMENT.md).

Do not rerun fixed-output orchestrators directly into occupied archives. Use fresh output paths consistently across runners/export/verification. Live API outcomes and timing need not repeat exactly; some numerical replays also depend on recorded thread/environment settings. The recorded source snapshots and manifests are necessary because the research baseline was captured from a dirty working tree.

This report adds a presentation-oriented account of existing work; it does not modify the manuscript, reclassify failed experiments, or introduce new research results.
