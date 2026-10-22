# PAPER METRICS AUDIT

Date: 2026-10-15 (Asia/Calcutta). Repository: Adaptive Finance / Finspire. This audit preserves and replays the original implementation, fixes conservative-policy routing, and benchmarks small statistical alternatives without changing the paper, datasets, health-score weights or LLM layer. All numeric results below come from executed code and retained JSON/logs. No API calls, database writes, new package installations, random dataset generation, expensive training or external financial performance claims were used in this audit.

## 1. Outcome and baseline reproduction

**Production-source changes in this checkout are router safety and recommendation access-path enforcement. Forecasting and volatility alternatives remain evaluation-only. No deployment was performed.** A validation-selected forecasting candidate improved both test errors, but failed the predeclared validation deployment gate. The selected volatility classifier improved original-label agreement but has unresolved target semantics and worse high-class recall. Neither result justifies silently promoting a new financial-risk model.

“Test” means excluded from configuration selection in this new run. These same synthetic CSVs were previously examined in the earlier audit. This is a retrospective, temporally separated benchmark, not previously unseen external confirmation. The protocol was written before the new validation/test runs; selection files were saved and fingerprinted before test scoring. All candidates are reported, including failures and test candidates better than the selected one.

| Primary comparison | Original on same new evaluation | Revised / selected on same evaluation | Status |
| --- | --- | --- | --- |
| Router false allows, combined policy fixtures | 367 | 0 | Production logic fixed; synthetic policy conformance only |
| Forecast pooled MAE (Rs/day) | 581.82 | 512.04 | Validation-selected experimental blend; not deployed |
| Forecast pooled RMSE (Rs/day) | 820.59 | 769.80 | Same test windows; not deployed |
| Original-label volatility macro-F1 | 0.2368 | 0.5636 | Validation-selected experimental classifier; not deployed |
| Original-label balanced accuracy | 0.3097 | 0.5715 | Not externally annotated risk accuracy |

Base Git commit: `db3fc1d56a8f38042a91e21ec6164ac8be0dfe40`. Initial tracked working tree was clean; pre-existing untracked `amend_test.md` and `research_eval/` were preserved. Before changes, `reproduce_baseline.py` ran the original evaluators, captured source snapshots and fresh result logs under `paper_audit/baseline/`, and restored the prior audit result files byte-for-byte. It refuses to overwrite an existing captured baseline. `replay_baseline.py` subsequently re-executed the archived forecast/volatility modules against the same data and asserted numeric agreement with the captured baseline.

| Historical evaluation (unchanged definition) | Samples | Windows | MAE | RMSE |
| --- | --- | --- | --- | --- |
| historical_mean | 720 | 48 | 529.52 | 791.63 |
| moving_average_14 | 720 | 48 | 547.46 | 815.73 |
| seasonal_naive_7 | 720 | 48 | 705.45 | 1074.86 |
| proposed | 720 | 48 | 575.65 | 847.26 |

The historical volatility result also reproduced: 162/455 = 35.60% agreement with `volatility_label`. The historical router test yielded 243 false allows on its older conservative oracle, which still allowed unknown volatility. The new fixed oracle additionally excludes unknown volatility, so its original-code count is 270 on the same-sized complete grid. These counts must not be presented as one directly comparable policy result. New before/after comparisons always use the identical new oracle and identical fixtures.

Environment: Windows-10-10.0.22631-SP0; observed Windows 11 build 22631 on Intel Core i5-12500H. Python: `3.11.9 (tags/v3.11.9:de54cf5, Apr  2 2024, 10:12:12) [MSC v.1938 64 bit (AMD64)]`. Node: `v22.18.0`. All new experiments use Python/Node standard libraries, with existing Mongoose imports for service tests and in-memory database adapters. Existing NumPy is available in the ML virtual environment, but SciPy, statsmodels and scikit-learn were absent in the inspected runtimes. No dependency was added. Full likelihood-fitted ARIMA or packaged ETS was not completed; explicit SES, damped Holt and OLS AR(1) baselines were completed instead. These implementations and initialization rules are documented below, rather than attributed to an uninstalled library.

## 2. Dataset provenance, versions, splits and seeds

The shipped files are synthetic gig-income series. The inspected repository contains demo database seed scripts (`server/seed.js`, `seed_user.js`, `seed_profiles.js`, `seed_vijay.js`) using unseeded `Math.random()`. Those scripts do not establish the exact generator or seed for the shipped income/label CSVs. Some demo scripts omit zero-income days; they were not run, and their generated histories must not be conflated with the daily CSVs. No source script for the original `volatility_label` column was located. Therefore file checksums, not a guessed generation seed, define reproducibility.

The eleven `data/normal/*.csv` files contain 1,380 physical income rows: ten 120-day platform/condition series plus a 180-day gig_income_data series. Five feature-engineered volatility files add 600 physical rows but duplicate the respective platform `_volatile.csv` income sequences; they are not additional independent histories. There are five case-normalized platforms (Blinkit, Snabbit, Swiggy, Uber, Zomato), not ten independent platforms. No worker identifiers or independent financial outcome labels exist. All new predictive comparisons use raw incomes; no synthetic samples were added. Units are the repository income units, interpreted as Rs/day as in the paper.

| File | Rows | First date | Last date | SHA-256 |
| --- | --- | --- | --- | --- |
| data/normal/blinkit_stable.csv | 120 | 2024-01-01 | 2024-04-29 | 95075157d64b690a682b25c3194bfc6b245b98e56dc1511a2ae8710efaceb3bf |
| data/normal/blinkit_volatile.csv | 120 | 2024-01-01 | 2024-04-29 | d97bb544b0e732da06c2c717a76ab32b345951473ed940b335605dab2fe1b781 |
| data/normal/gig_income_data.csv | 180 | 2024-01-01 | 2024-06-28 | f5f522984470a5baa298b079a6c8e3cd23a426843cc55a5a38239d8fb999f4e2 |
| data/normal/snabbit_stable.csv | 120 | 2024-01-01 | 2024-04-29 | fb9103061e2e08753d57b7b22f51b7c84c6fb780247c91af7a9df82cea359d14 |
| data/normal/snabbit_volatile.csv | 120 | 2024-01-01 | 2024-04-29 | 868b061b89046d2b0a9524ec5c8ca0b65e0efa377b98e4f63bc7b1a5618b9279 |
| data/normal/swiggy_stable.csv | 120 | 2024-01-01 | 2024-04-29 | 0cd7fb42993e63ccc6f94b17b1d00c643d80736b93e2a5809b8e8ac882a39ead |
| data/normal/swiggy_volatile.csv | 120 | 2024-01-01 | 2024-04-29 | 8eba5deff8201b930fbdcf6863ac8e37dca7bbb15f0e4a888e264ab703f5ba93 |
| data/normal/uber_stable.csv | 120 | 2024-01-01 | 2024-04-29 | 4357937b41d426019db525fe340e1a0956c2cb24ad922ad54bf1fc7cc6313800 |
| data/normal/uber_volatile.csv | 120 | 2024-01-01 | 2024-04-29 | 835ec36f74424b9045b46ad7911453f51a82cf5f45e3fef89a828628ceb899cb |
| data/normal/zomato_stable.csv | 120 | 2024-01-01 | 2024-04-29 | 895b12284ab1de813f52f5ca8a2ddb43905428d3230453c997bf45185028ee26 |
| data/normal/zomato_volatile.csv | 120 | 2024-01-01 | 2024-04-29 | b5033d93d454eb911a131cd579c4b6fe81cef943c6da0e2a5cee28cd982aab66 |
| data/volatility/blinkit_with_volatility_label.csv | 120 | 2024-01-01 | 2024-04-29 | 3a24b155a9d4f0a7f75c3ca2cc413ea9e0472fc762d40201719d8d86417fa1b8 |
| data/volatility/snabbit_with_volatility_label.csv | 120 | 2024-01-01 | 2024-04-29 | 4c81a73fc22192e3d8513f3392b68748619dfbf6b51f70ae95ad910618367588 |
| data/volatility/swiggy_with_volatility_label.csv | 120 | 2024-01-01 | 2024-04-29 | 90faf868a0fb24e2bc620b9fedadd0e8997e4e29681f0ca4fa2f8143e3ab673b |
| data/volatility/uber_with_volatility_label.csv | 120 | 2024-01-01 | 2024-04-29 | 926e39a793d130a75cb218152563b8ef2b481efe922338aca73eb600d91b906c |
| data/volatility/zomato_with_volatility_label.csv | 120 | 2024-01-01 | 2024-04-29 | 7d312d164c32e66e3f155e9c0e48040ba8f8d367ba95284238d0e5c05a0b5493 |

All recorded dates are unique and daily contiguous within each file. Forecasting does not double-count derived volatility files. Volatility modeling uses only the five labeled files, with each file kept as its own chronological history. No file identity/platform variable enters classification features. Nevertheless synthetic generation assumptions and overlap/correlation across platforms can limit effective sample independence.

| Task / partition | Origins / indices within each file | Total evaluated rows / targets | Procedure |
| --- | --- | --- | --- |
| Forecast validation | n-60 and n-45; horizon=15 | 330 | Expanding prefixes; 22 windows, no overlapping targets |
| Forecast test | n-30 and n-15; horizon=15 | 330 | Fixed selected configuration; 22 nonoverlapping windows |
| Volatility training | zero-based 29..59 | 155 | At least 30 observed incomes; excludes warmup |
| Volatility validation | 60..89 | 150 | Same-day label, features use current/past incomes |
| Volatility final refit | 29..89 | 305 | Refit selected configuration and each fixed comparator |
| Volatility test | 90..119 | 150 | No model/configuration selection on these labels |

Forecast validation starts after 60 observed days in a 120-day file and after 120 days in the 180-day file. Test starts after 90 or 150 observed days respectively. Later rolling origins incorporate outcomes already observed by that origin, as in operational rolling forecasting; hyperparameters remain fixed. It would be misleading to describe each forecast as using only the initial prefix or to claim that the historical 720-target baseline and new 330-target benchmark are the same evaluation. Original-versus-selected error deltas below are computed exclusively on the same new 330 targets.

Random seeds: **not applicable**. All new estimators, candidate ordering, tie breaks, thresholds, splits and synthetic policy fixtures are deterministic. No bootstrap confidence interval, significance test, random search, shuffled cross-validation or random train/test split was used. The original CSV generation seed is **unknown**, not invented. Old synthetic fixtures and current data were already examined; the temporal split does not erase that prior exposure.

Label definitions: `volatility_label` is the primary, original provided label with unresolved generation semantics. `volatility_label_stat` is a separate, CV-derived label used only for explicit reconstruction diagnostics. Neither is independent real-world risk truth. Features never include either label, precomputed rolling columns, file identity, or future income. The contemporaneous classifier sees today's income and must not be described as predicting future volatility.

| Partition | Target column | Low | Medium | High |
| --- | --- | --- | --- | --- |
| train | original | 41 | 59 | 55 |
| train | stat | 0 | 27 | 128 |
| validation | original | 40 | 61 | 49 |
| validation | stat | 7 | 39 | 104 |
| refit | original | 81 | 120 | 104 |
| refit | stat | 7 | 66 | 232 |
| test | original | 41 | 71 | 38 |
| test | stat | 7 | 30 | 113 |

## 3. Conservative decision-router safety

### Oracle and material behavior changes

Positive means **policy permission to invest**, not a favorable financial outcome. The policy is an explicit engineering choice: balance >= 3 times monthly expenses; debt <= 0.5 times expenses; finite score in [70,100] with its matching phase; known low/medium volatility; and usable analytics. User balance/debt must be finite nonnegative numeric values, expenses finite positive. Missing values, numeric strings, booleans, NaN/infinities and malformed objects are rejected instead of coerced into apparently safe values.

Usable analytics require: missing status only for fresh ML-shaped responses, or supplied status exactly ready; no supplied error; volatility features with integer entryCount >=3, positive finite average income and finite nonnegative SD/CV; agreement of rounded SD/mean with CV within 0.005; forecast integer horizon 1..30, exactly that many points, recognized method, valid consecutive ISO dates, finite nonnegative per-point and aggregate income, and at least one positive forecast income. High and unknown volatility both block. A recognized status does not by itself bypass these checks. Health phases must match the existing score thresholds; missing/inconsistent phases block.

The prior 1-month liquidity/2-month debt permission thresholds were replaced with the stated conservative thresholds, aligning investment permission with the emergency/debt advisory boundaries. Every mandatory check must pass. Rejections carry explicit blocker reasons. `buildInvestmentSuggestion` recomputes policy permission with the current profile and stored analytics rather than trusting a stored router flag. Blocked suggestions expose no allocation and report investableAmount=0. The investment GET endpoint now reads current user/history/analytics and rebuilds recommendations without writing the database or returning an old permitted cache directly. The refresh endpoint reuses this read/build path and retains its existing persistence behavior.

This patch does not change health weights, product filtering/ranking, financial projections or LLM prompting. The stricter method/schema requirements may intentionally reject legacy incomplete analytics; recompute analytics after deploying the patch. No historical caches were migrated or database writes performed during testing.

### Evaluation and metrics

The independent complete-input grid enumerates liquidity months [0, .99, 1, 1.01, 2.99, 3, 3.01, 6], debt/expense ratios [0, .49, .5, .51, 1.99, 2, 2.01, 3], health scores [0,39,60,69,70,71,100] and volatility [low,medium,high,unknown]. All complete fixtures contain coherent dates, features and phases. Monthly expenses are 20000. Expected permission is computed from the documented thresholds and known label membership, independently of production helpers. The invalid-input matrix starts from a valid safe fixture and changes one field to a specifically invalid value, adds missing structures, invalid dates, inconsistent CV, all-zero forecasts, overflow totals, and error statuses. Both implementations receive identical fixtures. Under old code an exception is recorded separately and treated as no permission returned in the binary confusion table; it is still an operational failure, not a successful response.

| Set | Version | N | TP | FP / false allows | FN / false blocks | TN | Precision | Recall | Accuracy | Exceptions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| boundary_grid | original | 1792 | 54 | 270 | 0 | 1468 | 0.1667 | 1.0000 | 0.8493 | 0 |
| boundary_grid | revised | 1792 | 54 | 0 | 0 | 1738 | 1.0000 | 1.0000 | 1.0000 | 0 |
| invalid_inputs | original | 122 | 0 | 97 | 0 | 25 | 0.0000 | N/A | 0.2049 | 6 |
| invalid_inputs | revised | 122 | 0 | 0 | 0 | 122 | N/A | N/A | 1.0000 | 0 |
| combined | original | 1914 | 54 | 367 | 0 | 1493 | 0.1283 | 1.0000 | 0.8083 | 6 |
| combined | revised | 1914 | 54 | 0 | 0 | 1860 | 1.0000 | 1.0000 | 1.0000 | 0 |

| Combined-set metric | Original | Revised | Absolute change | Relative change |
| --- | --- | --- | --- | --- |
| false_allow | 367.0000 | 0.0000 | -367.0000 | -100.00% |
| false_block | 0.0000 | 0.0000 | 0.0000 | N/A (zero baseline) |
| precision | 0.1283 | 1.0000 | 0.8717 | 679.63% |
| recall | 1.0000 | 1.0000 | 0.0000 | 0.00% |
| accuracy | 0.8083 | 1.0000 | 0.1917 | 23.72% |
| exceptions | 6.0000 | 0.0000 | -6.0000 | -100.00% |

Confusion matrices below use actual rows [policy block, policy allow] and predicted columns [block, allow]:

| Version | Actual block row | Actual allow row |
| --- | --- | --- |
| original | [1493, 367] | [0, 54] |
| revised | [1860, 0] | [0, 54] |

Threshold equality at liquidity=3, debt=.5, score=70 and medium volatility is allowed. A .01 currency-unit reduction below the liquidity boundary, .01 debt increase above its boundary, or score=69 blocks; high/unknown labels and missing/error analytics block even at score=80. The engine test exercises every expected-block fixture despite a forged cached allowed flag, and a separate controller test rejects cached permission after the current profile has become high-debt. The integration suite forwards actual unchanged Python outputs and health scores from constant, zero-income, high-volatility, insufficient-history and eleven existing-data fixtures through the revised router/engine.

### Interpretation and remaining defects

The zero false-allow/false-block result establishes conformance on the enumerated policy fixtures and preservation of the policy-eligible cases. It does not validate the financial correctness of the policy thresholds, health weights or volatility categories. It is not proof over arbitrary inputs, real people, or financial outcomes. Class balance is artificial, and precision/recall are oracle metrics, not estimates of deployment suitability.

Analytics checks are structural/numeric, not an independent recomputation of labels or proof of authenticity. Timestamp freshness, snapshot/profile versioning, agreement with raw source income, concurrent read consistency and transactional safety remain unverified. Cached dashboard analytics/explanations are not migrated and can still display historical decisions until refreshed; the investment endpoint rechecks access but this is not complete UI/state consistency validation. Unknown future model method names deliberately block until explicitly supported. The engineered CV rounding tolerance is not a learned calibration parameter.

## 4. Income forecasting experiment

### Candidate definitions and selection

Candidate family and order were frozen in `PROTOCOL.md`: existing trend/weekday forecast; mean over the complete training prefix; moving means over 7/14/30/60 observations; seven-day seasonal naive repeating the last observed week; SES with alpha .05/.1/.2/.4/.6/.8; damped Holt with alpha .1/.3, beta .05/.2 and damping .9/.98; OLS AR(1), intercept included, coefficient clipped to [-.98,.98] and recursively forecast; and blends of historical mean/median with median weights .25/.5/.75/1. All predictions are nonnegative and currency-rounded to two decimals. SES starts from the first observed income. Holt starts from first income and zero trend; standard additive level/trend updates and summed damped trend are implemented explicitly. AR(1) is a lightweight conditional least-squares comparator, not a claim to full likelihood-fitted ARIMA.

At each origin, all states/statistics are fitted only to the available prefix. No learned cross-series model or feature selection is used. The one global configuration minimizes validation pooled MAE divided by validation mean-baseline MAE plus validation pooled RMSE divided by validation mean-baseline RMSE, with candidate-order tie breaking. Validation errors are pooled over equal-sized windows. The selected configuration file is written before test scoring and its SHA-256 is embedded in the test result. Test values do not change the selection or deployment gate.

Selected candidate: `mean_median_0.75` = 0.25 x prefix mean + 0.75 x prefix median. Validation deployment gate requires improvement over both historical mean and original on **both** MAE and RMSE. Gate passed: **False**. The selected candidate's validation RMSE exceeds historical mean, so production `forecast_income` is unchanged despite the favorable later test result. This is an explicit failed deployment criterion, not a tuned-away failure.

| Candidate | Validation MAE | Validation RMSE | Test MAE | Test RMSE |
| --- | --- | --- | --- | --- |
| original | 621.35 | 930.52 | 581.82 | 820.59 |
| historical_mean | 571.36 | 859.35 | 532.99 | 776.60 |
| ma_7 | 604.80 | 904.52 | 576.18 | 830.46 |
| ma_14 | 577.98 | 868.95 | 562.78 | 818.63 |
| ma_30 | 571.51 | 873.17 | 533.57 | 780.12 |
| ma_60 | 574.52 | 862.29 | 530.60 | 778.99 |
| seasonal_naive_7 | 749.96 | 1165.66 | 715.70 | 1055.36 |
| ses_0.05 | 578.46 | 869.31 | 537.57 | 786.00 |
| ses_0.1 | 581.70 | 873.68 | 550.88 | 804.29 |
| ses_0.2 | 602.25 | 896.26 | 592.16 | 854.44 |
| ses_0.4 | 647.55 | 951.78 | 707.55 | 1017.00 |
| ses_0.6 | 692.65 | 1010.27 | 851.62 | 1244.03 |
| ses_0.8 | 746.87 | 1083.20 | 1005.55 | 1508.57 |
| holt_0.1_0.05_0.9 | 588.26 | 879.04 | 563.40 | 817.93 |
| holt_0.1_0.05_0.98 | 594.53 | 884.57 | 579.42 | 836.15 |
| holt_0.1_0.2_0.9 | 614.08 | 902.22 | 604.77 | 860.77 |
| holt_0.1_0.2_0.98 | 652.35 | 925.33 | 670.42 | 940.46 |
| holt_0.3_0.05_0.9 | 652.30 | 952.72 | 691.38 | 984.90 |
| holt_0.3_0.05_0.98 | 667.86 | 967.03 | 721.35 | 1024.49 |
| holt_0.3_0.2_0.9 | 739.08 | 1050.91 | 856.43 | 1223.22 |
| holt_0.3_0.2_0.98 | 808.19 | 1121.09 | 983.77 | 1430.16 |
| ar1_ols | 570.02 | 860.60 | 531.56 | 775.81 |
| mean_median_0.25 | 566.37 | 860.29 | 524.34 | 772.71 |
| mean_median_0.5 | 562.87 | 862.47 | 517.74 | 770.44 |
| mean_median_0.75 | 560.53 | 865.87 | 512.04 | 769.80 |
| mean_median_1 | 559.75 | 870.49 | 507.84 | 770.81 |

| Reference on identical test targets | Metric | Reference | Selected experimental blend | Absolute change | Relative change |
| --- | --- | --- | --- | --- | --- |
| original | mae | 581.8168 | 512.0438 | -69.7730 | -11.99% |
| original | rmse | 820.5947 | 769.8049 | -50.7898 | -6.19% |
| historical_mean | mae | 532.9885 | 512.0438 | -20.9448 | -3.93% |
| historical_mean | rmse | 776.6021 | 769.8049 | -6.7972 | -0.88% |

Test totals: 22 windows, 330 evaluated target days, horizon and step 15. Pooled MAE is mean absolute daily error; pooled RMSE is square root of mean squared daily error. Across-window population SD: selected MAE 214.39, selected RMSE 324.98; historical mean MAE 207.73, historical mean RMSE 319.97. These descriptive SDs are not standard errors or confidence intervals.

Per-file pooled test results; each file contributes two windows and 30 targets:

| File | Original MAE | Original RMSE | Mean MAE | Mean RMSE | Selected MAE | Selected RMSE |
| --- | --- | --- | --- | --- | --- | --- |
| data/normal/blinkit_stable.csv | 678.00 | 859.90 | 599.83 | 761.94 | 559.56 | 762.20 |
| data/normal/blinkit_volatile.csv | 822.60 | 973.42 | 768.18 | 1014.84 | 781.92 | 1017.23 |
| data/normal/gig_income_data.csv | 360.31 | 433.59 | 360.68 | 445.00 | 364.56 | 453.13 |
| data/normal/snabbit_stable.csv | 241.84 | 302.87 | 237.56 | 295.33 | 207.38 | 291.46 |
| data/normal/snabbit_volatile.csv | 431.51 | 556.56 | 418.41 | 527.56 | 411.60 | 530.88 |
| data/normal/swiggy_stable.csv | 402.77 | 546.78 | 391.11 | 523.04 | 377.84 | 520.59 |
| data/normal/swiggy_volatile.csv | 845.07 | 1270.09 | 797.21 | 1262.33 | 800.54 | 1281.90 |
| data/normal/uber_stable.csv | 511.81 | 723.13 | 468.43 | 648.59 | 422.94 | 634.58 |
| data/normal/uber_volatile.csv | 804.62 | 1125.97 | 823.57 | 1146.61 | 806.09 | 1123.69 |
| data/normal/zomato_stable.csv | 433.77 | 578.01 | 369.01 | 480.63 | 344.20 | 470.19 |
| data/normal/zomato_volatile.csv | 867.70 | 1045.82 | 628.88 | 791.67 | 555.86 | 728.04 |

The selected blend beats historical mean by file-pooled MAE in 8 files and RMSE in 6 files. The modest pooled RMSE gain must be contextualized by mixed series-level results and the failed validation RMSE gate. No significance claim is made. SES, damped Holt, seasonal naive and AR(1) do not supply a uniformly superior method. The blend is a simple robust location estimate with a constant future daily forecast, not a novel temporal model or proof of accurately modeling irregular income.

Safe paper claim: “In a retrospective chronological benchmark, a validation-selected mean/median blend reduced pooled test MAE and RMSE compared with the unchanged trend/weekday forecast and historical mean. Validation RMSE did not improve over historical mean, so the evidence is preliminary and the production forecaster was retained.” Do not replace this with a general claim that forecasting superiority has been established.

## 5. Volatility label audit and classifier comparison

### Provenance audit

The production classifier still uses the latest 30 income entries, sample SD and default CV boundaries .35/.75, with a three-entry minimum. The optional threshold artifact is absent. The helper calibrates .33/.66 quantiles of a seven-entry CV column, which is neither the same window nor the same semantic labeling rule. No generator for the original label was found. On all 600 labeled rows, the original and statistical labels agree in 229 cases (38.17%).

A separate reconstruction using seven-entry sample CV and boundaries .30/.60 matches 600/600 statistical labels; maximum CV reconstruction discrepancy is 3.664e-14. On the new test suffix its accuracy/macro-F1 against the derived column is 1.0000/1.0000, but against the original column accuracy is 0.3600 and macro-F1 0.3259. Reconstruction is definition replication, not independent validation. This diagnostic does not enter primary model selection or silently replace the primary target.

### Models, training and all results

Inputs are mean, sample SD and CV over trailing 7/14/30 observed entries, trailing-30 zero-income fraction, and latest income divided by trailing-30 mean (11 features). They include today's income because this is current-state classification. All means/scales are estimated from training only; later test features may use past observed validation/test incomes but no past/future label values as predictors. An automated poisoning test confirms that changing the future test suffix cannot affect training/validation features or scores, and changing either label or stored rolling column cannot affect features.

Comparators: training-majority label; unchanged runtime classifier; window-7/14/30 quantile CV rules fitted to training-only order statistics; ordered low/medium/high CV threshold classifiers, optimizing training original-label macro-F1 over midpoints between adjacent distinct training CVs; standardized Gaussian naive Bayes with empirical class priors and variance smoothing 1e-6/.01/.1; standardized nearest centroids with uniform or inverse-frequency prediction priors; standardized Euclidean kNN with k=5/15/31 and stable row-order/class-order ties. Standardized features use training population SD with a 1e-9 floor. NB adds the stated smoothing constant to per-class standardized population variance. This is an explicit dependency-free implementation, not a claim of scikit-learn equivalence.

One global candidate is selected by validation original-label macro-F1, then balanced accuracy and declared order: `gaussian_nb_1e-06`. It is refit on training+validation before test predictions. Every fixed candidate is scored on the same test set for transparency; the selected method is not switched to a test winner. Macro-F1 averages per-class F1 over low/medium/high; balanced accuracy is mean per-class recall. Unsupported predictions have precision/F1 zero. All original-target classes are represented in every partition.

| Candidate | Validation original macro-F1 | Validation balanced accuracy | Test original macro-F1 | Test balanced accuracy | Test accuracy |
| --- | --- | --- | --- | --- | --- |
| original_30 | 0.3048 | 0.3882 | 0.2368 | 0.3097 | 0.3067 |
| majority | 0.1927 | 0.3333 | 0.2142 | 0.3333 | 0.4733 |
| quantile_7 | 0.5165 | 0.5357 | 0.4304 | 0.4488 | 0.4333 |
| quantile_14 | 0.4898 | 0.5266 | 0.4313 | 0.4465 | 0.4600 |
| quantile_30 | 0.3995 | 0.4748 | 0.3706 | 0.3956 | 0.3733 |
| supervised_cv_7 | 0.5170 | 0.5328 | 0.4347 | 0.4335 | 0.4800 |
| supervised_cv_14 | 0.5029 | 0.5325 | 0.4209 | 0.4303 | 0.4267 |
| supervised_cv_30 | 0.4179 | 0.4857 | 0.4264 | 0.4344 | 0.4333 |
| gaussian_nb_1e-06 | 0.5519 | 0.5684 | 0.5636 | 0.5715 | 0.5533 |
| gaussian_nb_0.01 | 0.5477 | 0.5645 | 0.5621 | 0.5674 | 0.5533 |
| gaussian_nb_0.1 | 0.5255 | 0.5443 | 0.5166 | 0.5270 | 0.5133 |
| centroid_uniform | 0.4320 | 0.4741 | 0.3865 | 0.4378 | 0.3933 |
| centroid_inverse_frequency | 0.4305 | 0.4866 | 0.3388 | 0.4252 | 0.3600 |
| knn_5 | 0.4634 | 0.4551 | 0.5287 | 0.5233 | 0.5200 |
| knn_15 | 0.5168 | 0.5219 | 0.5830 | 0.5827 | 0.5800 |
| knn_31 | 0.4869 | 0.4870 | 0.5928 | 0.5762 | 0.6067 |

| Reference on same original-label test | Metric | Reference | Selected NB | Absolute change | Relative change |
| --- | --- | --- | --- | --- | --- |
| original_30 | macro_f1 | 0.2368 | 0.5636 | 0.3268 | 137.97% |
| original_30 | balanced_accuracy | 0.3097 | 0.5715 | 0.2617 | 84.50% |
| original_30 | accuracy | 0.3067 | 0.5533 | 0.2467 | 80.43% |
| majority | macro_f1 | 0.2142 | 0.5636 | 0.3494 | 163.15% |
| majority | balanced_accuracy | 0.3333 | 0.5715 | 0.2381 | 71.44% |
| majority | accuracy | 0.4733 | 0.5533 | 0.0800 | 16.90% |

Per-class test performance on the original label column:

| Method | Class | Support | Predicted | Precision | Recall | F1 |
| --- | --- | --- | --- | --- | --- | --- |
| original_30 | low | 41 | 0 | 0.0000 | 0.0000 | 0.0000 |
| original_30 | medium | 71 | 60 | 0.3833 | 0.3239 | 0.3511 |
| original_30 | high | 38 | 90 | 0.2556 | 0.6053 | 0.3594 |
| majority | low | 41 | 0 | 0.0000 | 0.0000 | 0.0000 |
| majority | medium | 71 | 150 | 0.4733 | 1.0000 | 0.6425 |
| majority | high | 38 | 0 | 0.0000 | 0.0000 | 0.0000 |
| gaussian_nb_1e-06 | low | 41 | 55 | 0.5091 | 0.6829 | 0.5833 |
| gaussian_nb_1e-06 | medium | 71 | 63 | 0.5397 | 0.4789 | 0.5075 |
| gaussian_nb_1e-06 | high | 38 | 32 | 0.6562 | 0.5526 | 0.6000 |

Confusion matrices: rows actual, columns predicted; order [low, medium, high].

| Original-target method | Actual low row | Actual medium row | Actual high row |
| --- | --- | --- | --- |
| original_30 | [0, 22, 19] | [0, 23, 48] | [0, 15, 23] |
| majority | [0, 41, 0] | [0, 71, 0] | [0, 38, 0] |
| gaussian_nb_1e-06 | [28, 13, 0] | [26, 34, 11] | [1, 16, 21] |

All other candidate confusion matrices and per-class metrics for both targets are retained in `volatility_results.json`; primary metrics above always use the original target. For completeness the statistical-column diagnostics for the original and selected models are:

| Method / diagnostic target | N | Accuracy | Macro-F1 | Balanced accuracy | Low row | Medium row | High row |
| --- | --- | --- | --- | --- | --- | --- | --- |
| original_30 / statistical | 150 | 0.6000 | 0.3574 | 0.3879 | [0, 7, 0] | [0, 15, 15] | [0, 38, 75] |
| gaussian_nb_1e-06 / statistical | 150 | 0.3200 | 0.2869 | 0.5277 | [7, 0, 0] | [21, 9, 0] | [27, 54, 32] |

The selected NB improves macro-F1 and balanced accuracy, but high-class recall falls from 60.53% to 55.26%; its high-to-low error count is 1. This matters for a risk-sensitive application. Some kNN candidates score better on test macro-F1 than selected NB; they are reported but were not selected because test results cannot determine the configuration. Original-label agreement remains modest and label meaning unresolved. No classifier was deployed, no calibration artifact was written, and current volatility labels feeding financial decisions were not replaced.

Safe paper claim: “On a chronological original-label benchmark, a validation-selected lightweight supervised classifier improved agreement over the current CV heuristic and majority baseline. The target's provenance and financial validity remain unresolved, and high-class recall did not improve. Exact reconstruction of a separate CV-derived label is reported solely as a label-consistency diagnostic.”

## 6. Automated tests, failed experiments and remaining limitations

The new Node suite uses the built-in node:test/strict assert framework; the Python suite uses unittest. Tests cover policy combinations, threshold equality and sub-rupee violations, missing/malformed inputs, error/unknown analytics, complete-request omission, stale/forged cached flags, the controller read path, valid users still receiving recommendations, actual Python-to-Node payload compatibility, deterministic statistical baselines, sample metric calculation, causal feature construction, train-only scaling, frozen selection-file hashes and disjoint validation/test targets. No test dependency was installed.

| Suite | Tests | Passed | Failed | Errors | Exit code |
| --- | --- | --- | --- | --- | --- |
| new_python | 11 | 11 | 0 | 0 | 0 |
| new_node | 11 | 11 | 0 | 0 | 0 |
| retained_python | 10 | 9 | 1 | 0 | 1 |
| unique_total | 32 | 31 | 1 | 0 | aggregate |

The new suites pass. The retained Python regression/requirement suite still fails `test_zero_income_is_not_low_risk`: the unchanged classifier treats an all-zero income history as CV=0 / low. This was not hidden or changed to make a green suite. The revised router independently rejects zero mean/zero-only forecast inputs. The combined test runner reports the retained failure and intentionally exits with code 1 whenever any suite has a failure. The captured pre-change broader audit had 23 passes and 11 failures across 34 named tests. Its old Node fixtures/oracles do not match the new mandatory schema/policy, so they were preserved as historical evidence rather than misleadingly counted as directly comparable post-fix tests.

Failed or incomplete experiments and scope limits:

- Forecast deployment gate failed because selected validation RMSE worsened versus historical mean. Test improvement is reported without changing that decision. Several statistical candidates perform poorly; all fixed candidates remain in the tables. Full packaged ARIMA/ETS fitting was not attempted after confirming missing scientific dependencies, because explicit small alternatives already cover the requested lightweight comparison.
- Volatility high-class recall worsened despite macro-F1 improvement. Provided labels remain synthetic and not independently annotated, and adjacent rolling windows overlap. No supervised model replaced runtime labels.
- Threshold/weight policy conformance is not prospective financial safety, health-score validation, investment suitability or financial-outcome validation. No real-worker generalization, independent cohort, profitability, return backtest, fairness or usability result is established.
- No novel forecasting or classification algorithm is claimed. Hyperparameter exploration is limited but does not eliminate overfitting on a small retrospective synthetic corpus. No statistical significance or uncertainty interval is asserted.
- The router does not verify provenance or age of analytics, rederive labels from raw income, reconcile all cached dashboard/explanation views, or make concurrent reads transactional. Valid-looking erroneous summaries can still pass policy checks; future work needs input/version binding and independently validated risk signals.
- LLM validation/fallback problems, health-score income invariance/expense-normalization behavior, and product allocation feasibility from the earlier audit are outside these three targeted fixes. No new live LLM, market-performance or database-integration experiment was run.
- Code coverage percentage was not remeasured for this change. Earlier Python-only line-trace numbers must not be presented as current full-system coverage. New tests run with in-memory DB adapters, not a deployed MongoDB instance or full browser session.

A remaining allocation-minimum defect was explicitly re-executed after the safety patch, rather than inferred solely from the old audit. A safe-policy profile with {'balance': 61000, 'expenses': 20000, 'income_per_day': 1000, 'debt': 0} receives health=91, eligible=True, investable=100. Final allocations remain below the stored product minima:

| Product ID | Allocated Rs | Stored minimum Rs |
| --- | --- | --- |
| option_23 | 20 | 100 |
| option_22 | 19 | 100 |
| option_24 | 19 | 100 |
| option_25 | 19 | 100 |
| option_31 | 19 | 100 |

Thus “zero policy false allows” must not be expanded into a claim that all returned product allocations are executable or that every recommended action is practically safe. The smallest next engineering fix is minimum-aware allocation or returning fewer feasible products; that was not conflated with the router metrics or silently patched as a fourth target.

## 7. Reproduction commands and material-change inventory

Run from `D:/Ritesh/Documents/RJ/AllWork/LYProject`. The following commands need no network, API credentials, database, or new dependency. `select` must precede `test`; output selection hashes are checked by unit tests. Repeating deterministic model stages regenerates the same configurations/data scores, subject to ordinary cross-version numeric behavior. Do not rerun the old `research_eval/write_report.py` against revised code and overwrite the historical `amend_test.md`. The baseline capture helper intentionally refuses to overwrite its existing archive; replay is the supported post-change verification command.

```powershell
python paper_audit/replay_baseline.py
node paper_audit/router_cases.cjs
python paper_audit/experiments.py select
python paper_audit/experiments.py test
python paper_audit/generate_integration_fixtures.py
python paper_audit/run_tests.py  # Expected exit 1: retained zero-income requirement test
# Individual commands, including the intentionally failing retained suite:
npm --prefix server test
python -m unittest discover -s paper_audit -p test_experiments.py -v
python -m unittest discover -s research_eval -p evaluate_python.py -v
python paper_audit/collect_manifest.py
python paper_audit/write_audit.py
```

The one-time pre-change command actually executed was `python paper_audit/reproduce_baseline.py`; its source snapshots, logs and metrics are preserved. To recapture from scratch, use an isolated checkout of the recorded base commit with the earlier evaluation harness available; do not overwrite the baseline directory or temporarily swap production files in this revised checkout. No git commit, deployment, service restart or paper edit was performed.

| Modified / added code | Material purpose |
| --- | --- |
| server/services/decisionRouterService.js | Strict conservative thresholds; numeric/schema completeness checks; fail-closed results and blocker reasons |
| server/services/investmentEngineService.js | Recompute permission; block cached-flag bypass; reusable current-input read/build service |
| server/controllers/investmentController.js | GET rebuilds from current profile/analytics instead of directly returning stored recommendations |
| server/package.json | Replace placeholder npm test with node --test runner; no dependency change |
| server/tests/routerSafety.test.cjs | Policy/invalid-input, engine, actual-ML-payload and controller tests |
| paper_audit/PROTOCOL.md | Frozen candidate/split/oracle/selection specification |
| paper_audit/experiments.py | Dependency-free research baselines, fitting, validation-only selection and final test evaluation |
| paper_audit/test_experiments.py | Statistical sanity, causal construction and leakage/configuration-hash regression checks |
| paper_audit/router_cases.cjs | Independent policy fixture generation and original/revised confusion metrics |
| paper_audit/reproduce_baseline.py; replay_baseline.py | Non-overwriting source/result capture and post-change archived-source replay |
| paper_audit/generate_integration_fixtures.py; run_tests.py; collect_manifest.py | Actual Python payloads, assertion logs/counts and source/data fingerprints |
| paper_audit/write_audit.py | Generate this primary audit report from recorded evidence |

Unchanged: production Python forecast and volatility modules, ML requirements, raw/derived datasets, health scoring, product data, LLM services, the research PDF, and the earlier `amend_test.md`/`research_eval` artifacts. Model coefficients/configuration details, window predictions, original/statistical target metrics for every classifier and exact test logs are in `paper_audit/*selection.json`, `*results.json`, `*_tests.log` and the baseline archive. `final_manifest.json` records current core/data fingerprints. These supporting files make the audit executable; this Markdown file is the primary deliverable.

| Frozen artifact | SHA-256 |
| --- | --- |
| Forecast selection | 598ce9141c1fdd7b5c9477b5f3422593658c3d1c25459d7526d3b733b632f81e |
| Volatility selection | 36394e71f07af00f276c7f72f7949d02b80bf010fd7053cf26a663721f821d3d |
| Protocol | 71717461ae31f3d529bb3b8d8f32276a7ab1e686317c91462076d164863e2eb3 |
| amend_test.md | 5190799ee0eab7b19066fca3c55e826fd3d149c7b8e141325b1dddcdbe80b8dd |
| ml_service/modules/forecast.py | 6cc72b3c374c1ec31e178b1d9e920d7e36f4cbedf39e44e0254e7da7f54c0a72 |
| ml_service/modules/volatility.py | 8db81fd3c2a2de5ca52581b027b9f4bc5becc157fc7a432d1b7516a624014c46 |
| paper_audit/collect_manifest.py | 06aae0b7f3d41ab65ddb7f22d689bb072d7c7e154493f34d9d707778a078b7b4 |
| paper_audit/experiments.py | 96a0b60ee376a2d10cbe4429d14f2b53fe1118a92bdbccc9576b7c39a80b546d |
| paper_audit/generate_integration_fixtures.py | cdc911402647491ac80c2a4a293641b5c1b140d768fcf9bb2e385c17a3591c76 |
| paper_audit/PROTOCOL.md | 71717461ae31f3d529bb3b8d8f32276a7ab1e686317c91462076d164863e2eb3 |
| paper_audit/replay_baseline.py | d421cbb5c2d429983b7396b02fbeb4e7e3eebea22fa875c0e248d9004b172751 |
| paper_audit/reproduce_baseline.py | 6348d4383364e599d6eba6c4551a30a15950e85403b2f8678a9c782400646ad0 |
| paper_audit/router_cases.cjs | 8752888d045ecbc4a9f82bceb7e4d0c3074414a8019b85546d86267c9d33a212 |
| paper_audit/run_tests.py | bb6e2300e42a43b23787ed3f378b627a3d63c2b8592102f71255afa92850661a |
| paper_audit/test_experiments.py | 7da4e6ad1c74bff208a6789574744209e9d480e53441ba3281b60e26db067bba |
| paper_audit/write_audit.py | ab7698eb04d647d47c7a59e7ddb1515c514354fdf8d8bac1621a41eca6676c4f |
| server/controllers/investmentController.js | f01f9aebdb8cbba94d66fb9ecff12319a350de00bc58381679dca6339d5eff9d |
| server/package.json | b55689bb9f311c7732c3077cdbc066587ecddd603693776518ad05c5316f5856 |
| server/services/decisionRouterService.js | a0e17a3f6802556e717bebdc9693b1b78b8010a195e9f045395f5c16df927f63 |
| server/services/investmentEngineService.js | bd81dda9312e5095cdca8e5d5d5b0e2398a05bc802927a26106d38cebcce637a |
| server/tests/routerSafety.test.cjs | 516fface6062e979b01ace06f59b8edf5ba7f632ddc097987c67f1824983166e |

## 8. Which numbers are safe to cite and strongest genuine contribution

| Evidence | Safe citation scope | Do not claim |
| --- | --- | --- |
| Replayed historical 48-window forecast and 162/455 label agreement | Reproduction of previous evaluation under exactly its original definitions | Improvement by comparing those numbers to a different-sized new test set |
| Revised router confusion metrics on identical new fixtures | Zero false allows/blocks on the enumerated conservative-policy oracle, with positive cases retained and invalid inputs rejected | Zero real-world unsafe recommendations or empirically optimal policy thresholds |
| Validation-selected mean/median blend on 330 final targets | Retrospective test-error reduction versus both current forecaster and historical mean; explicit validation RMSE limitation | Confirmed general predictive superiority, statistical significance or deployed forecast improvement |
| Selected NB macro-F1/balanced accuracy on 150 original-label test rows | Improved chronological agreement with the original synthetic label column | Validated real-world risk classification, improved high-risk recall, or a deployed replacement |
| Seven-day .30/.60 derived-label reconstruction | Diagnostic confirmation of a label/window/threshold mismatch | Independent 100% classification accuracy or a substitute primary target |
| New-suite pass counts and retained failure counts | Core behavior and evaluation regressions under stated isolated tests | Complete end-to-end validation, full-system coverage or elimination of all prior failures |

Recommendation: lead the revised paper with **an explicit conservative-policy specification, a reproduced unsafe baseline, fail-closed router enforcement across both recommendation creation and retrieval, and an expanded automated regression evaluation that preserves valid permissions**. Present the two small-model comparisons as transparent secondary empirical results, with the original label target maintained, all candidates shown, held-out-by-protocol temporal scoring, and clear non-deployment decisions. The strongest defensible contribution is auditable rule enforcement and honest empirical diagnosis of an integrated research prototype. It is not a new forecasting theory, independently validated financial risk model, or demonstrated financial benefit for gig workers.
