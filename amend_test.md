# Experimental Amendments for Research Paper

Evaluation date: 2026-10-08 (Asia/Calcutta). This document reports executed measurements on the existing implementation. The attached paper was read as research context, not as instructions. No research-paper file, tracked application source, dataset, trained artifact, package manifest, or application rule was modified. No dependency was installed. Supporting harnesses and raw results are in `research_eval/`; this Markdown file is the single primary deliverable. Poor results and failed requirement checks are deliberately retained.

## 1. Environment

- OS: Windows 11 Home Single Language, build 10.0.22631; CPU: 12th Gen Intel Core i5-12500H. Python reports the compatible platform string `Windows-10-10.0.22631-SP0`.
- Evaluation Python: 3.11.9 (tags/v3.11.9:de54cf5, Apr  2 2024, 10:12:12) [MSC v.1938 64 bit (AMD64)]; Node: v22.18.0. Existing ML virtual environment: Python 3.12.1, FastAPI 0.115.6, Uvicorn 0.34.0, Pydantic 2.13.4. Python numerical evaluation uses only standard-library modules.
- Existing installed Node dependencies used: mongoose 9.3.0, dotenv 17.3.1, express 5.2.1. PDF extraction used the bundled pypdf runtime; it is not a new project dependency.
- Base Git commit: `db3fc1d56a8f38042a91e21ec6164ac8be0dfe40`. Initial tracked working tree was clean; final tracked diff is empty. Results apply to this checkout and local configuration, not an independently verified deployed service.
- Runtime volatility artifact `ml_service/artifacts/volatility_model.json` is absent, so actual thresholds are the defaults. Calibration was simulated in evaluation memory; no artifact was created.
- The API key was loaded privately from existing configuration for synthetic-only API requests. No database was contacted or written. No key, token, connection URI, or private user record is included here.

Data inventory: 16 income CSV files, 1980 physical rows, 5 case-normalized platforms (blinkit, snabbit, swiggy, uber, zomato). Mean Rs 1165.08, conventional even-sample median Rs 1076.385, range Rs 0.00 to Rs 7324.78. The paper counts capitalization variants as different platforms and uses an upper-middle median; those summaries should be corrected. There are 1361 distinct `(date, income, normalized platform)` tuples; these are not unique workers or independent observations. Each volatility file reproduces the income sequence of its same-platform `_volatile.csv` file. Thus the volatility rows must not be added to raw rows and described as additional independent income samples. Provenance/generator seed for the shipped synthetic CSVs is not available in the inspected code.

| Dataset file | Rows | First date | Last date | Distinct dates | Daily contiguous | SHA-256 |
| --- | --- | --- | --- | --- | --- | --- |
| data/normal/blinkit_stable.csv | 120 | 2024-01-01 | 2024-04-29 | 120 | True | 95075157d64b690a682b25c3194bfc6b245b98e56dc1511a2ae8710efaceb3bf |
| data/normal/blinkit_volatile.csv | 120 | 2024-01-01 | 2024-04-29 | 120 | True | d97bb544b0e732da06c2c717a76ab32b345951473ed940b335605dab2fe1b781 |
| data/normal/gig_income_data.csv | 180 | 2024-01-01 | 2024-06-28 | 180 | True | f5f522984470a5baa298b079a6c8e3cd23a426843cc55a5a38239d8fb999f4e2 |
| data/normal/snabbit_stable.csv | 120 | 2024-01-01 | 2024-04-29 | 120 | True | fb9103061e2e08753d57b7b22f51b7c84c6fb780247c91af7a9df82cea359d14 |
| data/normal/snabbit_volatile.csv | 120 | 2024-01-01 | 2024-04-29 | 120 | True | 868b061b89046d2b0a9524ec5c8ca0b65e0efa377b98e4f63bc7b1a5618b9279 |
| data/normal/swiggy_stable.csv | 120 | 2024-01-01 | 2024-04-29 | 120 | True | 0cd7fb42993e63ccc6f94b17b1d00c643d80736b93e2a5809b8e8ac882a39ead |
| data/normal/swiggy_volatile.csv | 120 | 2024-01-01 | 2024-04-29 | 120 | True | 8eba5deff8201b930fbdcf6863ac8e37dca7bbb15f0e4a888e264ab703f5ba93 |
| data/normal/uber_stable.csv | 120 | 2024-01-01 | 2024-04-29 | 120 | True | 4357937b41d426019db525fe340e1a0956c2cb24ad922ad54bf1fc7cc6313800 |
| data/normal/uber_volatile.csv | 120 | 2024-01-01 | 2024-04-29 | 120 | True | 835ec36f74424b9045b46ad7911453f51a82cf5f45e3fef89a828628ceb899cb |
| data/normal/zomato_stable.csv | 120 | 2024-01-01 | 2024-04-29 | 120 | True | 895b12284ab1de813f52f5ca8a2ddb43905428d3230453c997bf45185028ee26 |
| data/normal/zomato_volatile.csv | 120 | 2024-01-01 | 2024-04-29 | 120 | True | b5033d93d454eb911a131cd579c4b6fe81cef943c6da0e2a5cee28cd982aab66 |
| data/volatility/blinkit_with_volatility_label.csv | 120 | 2024-01-01 | 2024-04-29 | 120 | True | 3a24b155a9d4f0a7f75c3ca2cc413ea9e0472fc762d40201719d8d86417fa1b8 |
| data/volatility/snabbit_with_volatility_label.csv | 120 | 2024-01-01 | 2024-04-29 | 120 | True | 4c81a73fc22192e3d8513f3392b68748619dfbf6b51f70ae95ad910618367588 |
| data/volatility/swiggy_with_volatility_label.csv | 120 | 2024-01-01 | 2024-04-29 | 120 | True | 90faf868a0fb24e2bc620b9fedadd0e8997e4e29681f0ca4fa2f8143e3ab673b |
| data/volatility/uber_with_volatility_label.csv | 120 | 2024-01-01 | 2024-04-29 | 120 | True | 926e39a793d130a75cb218152563b8ef2b481efe922338aca73eb600d91b906c |
| data/volatility/zomato_with_volatility_label.csv | 120 | 2024-01-01 | 2024-04-29 | 120 | True | 7d312d164c32e66e3f155e9c0e48040ba8f8d367ba95284238d0e5c05a0b5493 |

All paths below are relative to repository root `D:/Ritesh/Documents/RJ/AllWork/LYProject`. Reproduction commands use the existing runtimes and require no database. `--check` intentionally exits nonzero when requirement tests fail; execution still writes the complete result JSON. Without `--live`, Node reruns reuse the saved diagnostic API observation rather than issuing new API calls.

```powershell
python research_eval/evaluate_python.py --check
node research_eval/evaluate_node.cjs --check
python research_eval/evaluate_coverage.py
python research_eval/collect_metadata.py
# Optional repeat of live experiment (new non-deterministic responses, billed API calls):
node research_eval/evaluate_node.cjs --live --live-count=3 --check
# Local HTTP performance: start in a separate terminal, then stop after measuring.
Set-Location ml_service
& .venv/Scripts/python.exe -m uvicorn app:app --host 127.0.0.1 --port 18081 --no-access-log
# From repository root in the other terminal:
node research_eval/evaluate_performance.cjs
python research_eval/write_report.py
```

The executed live sample consists of an initial three-profile batch and one safe-profile diagnostic repeat. `node_initial_results.json` preserves the initial batch; `node_results.json` contains final deterministic results and the retained diagnostic response. Raw forecast windows, complete volatility metrics, health ablations, filtering counts, fixtures, tests and timing distributions are retained in the corresponding JSON files. Report generation requires these recorded files. The temporary loopback service was stopped after evaluation.

Source and product fingerprints (SHA-256):

| File | SHA-256 |
| --- | --- |
| server/data/seed/investments-mod.csv | 1d775bed20436a9a9076a391be3facb01866038b78efbe0d6e1478c40f9ef56d |
| server/services/aiExplanationService.js | 19d8f0e651ba53fd9d923ef42b5d0719fbbeae16cc880e8ea4d676e950a13bb8 |
| server/services/chatService.js | f955c1cc2322c14250a687ef83df63e6e74b6f0ed3916787efd303918bce5d04 |
| server/services/csvService.js | ef247f909a8fe81187b440d5c00ebc899679426d7f6057226bd5c9ac5bfe71d1 |
| server/services/decisionRouterService.js | cb7be007451894813f800ca31a4bafa65474d3b7db23c49ee6c751b9041e6f0e |
| server/services/groqService.js | 15036f99f0b2b5193bfe2e2396660310d5ed3bd13db8cb7b660b19360c73e35e |
| server/services/healthScoreService.js | 7a1abff763b3a6bc4454e67f635f5d4b52c9b48f9c9b0e5ee12e394431176e12 |
| server/services/investmentEngineService.js | 6b3bd39d9d401f55e817b709bf75b2234256ca30094aa568e691129fdf74fd9e |
| server/services/mlService.js | 346bc9446bf58366ac0637194a6a9caaa63179afeea0bb65f971e6dad34352af |
| ml_service/modules/__init__.py | 01ba4719c80b6fe911b091a7c05124b64eeece964e09c058ef8f9805daca546b |
| ml_service/modules/forecast.py | 6cc72b3c374c1ec31e178b1d9e920d7e36f4cbedf39e44e0254e7da7f54c0a72 |
| ml_service/modules/volatility.py | 8db81fd3c2a2de5ca52581b027b9f4bc5becc157fc7a432d1b7516a624014c46 |

Unmodified paper SHA-256: `8ea4f684df111d813f9ecb8679c9564f8e3adaf6e2052aedbc03e6ab3f8f47e9`.

## 2. Forecasting Evaluation

### Methodology

Dataset: all eleven `data/normal/*.csv` files, evaluated separately as synthetic daily series; no feature-engineered volatility duplicate was added. Chronological expanding-origin evaluation starts after 60 observed days. At each origin, predict the next 15 days; advance the origin by 15 days, with no overlap between test windows within a file. The ten 120-day series yield four windows each; the 180-day `gig_income_data.csv` yields eight. All dates are unique and contiguous within each file; predicted dates were checked against actual dates. No future income is passed to any method. Methods: historical mean of all training observations; mean of the latest 14 observations; seasonal naive repeating the last observed seven days across the horizon; and unchanged `forecast_income(train, horizon=15)`. Seasonal naive is a legitimate weekly benchmark because daily dates exist, but no claim that this synthetic generator contains real weekly seasonality is made. Errors use actual income units (Rs/day), without normalization.

Pooled MAE is the mean absolute error over all evaluated target days. Pooled RMSE is the square root of the mean squared error over the same days. Window MAE/RMSE means and population standard deviations summarize the separate forecast windows; mean window RMSE is not pooled RMSE. File sizes give gig_income_data twice the weight of each other file. No confidence interval or statistical independence assumption is attached to the descriptive standard deviations.

### Results

48 windows and 720 target days were scored. Historical mean has the lowest pooled MAE and RMSE. The proposed method improves on historical mean in 12 windows by MAE and 15 by RMSE. Relative pooled error increases versus historical mean are 8.71% MAE and 7.03% RMSE.

### Comparison Table

| Method | Windows | Days evaluated | Pooled MAE (Rs/day) | Pooled RMSE (Rs/day) | Window MAE mean +/- SD | Window RMSE mean +/- SD |
| --- | --- | --- | --- | --- | --- | --- |
| historical_mean | 48 | 720 | 529.52 | 791.63 | 529.52 +/- 233.87 | 708.85 +/- 352.45 |
| moving_average_14 | 48 | 720 | 547.46 | 815.73 | 547.46 +/- 249.25 | 727.59 +/- 368.82 |
| seasonal_naive_7 | 48 | 720 | 705.45 | 1074.86 | 705.45 +/- 363.13 | 950.56 +/- 501.75 |
| proposed | 48 | 720 | 575.65 | 847.26 | 575.65 +/- 274.42 | 756.18 +/- 382.16 |

| File | Windows | Days | Historical-mean MAE / RMSE | MA14 MAE / RMSE | Seasonal-naive MAE / RMSE | Proposed MAE / RMSE |
| --- | --- | --- | --- | --- | --- | --- |
| data/normal/blinkit_stable.csv | 4 | 60 | 488.02 / 660.82 | 546.09 / 715.54 | 589.33 / 902.43 | 549.79 / 732.23 |
| data/normal/blinkit_volatile.csv | 4 | 60 | 701.41 / 983.05 | 686.76 / 987.42 | 964.20 / 1242.25 | 778.00 / 1003.92 |
| data/normal/gig_income_data.csv | 8 | 120 | 314.94 / 404.74 | 316.78 / 393.85 | 420.99 / 542.46 | 325.78 / 409.59 |
| data/normal/snabbit_stable.csv | 4 | 60 | 293.11 / 363.76 | 317.11 / 366.67 | 337.17 / 488.20 | 292.01 / 358.86 |
| data/normal/snabbit_volatile.csv | 4 | 60 | 519.33 / 636.69 | 506.77 / 629.07 | 631.60 / 829.12 | 544.60 / 676.68 |
| data/normal/swiggy_stable.csv | 4 | 60 | 368.63 / 501.52 | 385.47 / 513.12 | 476.70 / 641.52 | 376.37 / 509.65 |
| data/normal/swiggy_volatile.csv | 4 | 60 | 812.30 / 1210.54 | 852.99 / 1211.40 | 1239.58 / 1756.22 | 871.14 / 1266.61 |
| data/normal/uber_stable.csv | 4 | 60 | 447.59 / 642.14 | 467.24 / 663.37 | 608.81 / 843.43 | 482.50 / 691.90 |
| data/normal/uber_volatile.csv | 4 | 60 | 849.51 / 1148.58 | 863.41 / 1179.14 | 1053.71 / 1455.18 | 824.37 / 1182.08 |
| data/normal/zomato_stable.csv | 4 | 60 | 419.22 / 546.39 | 395.12 / 550.01 | 542.19 / 714.04 | 468.02 / 610.81 |
| data/normal/zomato_volatile.csv | 4 | 60 | 825.28 / 1226.69 | 915.02 / 1339.37 | 1180.11 / 1776.88 | 1069.39 / 1426.49 |

Legacy final-15-day holdout reproduced on `data/normal/gig_income_data.csv`:

| Method | MAE | RMSE |
| --- | --- | --- |
| proposed | 352.07 | 431.35 |
| mean_last15 | 348.48 | 411.28 |

### Key Findings

The paper's original “historical mean” baseline was actually a mean of the preceding 15 days. It should be labeled a moving-average baseline. The broader evaluation supports the original negative forecasting conclusion. In the implemented weekday formula, base plus weekday adjustment equals the recent same-weekday mean whenever that weekday is observed; the base cancels. Therefore the method should not be described as adding an independent average and seasonality contribution. No forecasting algorithm was altered.

### Recommended Paper Claims

“Across chronological multi-origin evaluation of the shipped synthetic daily series, the trend/weekday method did not outperform historical mean. It is a low-cost descriptive projection, with no established predictive advantage or real-worker forecasting validity.”

## 3. Volatility Classification

### Methodology

Files: all five `data/volatility/*_with_volatility_label.csv`, ordered by date and kept separate. Current classifier receives each chronological prefix, internally retaining up to 30 income entries. Common comparison range begins at index 29 (30 available observations). For temporal diagnostics, the first 60 rows of each file are designated calibration and the last 60 rows are evaluation. At each evaluation day, CV uses only contemporaneous and preceding observations, including available history before the split. A label for today is a contemporaneous descriptive classification, not a forecast of tomorrow's volatility. CV uses sample standard deviation (ddof=1), not population standard deviation. Zero mean maps to CV=0 in existing code. Scores are rounded only for displayed features; classification uses the unrounded CV.

Targets are reported separately: `volatility_label` is the original label evaluated in the paper; `volatility_label_stat` is an explicitly derived statistical label in the same CSV. Macro precision/recall/F1 are unweighted means across low/medium/high, including unsupported predictions as zero; weighted F1 weights by target support. All configurations use the same evaluation days. Corrections exist only in the evaluation harness, not the application.

### Label/Window Investigation

| Target column | All rows | Low | Medium | High |
| --- | --- | --- | --- | --- |
| volatility_label | 600 | 167 | 255 | 178 |
| volatility_label_stat | 600 | 25 | 132 | 443 |

All 600 rows' rolling mean, sample standard deviation and CV were reconstructed from up to seven consecutive rows, with expanding prefixes for the initial rows and a single-observation standard deviation of zero. Maximum absolute discrepancies are 4.547e-13 (mean), 3.070e-12 (SD), and 3.664e-14 (CV). The rule CV < 0.30 = low, 0.30 <= CV < 0.60 = medium, CV >= 0.60 = high reproduces 600/600 statistical labels. This is strong evidence for their derivation but does not prove the missing generator's exact threshold constants: finite data identifies intervals, not a unique rule.

| Boundary | Largest lower-class CV in first-60-row calibration subset | Smallest upper-class CV in calibration subset |
| --- | --- | --- |
| low_medium | 0.287283453481 | 0.304560738545 |
| medium_high | 0.599923735967 | 0.600001417834 |

Important disclosure: the threshold hypothesis was explored after inspecting global label/CV ranges. Its agreement on the last-half subset is a post-hoc rule-reconstruction check, not a blinded held-out model validation. The calibration-subset intervals above independently support the simple hypothesis, but do not undo that exploratory selection. No training or statistical test can turn deterministic labels generated from the same CV into independent financial ground truth.

The original and statistical label columns agree on 38.17% of the 600 physical rows. The original-label generator is absent, so its semantics cannot be established. The original poor agreement cannot legitimately be “fixed” by silently substituting targets. Runtime defaults are 0.35/0.75, whereas the existing offline helper collects 7-day CVs and selects order statistics at floor(0.33*N) and floor(0.66*N), rounded to three decimals. Applying that exact quantile procedure to the designated calibration subset yields 0.665/0.920; these are different from both runtime defaults and statistical-label boundaries. The paper's claim that default constants were established by that calibration is not demonstrated by this checkout.

### Results

| Method | Window (entries) | CV low/high boundaries | N | Accuracy (%) | Macro precision | Macro recall | Macro F1 | Weighted F1 | Original-label accuracy (%) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| current_30 | 30 | 0.350 / 0.750 | 300 | 72.00 | 0.4440 | 0.4965 | 0.4564 | 0.7224 | 35.67 |
| default_7 | 7 | 0.350 / 0.750 | 300 | 79.33 | 0.7553 | 0.8883 | 0.7903 | 0.8085 | 47.33 |
| aligned_7 | 7 | 0.300 / 0.600 | 300 | 100.00 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 39.67 |
| aligned_14 | 14 | 0.300 / 0.600 | 300 | 82.67 | 0.5072 | 0.5226 | 0.5145 | 0.8045 | 34.00 |
| aligned_30 | 30 | 0.300 / 0.600 | 300 | 73.33 | 0.4053 | 0.4038 | 0.3986 | 0.6949 | 31.33 |
| train_quantile_7 | 7 | 0.665 / 0.920 | 300 | 39.00 | 0.3754 | 0.4916 | 0.2892 | 0.4761 | 48.67 |
| train_quantile_30 | 30 | 0.665 / 0.920 | 300 | 43.00 | 0.4193 | 0.5726 | 0.3620 | 0.4950 | 46.67 |

The original result is exactly reproduced: 162/455 = 35.60% agreement with `volatility_label`. Changing window and thresholds does not establish that target's validity. Against statistical labels on the temporal subset, current accuracy is slightly below an always-high baseline (72.33%; macro F1 0.2798), while its macro F1 is higher than that baseline. Thus class imbalance makes accuracy alone misleading.

| Dataset | Temporal evaluation rows | Current accuracy (%) against statistical label | Aligned-7 accuracy (%) |
| --- | --- | --- | --- |
| data/volatility/blinkit_with_volatility_label.csv | 60 | 58.33 | 100.00 |
| data/volatility/snabbit_with_volatility_label.csv | 60 | 95.00 | 100.00 |
| data/volatility/swiggy_with_volatility_label.csv | 60 | 86.67 | 100.00 |
| data/volatility/uber_with_volatility_label.csv | 60 | 35.00 | 100.00 |
| data/volatility/zomato_with_volatility_label.csv | 60 | 85.00 | 100.00 |

Per-class performance on the temporal evaluation subset (all statistical-label configurations; precision/recall/F1 are proportions):

| Method | Class | Target support | Predicted count | Precision | Recall | F1 |
| --- | --- | --- | --- | --- | --- | --- |
| current_30 | low | 14 | 0 | 0.0000 | 0.0000 | 0.0000 |
| current_30 | medium | 69 | 115 | 0.4348 | 0.7246 | 0.5435 |
| current_30 | high | 217 | 185 | 0.8973 | 0.7650 | 0.8259 |
| default_7 | low | 14 | 19 | 0.7368 | 1.0000 | 0.8485 |
| default_7 | medium | 69 | 121 | 0.5289 | 0.9275 | 0.6737 |
| default_7 | high | 217 | 160 | 1.0000 | 0.7373 | 0.8488 |
| aligned_7 | low | 14 | 14 | 1.0000 | 1.0000 | 1.0000 |
| aligned_7 | medium | 69 | 69 | 1.0000 | 1.0000 | 1.0000 |
| aligned_7 | high | 217 | 217 | 1.0000 | 1.0000 | 1.0000 |
| aligned_14 | low | 14 | 0 | 0.0000 | 0.0000 | 0.0000 |
| aligned_14 | medium | 69 | 67 | 0.6418 | 0.6232 | 0.6324 |
| aligned_14 | high | 217 | 233 | 0.8798 | 0.9447 | 0.9111 |
| aligned_30 | low | 14 | 0 | 0.0000 | 0.0000 | 0.0000 |
| aligned_30 | medium | 69 | 47 | 0.4255 | 0.2899 | 0.3448 |
| aligned_30 | high | 217 | 253 | 0.7905 | 0.9217 | 0.8511 |
| train_quantile_7 | low | 14 | 111 | 0.1261 | 1.0000 | 0.2240 |
| train_quantile_7 | medium | 69 | 86 | 0.0000 | 0.0000 | 0.0000 |
| train_quantile_7 | high | 217 | 103 | 1.0000 | 0.4747 | 0.6437 |
| train_quantile_30 | low | 14 | 89 | 0.1573 | 1.0000 | 0.2718 |
| train_quantile_30 | medium | 69 | 107 | 0.1776 | 0.2754 | 0.2159 |
| train_quantile_30 | high | 217 | 104 | 0.9231 | 0.4424 | 0.5981 |

Current classifier against the original paper target on the full common range:

| Class | Target support | Predicted count | Precision | Recall | F1 |
| --- | --- | --- | --- | --- | --- |
| low | 122 | 0 | 0.0000 | 0.0000 | 0.0000 |
| medium | 191 | 136 | 0.3676 | 0.2618 | 0.3058 |
| high | 142 | 319 | 0.3511 | 0.7887 | 0.4859 |

### Confusion Matrix

Rows = actual classes, columns = predicted classes; order in every row is [low, medium, high].

| Evaluation / target | N | Actual low -> predicted counts | Actual medium -> predicted counts | Actual high -> predicted counts |
| --- | --- | --- | --- | --- |
| Current / original / full common | 455 | [0, 56, 66] | [0, 50, 141] | [0, 30, 112] |
| current_30 / statistical / temporal | 300 | [0, 14, 0] | [0, 50, 19] | [0, 51, 166] |
| default_7 / statistical / temporal | 300 | [14, 0, 0] | [5, 64, 0] | [0, 57, 160] |
| aligned_7 / statistical / temporal | 300 | [14, 0, 0] | [0, 69, 0] | [0, 0, 217] |
| aligned_14 / statistical / temporal | 300 | [0, 12, 2] | [0, 43, 26] | [0, 12, 205] |
| aligned_30 / statistical / temporal | 300 | [0, 10, 4] | [0, 20, 49] | [0, 17, 200] |
| train_quantile_7 / statistical / temporal | 300 | [14, 0, 0] | [69, 0, 0] | [28, 86, 103] |
| train_quantile_30 / statistical / temporal | 300 | [14, 0, 0] | [42, 19, 8] | [33, 88, 96] |
| current_30 / original / temporal | 300 | [0, 49, 32] | [0, 43, 89] | [0, 23, 64] |
| aligned_7 / original / temporal | 300 | [12, 31, 38] | [2, 29, 101] | [0, 9, 78] |

### Sensitivity Analysis

The aligned seven-entry window was fixed. Thresholds were perturbed jointly and individually by 10% around 0.30/0.60; no search for a highest-scoring threshold was performed. These are diagnostic agreement measurements on the same temporal subset, not outcome-based threshold optimization.

| Low CV boundary | High CV boundary | N | Accuracy (%) | Macro precision | Macro recall | Macro F1 |
| --- | --- | --- | --- | --- | --- | --- |
| 0.27 | 0.54 | 300 | 91.33 | 0.9526 | 0.8364 | 0.8822 |
| 0.30 | 0.60 | 300 | 100.00 | 1.0000 | 1.0000 | 1.0000 |
| 0.33 | 0.66 | 300 | 90.33 | 0.8626 | 0.9489 | 0.8964 |
| 0.27 | 0.60 | 300 | 99.33 | 0.9906 | 0.9524 | 0.9696 |
| 0.33 | 0.60 | 300 | 99.33 | 0.9583 | 0.9903 | 0.9729 |
| 0.30 | 0.54 | 300 | 92.00 | 0.9668 | 0.8841 | 0.9124 |
| 0.30 | 0.66 | 300 | 91.00 | 0.9062 | 0.9585 | 0.9233 |

Actual runtime CV boundary probes use three incomes `[100*(1-c), 100, 100*(1+c)]`, which have sample CV=c. The boundary labels confirm strict lower-threshold comparisons:

| Input CV | Displayed CV | Runtime label |
| --- | --- | --- |
| 0.349 | 0.349 | low |
| 0.35 | 0.35 | medium |
| 0.351 | 0.351 | medium |
| 0.749 | 0.749 | medium |
| 0.75 | 0.75 | high |
| 0.751 | 0.751 | high |

### Key Findings

There are three distinct mismatches: target-label identity, seven-entry versus thirty-entry window, and fixed statistical boundaries versus distributional quantile calibration. The aligned rule reproduces the derived statistical target exactly, while quantile calibration worsens statistical-label agreement. The current method predicts no low-volatility cases in the temporal subset. All-zero income is currently classified low rather than unavailable/undefined; this descriptive stability label must not imply healthy earning capacity. All files are daily here, but runtime counts records, does not sort or check dates, and thus its “30 days” interpretation depends on caller ordering and daily completeness.

### Recommended Paper Claims

“The former label-agreement result was reproduced. A separate label audit found statistical labels derived from seven-entry sample CV. An evaluation-only aligned rule exactly reproduces those labels, demonstrating implementation consistency rather than independent risk-classification accuracy. Original-label provenance and financial meaning remain unvalidated.”

## 4. Financial Health Score

### Methodology

The unchanged `calculateHealthScore` is executed on a fully enumerated small synthetic matrix: daily income [0, 500, 1500]; monthly expenses [10000, 20000, 40000]; bank-balance/expenses [0, 0.5, 1, 3, 6]; debt/expenses [0, 0.5, 2, 4]; volatility [low, medium, high, unknown]; forecast/actual ratio [0.5, 1, 1.5]; history length [3, 14, 30]. Entries have constant nonnegative daily income, and each controlled forecast has 15 constant points. At zero actual income the prescribed ratio produces zero predicted income and the scorer's own zero-mean branch is used. Volatility labels are controlled independently to isolate component response; not every cross-product state is a statistically realizable constant-income history. These fixtures are programmatically generated and transient, not claimed as real financial observations. Adjacent-pair comparisons hold other matrix settings fixed. Income sensitivity compares positive incomes only, with the forecast ratio held fixed.

Weight ablation sets one weight to zero; perturbation multiplies one weight by 0.8 or 1.2. In every case remaining weights are renormalized to sum to one, the existing calculated component values are reused, and JavaScript clamping/rounding is retained. This is an external recombination of unchanged components, not an application change. Phase changes use existing thresholds; score-70 crossings and actual router changes are reported separately.

### Sensitivity/Ablation Results

Matrix N = 6480. Scores range 7 to 98; mean 50.417. Synthetic phase counts:

| Phase | Cases |
| --- | --- |
| survival | 2511 |
| crisis | 1875 |
| stability | 1686 |
| growth | 408 |

| Factor improved / increased | Adjacent pairs | Wrong-direction changes | Unchanged scores | Min score delta | Max score delta |
| --- | --- | --- | --- | --- | --- |
| liq | 5184 | 0 | 1296 | 0 | 20 |
| debtRatio | 4860 | 0 | 0 | -13 | -4 |
| vol | 3240 | 0 | 0 | 6 | 6 |
| trend | 4320 | 0 | 1440 | 0 | 8 |
| n | 4320 | 0 | 0 | 2 | 4 |
| income | 2160 | 0 | 2160 | 0 | 0 |

| Component | Weight multiplier before renormalization | Mean absolute score change | Max absolute score change | Phase changes / N | Score-70 crossings / N | Router changes / N |
| --- | --- | --- | --- | --- | --- | --- |
| liquidity | 0 | 12.273 | 29 | 3663 | 1167 | 585 |
| liquidity | 0.8 | 1.815 | 4 | 627 | 168 | 108 |
| liquidity | 1.2 | 1.627 | 4 | 486 | 138 | 96 |
| debtSafety | 0 | 9.748 | 24 | 2757 | 810 | 414 |
| debtSafety | 0.8 | 1.512 | 4 | 384 | 156 | 102 |
| debtSafety | 1.2 | 1.415 | 4 | 486 | 96 | 78 |
| incomeStability | 0 | 5.247 | 18 | 1185 | 486 | 264 |
| incomeStability | 0.8 | 0.891 | 3 | 315 | 84 | 42 |
| incomeStability | 1.2 | 0.764 | 3 | 129 | 90 | 66 |
| forecastTrend | 0 | 6.371 | 15 | 1827 | 594 | 396 |
| forecastTrend | 0.8 | 1.077 | 3 | 273 | 108 | 78 |
| forecastTrend | 1.2 | 1.116 | 3 | 324 | 132 | 114 |
| dataConsistency | 0 | 2.819 | 9 | 744 | 270 | 228 |
| dataConsistency | 0.8 | 0.555 | 2 | 144 | 42 | 42 |
| dataConsistency | 1.2 | 0.441 | 2 | 81 | 24 | 24 |

Every count in the ablation table uses the full matrix denominator N. Router-change counts additionally preserve the unchanged liquidity/debt/volatility gates. The exact alternative normalized weights are in `node_results.json`, and are reproducible as `w_j * multiplier_j / sum(w_k * multiplier_k)`.

| Controlled example | Health score | Phase |
| --- | --- | --- |
| stable | 91 | growth |
| zero_income | 79 | stability |
| zero_income_no_forecast | 79 | stability |
| high_debt | 60 | stability |
| vulnerable | 29 | crisis |

A second fixed-amount expense probe holds daily income=1000, volatility=low, trend ratio=1 and history=30; balances [0, 10000, 60000, 120000], debts [0, 10000, 60000, 100000], expenses [10000, 20000, 40000]. Across 32 adjacent expense increases, score increases in 10, decreases in 9, and stays equal in 13. Counterexamples:

| Fixed balance | Fixed debt | Expenses before | Expenses after | Score increase |
| --- | --- | --- | --- | --- |
| 0 | 10000 | 10000 | 20000 | 4 |
| 0 | 10000 | 20000 | 40000 | 2 |
| 0 | 60000 | 20000 | 40000 | 11 |
| 0 | 100000 | 20000 | 40000 | 3 |
| 10000 | 60000 | 20000 | 40000 | 9 |
| 60000 | 10000 | 10000 | 20000 | 4 |
| 120000 | 10000 | 10000 | 20000 | 4 |
| 120000 | 10000 | 20000 | 40000 | 2 |
| 120000 | 60000 | 20000 | 40000 | 11 |
| 120000 | 100000 | 20000 | 40000 | 3 |

### Key Findings

Liquidity, debt-ratio safety, known volatility class, forecast ratio, and tracking history move in the expected weak-monotone direction in the designed matrix. Saturation, rounding and zero-income branches explain ties. Absolute positive income changes do not change the health score when ratios and history are fixed; the formulation has no surplus-to-expenses component. Raising expenses can improve debt safety because debt is divided by expenses, causing counterintuitive net score increases. A zero-income, well-buffered user can still obtain a stability score and pass the router; the investment engine's separate zero-surplus guard blocks recommendations. These are limitations of health and readiness interpretations, not evidence of overall financial viability.

Small weight perturbations have modest maximum score displacement, but some phase and decision changes remain. Removal of liquidity or debt safety has large effects. Synthetic sensitivity shows behavior of chosen weights, not empirical justification of their optimality. No alternative weights were selected or deployed.

### Recommended Paper Claims

“The score is a hand-weighted composite with demonstrated directional consistency for its normalized component definitions and quantified sensitivity. Its weights are not outcome-calibrated or empirically optimal. Sensitivity near phase/readiness boundaries and the absence of direct earning-sufficiency assessment limit the interpretation.”

## 5. Decision Router

### Methodology

The unchanged `buildDecisionRouter` is tested on the Cartesian product: liquidity months [0, 0.99, 1, 1.01, 2.99, 3, 3.01, 6]; debt/expenses [0, 0.49, 0.5, 0.51, 1.99, 2, 2.01, 3]; health score [0, 39, 60, 69, 70, 71, 100]; volatility [low, medium, high, unknown]. Monthly expenses are fixed at Rs 20000 and balance/debt follow the ratios. Scores are deliberately injected to isolate routing, not computed as an independent real-user sample. This covers isolated violations, combinations, all-clear states and equality boundaries.

Two explicit test oracles avoid conflating policy definitions: **implemented** allows score >=70 AND liquidity >=1 AND debt ratio <=2 AND label !=high; **conservative** uses score >=70 AND liquidity >=3 AND debt ratio <=0.5 AND label !=high, reflecting the stronger boundaries requested in the evaluation. Unknown volatility is kept non-high in both oracles to isolate liquidity/debt differences and is examined separately. The code and paper methodology describe the first gate, while stronger safety language/advisory actions may suggest the second. The conservative oracle is a policy stress test, not proof that the application formally specified the stricter rule.

### Results

| Safety oracle | Cases | Passed | Failed | False allow | False block |
| --- | --- | --- | --- | --- | --- |
| implemented | 1792 | 1792 | 0 | 0 | 0 |
| conservative | 1792 | 1549 | 243 | 243 | 0 |

324 cases are allowed. Unknown volatility is allowed in 108 injected-score cases. A separate ML-outage fixture uses 30 positive income entries, balance Rs 100000, expenses Rs 20000, no debt, empty forecast and unknown volatility. It produces score 74, phase stability, router allowed=True, investable Rs 2500, and 5 recommendations. This reproduces the fallback analytics values used by the controller without calling a database: missing ML output does not fail closed.

### Boundary Tests

Other values are fixed at liquidity=4 months, debt=0, health=80, volatility=low unless the row changes that value.

| Liquidity months | Debt ratio | Health | Investment allowed | Emergency-fund action allowed | Debt-payment action allowed |
| --- | --- | --- | --- | --- | --- |
| 0.99 | 0 | 80 | False | True | False |
| 1 | 0 | 80 | True | True | False |
| 1.01 | 0 | 80 | True | True | False |
| 2.99 | 0 | 80 | True | True | False |
| 3 | 0 | 80 | True | False | False |
| 3.01 | 0 | 80 | True | False | False |
| 4 | 0.49 | 80 | True | False | False |
| 4 | 0.5 | 80 | True | False | False |
| 4 | 0.51 | 80 | True | False | True |
| 4 | 1.99 | 80 | True | False | True |
| 4 | 2 | 80 | True | False | True |
| 4 | 2.01 | 80 | False | False | True |
| 4 | 0 | 69 | False | False | False |
| 4 | 0 | 70 | True | False | False |
| 4 | 0 | 71 | True | False | False |

CV boundary probe results in Section 3 show medium at 0.749 and high at 0.750/0.751; the router consumes the label rather than the raw CV, and every high-label case in the truth table is blocked. Rule activation counts (overlap intentionally permitted):

| Condition exercised | Cases |
| --- | --- |
| liq_below | 448 |
| debt_above | 448 |
| high_vol | 448 |
| low_health | 1024 |
| all_clear | 324 |

### Key Findings

The implemented deterministic truth table has no false allow/block on the enumerated set. This does not establish the stronger universal claim that anyone advised to build an emergency fund or pay debt cannot invest: both advisory actions can coexist with investment permission. The stricter oracle yields false allows; missing volatility permits routing; zero earnings may permit routing despite the engine blocking zero surplus. The fixed grid is exhaustive over the listed values, not all possible application inputs. No NaN, missing-user, or adversarial-input security assurance is claimed.

### Recommended Paper Claims

“Routing agrees with its implemented safety predicates on the enumerated boundary/combination grid. The precise thresholds and handling of unknown volatility must be stated. Stronger readiness guarantees are not established, and missing analytics may still permit recommendations.”

## 6. Investment Engine

### Methodology

The unchanged CSV loader and `buildInvestmentSuggestion` use `server/data/seed/investments-mod.csv`. Private input/filter/scoring helpers are exposed by appending exports only to an in-memory VM copy for measurement; public recommendation calls use the original required module. Database imports are never connected. Sequential filter counts use the actual predicate order; independent rejection counts are also retained in result JSON and in the table below. Sequential rejection attribution depends on order, so it must not be interpreted as independent filter importance. For router-blocked profiles, filter cascades are diagnostic counterfactual counts; the production engine exits before applying them.

The investment matrix fixes expenses=20000 and 30 recorded days, and enumerates daily income [500, 1000, 3000], balance [60000, 61000, 100000, 200000], debt [0, 10000, 50000, 100000], volatility [low, medium, high, unknown], risk preference [low, medium, high], and forecast ratio [0.85, 1, 1.15]. Health and router are recomputed through existing logic for each profile. Controlled volatility labels need not match constant synthetic income histories. The investable amount is the implemented floored minimum of one-quarter surplus and one-tenth balance above the emergency reserve. Product minimums are checked again against final allocated amounts by the harness, as distinct from existing filtering against total investable amount.

### Filtering Results

Product counts: 37 total, 23 volatility-safe. Risk-category counts after existing normalization: {'low': 31, 'medium': 5, 'high': 1}. These are curated metadata, not independently verified product safety or current market rates.

| Profile | Initial | After amount | After income | After debt | After savings | After risk | After risk/volatility | After volatility-safe | Final recommendations |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| safe_low | 37 | 36 | 35 | 35 | 35 | 34 | 34 | 34 | 5 |
| safe_medium | 37 | 36 | 35 | 35 | 35 | 35 | 35 | 35 | 5 |
| safe_high | 37 | 36 | 35 | 35 | 35 | 35 | 35 | 35 | 5 |
| medium_vol_low_risk | 37 | 36 | 35 | 35 | 35 | 34 | 30 | 30 | 5 |
| high_vol_gated | 37 | 36 | 35 | 35 | 35 | 34 | 30 | 20 | 0 |
| high_vol_filter_isolation | 37 | 36 | 35 | 35 | 35 | 35 | 35 | 23 | 5 |
| reserve_only | 37 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| small_budget | 37 | 14 | 13 | 13 | 13 | 12 | 12 | 12 | 5 |
| high_debt | 37 | 36 | 35 | 31 | 31 | 31 | 31 | 31 | 0 |
| no_surplus | 37 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| affluent | 37 | 37 | 36 | 36 | 36 | 36 | 36 | 36 | 5 |
| falling_forecast | 37 | 36 | 35 | 35 | 35 | 34 | 34 | 34 | 5 |

Independent eliminations if each filter alone were applied to all original products:

| Profile | amount | income | debt | savings | risk | risk_volatility | volatility_safe |
| --- | --- | --- | --- | --- | --- | --- | --- |
| safe_low | 1 | 1 | 0 | 1 | 1 | 0 | 0 |
| safe_medium | 1 | 1 | 0 | 1 | 0 | 0 | 0 |
| safe_high | 1 | 1 | 0 | 1 | 0 | 0 | 0 |
| medium_vol_low_risk | 1 | 1 | 0 | 1 | 1 | 5 | 0 |
| high_vol_gated | 1 | 1 | 0 | 1 | 1 | 5 | 14 |
| high_vol_filter_isolation | 1 | 1 | 0 | 1 | 0 | 0 | 14 |
| reserve_only | 36 | 1 | 0 | 1 | 1 | 0 | 0 |
| small_budget | 23 | 1 | 0 | 1 | 1 | 0 | 0 |
| high_debt | 1 | 1 | 5 | 1 | 1 | 0 | 0 |
| no_surplus | 36 | 3 | 0 | 1 | 1 | 0 | 0 |
| affluent | 0 | 1 | 0 | 1 | 0 | 0 | 0 |
| falling_forecast | 1 | 1 | 0 | 1 | 1 | 0 | 0 |

### Representative Scenarios

Default profile: daily income=1000, 30 income entries, expenses=20000, balance=100000, debt=0, low risk, low volatility, forecast ratio=1. Each scenario changes only fields shown below. `high_vol_filter_isolation` explicitly supplies an allowed router flag to inspect otherwise unreachable high-volatility filters; it is not evidence that production routing permits that user.

| Profile | Changed fields | Monthly income | Balance | Debt | Investable | Router allowed | Recommended | Total allocated | Displayed allocation percentages sum |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| safe_low | {} | 30000 | 100000 | 0 | 2500 | True | 5 | 2496 | 100 |
| safe_medium | {'risk': 'medium'} | 30000 | 100000 | 0 | 2500 | True | 5 | 2498 | 101 |
| safe_high | {'risk': 'high'} | 30000 | 100000 | 0 | 2500 | True | 5 | 2499 | 99 |
| medium_vol_low_risk | {'vol': 'medium'} | 30000 | 100000 | 0 | 2500 | True | 5 | 2496 | 100 |
| high_vol_gated | {'vol': 'high'} | 30000 | 100000 | 0 | 2500 | False | 0 | 0 | 0 |
| high_vol_filter_isolation | {'vol': 'high', 'risk': 'medium'} | 30000 | 100000 | 0 | 2500 | True | 5 | 2498 | 101 |
| reserve_only | {'balance': 60000} | 30000 | 60000 | 0 | 0 | True | 0 | 0 | 0 |
| small_budget | {'balance': 61000} | 30000 | 61000 | 0 | 100 | True | 5 | 96 | 100 |
| high_debt | {'debt': 100000} | 30000 | 100000 | 100000 | 2500 | False | 0 | 0 | 0 |
| no_surplus | {'income': 500} | 15000 | 100000 | 0 | 0 | True | 0 | 0 | 0 |
| affluent | {'income': 3000, 'balance': 200000, 'risk': 'medium'} | 90000 | 200000 | 0 | 14000 | True | 5 | 13999 | 101 |
| falling_forecast | {'trend': 0.85} | 30000 | 100000 | 0 | 2500 | True | 5 | 2500 | 100 |

Representative final rankings and allocation details (minima come from the existing normalized product dataset):

| Profile | Rank | Product ID | Name | Score | Allocation Rs | Allocation % |
| --- | --- | --- | --- | --- | --- | --- |
| safe_low | 1 | option_23 | ICICI Pru Ultra Short Term Fund | 95 | 504 | 20 |
| safe_low | 2 | option_22 | HDFC / SBI Liquid Fund | 94 | 498 | 20 |
| safe_low | 3 | option_24 | Edelweiss CRISIL-IBX AAA Bond Index Fund (Jun 2027) | 94 | 498 | 20 |
| safe_low | 4 | option_25 | Aditya Birla SL CRISIL-IBX AAA NBFC-HFC Index Fund (Sep 2026) | 94 | 498 | 20 |
| safe_low | 5 | option_31 | Nippon India CRISIL IBX AAA Financial Services (Dec 2026) | 94 | 498 | 20 |
| safe_medium | 1 | option_32 | Digital Gold (Groww / Paytm) | 92 | 532 | 21 |
| safe_medium | 2 | option_29 | Corporate Bond Mutual Fund (High Quality) | 89 | 515 | 21 |
| safe_medium | 3 | option_33 | Nippon India Gold BeES ETF | 89 | 515 | 21 |
| safe_medium | 4 | option_22 | HDFC / SBI Liquid Fund | 81 | 468 | 19 |
| safe_medium | 5 | option_23 | ICICI Pru Ultra Short Term Fund | 81 | 468 | 19 |
| safe_high | 1 | option_32 | Digital Gold (Groww / Paytm) | 79 | 528 | 21 |
| safe_high | 2 | option_29 | Corporate Bond Mutual Fund (High Quality) | 76 | 508 | 20 |
| safe_high | 3 | option_33 | Nippon India Gold BeES ETF | 76 | 508 | 20 |
| safe_high | 4 | option_37 | Nifty 50 ETF (SBI / Nippon India) | 75 | 501 | 20 |
| safe_high | 5 | option_23 | ICICI Pru Ultra Short Term Fund | 68 | 454 | 18 |
| small_budget | 1 | option_23 | ICICI Pru Ultra Short Term Fund | 95 | 20 | 20 |
| small_budget | 2 | option_22 | HDFC / SBI Liquid Fund | 94 | 19 | 20 |
| small_budget | 3 | option_24 | Edelweiss CRISIL-IBX AAA Bond Index Fund (Jun 2027) | 94 | 19 | 20 |
| small_budget | 4 | option_25 | Aditya Birla SL CRISIL-IBX AAA NBFC-HFC Index Fund (Sep 2026) | 94 | 19 | 20 |
| small_budget | 5 | option_31 | Nippon India CRISIL IBX AAA Financial Services (Dec 2026) | 94 | 19 | 20 |

Matrix: 1728 profiles; 324 eligible, 1404 blocked, 1620 individual allocations. Eligible profiles receive five recommendations; all other profiles receive none. Unallocated rounding residue ranges Rs 0 to Rs 4, mean Rs 2.185 among eligible profiles.

| Constraint | Evaluated denominator | Violations |
| --- | --- | --- |
| budget | 1728 | 0 |
| negative | 1620 | 0 |
| minimum_allocated | 1620 | 468 |
| hard_filter | 1620 | 0 |
| top5 | 1728 | 0 |
| router_bypass | 1728 | 0 |
| pct_sum_not100 | 324 | 180 |

Ranking stability relative to the default profile, using top-set Jaccard similarity and inversions among common products:

| Perturbation | Top product IDs in order | Top-set Jaccard | Same order | Common pairs | Inversions |
| --- | --- | --- | --- | --- | --- |
| repeat | option_23, option_22, option_24, option_25, option_31 | 1.0000 | True | 10 | 0 |
| income_minus5pct | option_23, option_22, option_24, option_25, option_31 | 1.0000 | True | 10 | 0 |
| income_plus5pct | option_23, option_22, option_24, option_25, option_31 | 1.0000 | True | 10 | 0 |
| balance_minus5pct | option_23, option_22, option_24, option_25, option_31 | 1.0000 | True | 10 | 0 |
| balance_plus5pct | option_23, option_22, option_24, option_25, option_31 | 1.0000 | True | 10 | 0 |
| forecast_drop | option_22, option_23, option_24, option_25, option_31 | 1.0000 | False | 10 | 1 |
| medium_risk | option_32, option_29, option_33, option_22, option_23 | 0.2500 | False | 1 | 1 |
| high_risk | option_32, option_29, option_33, option_37, option_23 | 0.1111 | False | 0 | 0 |

### Key Findings

Hard-filter membership, total-budget cap, nonnegative allocations, router gating and top-five limit hold on the enumerated profiles. However, product filtering compares each minimum with the whole budget, then splits that budget; final per-product amounts can fall below minimums. In the small-budget scenario the top fund receives Rs 20 despite its CSV minimum Rs 100; four other funds receive Rs 19 each with Rs 100 minima. The default low-risk profile satisfies those product minima; the problem depends on the profile/budget. Independently rounded percentages also need not sum to 100. These are feasibility/presentation failures, not tested trade execution.

Small income/balance perturbations preserve this local top set; changing risk preference changes ranking, and a declining forecast creates score ties and an ordering inversion. Stable input file order resolves equal integer scores; that tie behavior is not evidence of discriminative financial quality. Product data includes dated maturity descriptions, permissive numeric parsing and manually indicated returns. No validation against current product availability, actual subscriptions, tax treatment or market returns was performed. Forecast return ranges are formula projections with heuristic bands, not calibrated uncertainty or backtests.

### Recommended Paper Claims

“The engine implements deterministic affordability/risk filtering and weighted ranking, with verified total-budget constraints on a synthetic profile matrix. Final allocation minimums and rounded percentage consistency show violations; actionable product-level feasibility and investment performance are not established.”

## 7. LLM Explanation Layer

### Methodology

Existing code: `server/services/groqService.js` and `aiExplanationService.js`. Database adapters are replaced with in-memory synthetic records, while snapshot construction, validation, template fallback and orchestration source are executed unchanged. The actual Groq client is used for live calls; only synthetic snapshots are transmitted. Local tests isolate validation/transport failure paths with mocked fetch and a dummy key. No API response can change the deterministic score/router/allocation fields via this layer; acceptance of incorrect explanation text is a separate risk.

Live setup: default model `qwen/qwen3.8-27b`, temperature 0.2, JSON-object response format, configured request timeout 12000 ms. The paper states a different model; revise that description or identify a separately verified deployment. The first batch contains safe, high-volatility and vulnerable profiles; the diagnostic repeats the safe profile and retains raw text. Initial rejected responses were not retained, so their textual/numeric consistency cannot be audited. Report all calls rather than omitting those failures. Requests are sequential with no retries or prompt/model changes. Safe default fixture is the investment default; high volatility changes only label; vulnerable changes income=500, balance=10000, debt=60000, volatility=high. Snapshot values and final diagnostic raw response are stored in result JSON. Latency is monotonic time around the API/JSON call, including network and provider processing, excluding database and app persistence.

### Results

| Call | Profile | API JSON parse success | Application schema success | Fallback path required | API latency (ms) |
| --- | --- | --- | --- | --- | --- |
| 1 | safe | 1 | 0 | 1 | 1277.498 |
| 2 | high volatility | 1 | 0 | 1 | 790.265 |
| 3 | vulnerable | 1 | 0 | 1 | 852.402 |
| 4 | safe | 1 | 0 | 1 | 1167.199 |

| Live aggregate | Value |
| --- | --- |
| Calls | 4 |
| HTTP/parse successes | 4 |
| Application schema successes | 0 |
| Schema failures | 4 |
| Transport failures / observed timeouts | 0 |
| Fallback paths required | 4 |
| Mean API latency ms | 1021.841 |
| Population SD API latency ms | 205.442 |
| Median API latency ms | 1009.801 |
| Min / max API latency ms | 790.265 / 1277.498 |

The retained diagnostic has `overview` as a string instead of the required object, `reasons` and `actionPlan` as strings rather than arrays, and an unsupported tone. Validation fails at overview before later issues are checked. Its forecast sentence says “Over the next 15 months ... averaging 1,000 per month,” whereas the supplied horizon is 15 daily forecast points with daily average 1000. A manual audit of this single retained response finds no changed displayed financial numeric values and no new named product, but one horizon/unit inconsistency; this is not a hallucination-rate estimate. The other three outputs cannot be numerically audited. All responses are discarded by schema validation before application delivery; deterministic fallback behavior is separately tested, not inferred from model text.

### Failure/Fallback Results

| Controlled orchestration case | Status | Snapshot unchanged |
| --- | --- | --- |
| valid | ready | True |
| transport_failure | fallback | True |
| schema_failure | fallback | True |
| forced_fallback | fallback | True |
| invented_numbers | ready | True |
| wrong_overview_types | ready | True |
| missing_optional_fields | ready | True |

Controlled invented output says health score 999 and suggests ImaginaryProduct for Rs 999999; the validator accepts it as ready. Non-string truthy overview values are converted to strings and accepted. Missing optional actionPlan/watchOut is accepted. The validator performs partial structural validation and string truncation; it does not compare narrative numbers, units, products or investment decisions against the snapshot. It also cannot require semantic faithfulness merely by prompting the model.

| Mock transport case | Success | Elapsed ms | Outcome |
| --- | --- | --- | --- |
| valid_json | True | 0.422 | JSON parsed |
| fenced_json | True | 0.101 | JSON parsed |
| malformed | False | 0.174 | Expected property name or '}' in JSON at position 1 (line 1 column 2) |
| missing_json | False | 0.168 | Groq response did not contain JSON |
| http_429 | False | 0.177 | Groq failed with status 429 |
| timeout | False | 35.682 | Controlled timeout |

For the mocked timeout only, `GROQ_TIMEOUT_MS` is temporarily set to 20 ms within the isolated evaluation process, then restored. This is an accelerated timeout-path check, not an observation of production timeout duration or failure probability. Malformed/missing JSON, HTTP rejection and timeout are exercised through the actual client source. Orchestration fallback is separately observed for controlled thrown transport errors, schema errors and forced fallback. No production configuration file is edited.

| Fallback fixture | Health score | Forecast total | Horizon | Forecast average | Detected direction | Status |
| --- | --- | --- | --- | --- | --- | --- |
| safe | 91 | 15000 | 15 | 1000 | steady | fallback |
| high_vol | 79 | 15000 | 15 | 1000 | steady | fallback |
| declining | 83 | 7500 | 15 | 500 | steady | fallback |
| rising | 98 | 22500 | 15 | 1500 | steady | fallback |
| crisis | 24 | 15000 | 15 | 1000 | steady | fallback |

Five snapshot fallback outputs retain their score, forecast-total and eligible top-product/allocated-amount values; these are visible in retained fixture strings. However, forecast direction compares forecast total/horizon with the average of the same forecast values, so the rising and falling fixtures both become steady. It never compares with historical actual average. The safe fixture also treats the non-needed emergency-fund action as a blocked action and says to pause building it because it is already sufficient. Thus numerical copying is not proof of explanation correctness. All seven controlled orchestration cases preserve the source snapshot.

### Key Findings

The small live sample establishes schema fragility and observed latency only. It does not estimate production reliability, user understanding or model-wide quality. Fallback activates on the tested transport/schema paths, but has logical/textual limitations; narrative numerical invention can pass existing validation in a schema-shaped response. Deterministic financial outputs are structurally downstream-protected, while explanation faithfulness is unguaranteed.

### Recommended Paper Claims

“A small synthetic live-API probe measured network/provider latency and observed schema rejections. Controlled tests verified error-to-template fallback but exposed weak semantic validation and fallback trend interpretation. The explanation layer does not overwrite financial decisions, yet faithful explanation text and practical user comprehension remain unvalidated.”

## 8. Automated Testing

### Test Summary

Prior infrastructure: `eval_script.py` prints a single holdout and label agreement but contains no assertion suite; `server/package.json` has a placeholder failing npm test command. No meaningful assertion suite was found in the inspected source. Added only small evaluation/test harnesses, with Python stdlib unittest and Node's built-in assert in a named custom runner; no Jest/Pytest dependency was introduced. Named tests include aggregate matrix assertions, so fixture counts are reported separately from test counts.

| Suite | Named tests | Passed | Failed | Errors |
| --- | --- | --- | --- | --- |
| Python unittest | 10 | 9 | 1 | 0 |
| Node built-in assert custom runner | 24 | 14 | 10 | 0 |
| Total | 34 | 23 | 11 | 0 |

Run commands with `--check` return exit code 1 because failures are retained. The separate line-coverage execution reruns the same Python tests; it does not add new unique tests to the total. API experiments are not counted as unit tests. No core behavior was changed to make tests pass.

### Important Failures

Some failed checks express stronger research-facing requirements rather than bugs relative to the existing formula. Income-scale sensitivity and conservative/unknown-volatility gating are explicit candidate requirements; their failures expose claim limitations. Final allocation minima, percentage totals, narrative numeric checks and forecast-direction checks expose concrete feasibility/validation weaknesses. The all-zero CV case reflects a chosen descriptive convention that should not be interpreted as financial safety.

| Suite | Failed assertion | Observed behavior |
| --- | --- | --- |
| Python | test_zero_income_is_not_low_risk | All-zero income is classified low |
| Node | score income-sensitive with all other factors fixed | The expression evaluated to a falsy value: |
| Node | zero earnings should not pass investment gate | Expected values to be strictly equal: |
| Node | router conservative 3 month and 0.5 debt safety requirement | Expected values to be strictly equal: |
| Node | router blocks unknown volatility | Expected values to be strictly equal: |
| Node | router ML outage fails closed | Expected values to be strictly equal: |
| Node | investment allocated product minimums satisfied | Expected values to be strictly equal: |
| Node | investment displayed percentages sum to 100 | Expected values to be strictly equal: |
| Node | LLM numerical invention rejected | Expected values to be strictly equal: |
| Node | LLM wrong overview types rejected | Expected values to be strictly equal: |
| Node | fallback detects falling and rising forecasts | Expected values to be strictly equal: |

All named Node test outcomes for reproducibility:

| Named test | Passed |
| --- | --- |
| health bounded over full matrix | True |
| health monotonic liquidity debt volatility forecast history | True |
| health insufficient history | True |
| score income-sensitive with all other factors fixed | False |
| zero earnings should not pass investment gate | False |
| router exact implemented truth table | True |
| router conservative 3 month and 0.5 debt safety requirement | False |
| router blocks unknown volatility | False |
| router ML outage fails closed | False |
| investment total allocation within budget | True |
| investment respects all hard filters | True |
| investment respects router block | True |
| investment no negative allocation and at most five | True |
| investment allocated product minimums satisfied | False |
| investment displayed percentages sum to 100 | False |
| ranking deterministic repeat | True |
| LLM rejects missing required fields | True |
| LLM fallback on controlled schema transport forced errors | True |
| LLM numerical invention rejected | False |
| LLM wrong overview types rejected | False |
| snapshot remains unchanged through LLM validation | True |
| fallback detects falling and rising forecasts | False |
| Groq malformed missing HTTP timeout paths reject | True |
| Groq JSON and fenced JSON parse | True |

### Coverage

Python unit-test line tracing uses stdlib trace: executed lines intersect positive executable line numbers discovered from bytecode/source, after modules are imported. Denominators include imports and function-definition lines that consequently appear uncovered; this is a conservative custom line-trace measure, not branch coverage or a coverage.py result. Offline training/artifact loading paths are mostly unexercised. Node/full-application coverage percentage was not measured, and Python numbers must not be presented as whole-system coverage. Router rule activation is reported separately in Section 5.

| Python source / scope | Executable lines | Covered lines | Line coverage (%) |
| --- | --- | --- | --- |
| ml_service/modules/forecast.py | 64 | 58 | 90.62 |
| ml_service/modules/volatility.py | 81 | 38 | 46.91 |
| combined | 145 | 96 | 66.21 |

## 9. Performance

### Results

Python timings use `time.perf_counter_ns`; Node timings use `process.hrtime.bigint`. Timings are individual sequential repetitions after warmups, population SD, nearest-rank p95, and median. The existing gig_income_data first 60 rows and full 180 rows are used for Python benchmarks. The final Node service benchmark prebuilds the same first-60-row input, calls actual unmodified public modules, and includes CSV read/parsing on every investment call. Its fixed user has balance=100000, expenses=20000, debt=0 and low risk; actual computed volatility is medium, and five recommendations are produced. Database, frontend rendering, authentication and LLM are excluded.

Loopback timing sends JSON from Node to existing Uvicorn/FastAPI `/analyze` on 127.0.0.1:18081, then optionally runs the Node health/router/investment pipeline. It includes HTTP scheduling, serialization and response parsing but excludes database/controller persistence. This is a measured local computational path, not full app end-to-end latency. The general Node factorial harness also retains synthetic-profile timing probes, but the table uses prebuilt existing-data inputs to avoid fixture-construction overhead. Template timing uses unchanged code loaded in a VM and must be interpreted as a harness measurement.

| Component / path | Warmups | Timed repetitions | Mean (ms) | SD (ms) | Median (ms) | p95 (ms) | Min (ms) | Max (ms) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Python forecast: 60 records, horizon 30 | 50 | 500 | 0.0780 | 0.0334 | 0.0725 | 0.1050 | 0.0668 | 0.4706 |
| Python forecast: 180 records, horizon 15 | 50 | 500 | 0.1356 | 0.0321 | 0.1293 | 0.1701 | 0.1202 | 0.3870 |
| Python forecast + volatility: 60 records, horizon 15 | 50 | 500 | 0.1463 | 0.1021 | 0.1157 | 0.2887 | 0.0966 | 1.2737 |
| Node health + router + investment: existing 60-record dataset | 50 | 500 | 0.2859 | 0.0945 | 0.2561 | 0.4717 | 0.1932 | 0.8529 |
| Loopback HTTP /analyze: 60 records, horizon 15 | 10 | 50 | 4.6660 | 4.7881 | 3.9330 | 5.4132 | 2.2555 | 37.7017 |
| Loopback /analyze + Node health/router/investment | 10 | 50 | 5.4261 | 4.7701 | 4.6568 | 6.6158 | 3.0281 | 38.2224 |
| Deterministic explanation template (VM harness) | 50 | 500 | 0.0046 | 0.0017 | 0.0044 | 0.0050 | 0.0042 | 0.0372 |

External Groq timing is separate: N=4, mean 1021.841 ms, median 1009.801 ms, range 790.265-1277.498 ms; all require schema fallback. Live timing was measured before fallback generation and has no estimated production percentile. The desktop was not isolated for benchmarking; timing tails and the loopback maximum show scheduling variability. No throughput, concurrency, energy, deployment hardware or production SLA was measured.

## 10. Overall Experimental Conclusions

- Chronological forecasting over 48 windows confirms that historical mean outperforms the proposed trend/weekday method on these synthetic series.
- The original volatility agreement is reproduced. Statistical-label reconstruction identifies a concrete target/window/threshold mismatch; exact aligned agreement validates rule replication, not independent financial risk detection.
- Volatility class imbalance and missing low predictions make macro/per-class metrics essential; unsupervised quantile boundaries do not recover the fixed label semantics.
- The 6480-case health matrix supports directional consistency for designed components, while income-scale invariance, expense-normalization effects and weight sensitivity limit financial-health interpretation.
- The router matches its implemented truth table, but stronger conservative and missing-analytics safety guarantees fail.
- Investment filters and total-budget limits hold in the matrix, but final allocation minimums and percentage totals show reproducible violations.
- Live schema failures, an observed horizon-unit error, controlled semantic-validation failures and fallback trend errors limit explanation quality claims.
- The added assertion suite retains real failures rather than masking them; it supplies a small reproducible research regression baseline.
- Local computation and loopback analytics are inexpensive on this machine, while API latency is substantially larger; practical decision-support outcomes remain untested.

## 11. Limitations That MUST Remain

- All income files are synthetic; real-worker forecasting/generalization, external label validity and deployment outcomes are unknown. Feature-engineered files duplicate raw series, and case variants are not independent platforms.
- Generator scripts, seed provenance, participant identities and independent volatility annotations are absent. Chronological forecasts are reproducible but do not establish real-world seasonality or predictive advantage.
- Aligned volatility agreement is a post-hoc deterministic-label reconstruction. No claim of learned-model superiority, genuine held-out financial-risk accuracy or empirically optimal windows/thresholds is supported.
- Composite health weights have no outcome-based validation. Matrix distributions are design consequences, not estimated population phase prevalence. Absolute affordability and some expense directions are not reliably represented by the health score.
- Router safety depends on stated predicates, inputs and upstream results. Stronger policy readiness, fail-closed handling of unknown volatility and a universal unsafe-user prohibition are not supported.
- Allocations can violate product minima; displayed percentages can be inconsistent. No feasibility of execution, product-currentness, tax suitability, suitability regulation, diversification quality or financial benefit is validated.
- Expected return fields and projections are manually curated/model-formula values. No historical price series or legitimate performance backtest is present; do not claim profitability, risk-adjusted performance or calibrated confidence bounds.
- Only a tiny API sample was collected. Three rejected pilot outputs were not retained for textual audit; the single retained diagnostic cannot establish a hallucination rate. Future model/network behavior is non-deterministic, and prompt instructions do not enforce semantic truth.
- Fallback does not guarantee correct financial interpretation. Numerical copying, structural schema checks and immutable snapshots do not validate comprehensibility or faithful narrative recommendations.
- Tests cover core research logic in isolation and synthetic fixtures. They do not validate MongoDB writes, full controllers, frontend flows, security, concurrency, malformed-input robustness or deployment-wide coverage. The coverage number applies only to two Python source modules under the stated line-trace protocol.
- Local timing excludes full application/database overhead and cannot be presented as a production SLA or complete end-to-end response time. No prospective user study, real financial outcome study, fairness analysis, expert suitability review or usability study was performed.

## 12. Paper-Ready Data

### Forecast errors: chronological evaluation

| Method | Windows | Days evaluated | Pooled MAE (Rs/day) | Pooled RMSE (Rs/day) | Window MAE mean +/- SD | Window RMSE mean +/- SD |
| --- | --- | --- | --- | --- | --- | --- |
| historical_mean | 48 | 720 | 529.52 | 791.63 | 529.52 +/- 233.87 | 708.85 +/- 352.45 |
| moving_average_14 | 48 | 720 | 547.46 | 815.73 | 547.46 +/- 249.25 | 727.59 +/- 368.82 |
| seasonal_naive_7 | 48 | 720 | 705.45 | 1074.86 | 705.45 +/- 363.13 | 950.56 +/- 501.75 |
| proposed | 48 | 720 | 575.65 | 847.26 | 575.65 +/- 274.42 | 756.18 +/- 382.16 |

### Volatility: statistical target, temporal diagnostic subset

| Method | Window (entries) | CV low/high boundaries | N | Accuracy (%) | Macro precision | Macro recall | Macro F1 | Weighted F1 | Original-label accuracy (%) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| current_30 | 30 | 0.350 / 0.750 | 300 | 72.00 | 0.4440 | 0.4965 | 0.4564 | 0.7224 | 35.67 |
| default_7 | 7 | 0.350 / 0.750 | 300 | 79.33 | 0.7553 | 0.8883 | 0.7903 | 0.8085 | 47.33 |
| aligned_7 | 7 | 0.300 / 0.600 | 300 | 100.00 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 39.67 |
| aligned_14 | 14 | 0.300 / 0.600 | 300 | 82.67 | 0.5072 | 0.5226 | 0.5145 | 0.8045 | 34.00 |
| aligned_30 | 30 | 0.300 / 0.600 | 300 | 73.33 | 0.4053 | 0.4038 | 0.3986 | 0.6949 | 31.33 |
| train_quantile_7 | 7 | 0.665 / 0.920 | 300 | 39.00 | 0.3754 | 0.4916 | 0.2892 | 0.4761 | 48.67 |
| train_quantile_30 | 30 | 0.665 / 0.920 | 300 | 43.00 | 0.4193 | 0.5726 | 0.3620 | 0.4950 | 46.67 |

### Volatility confusion matrices: temporal statistical target

| Method | N | Actual-low row | Actual-medium row | Actual-high row |
| --- | --- | --- | --- | --- |
| current_30 | 300 | [0, 14, 0] | [0, 50, 19] | [0, 51, 166] |
| default_7 | 300 | [14, 0, 0] | [5, 64, 0] | [0, 57, 160] |
| aligned_7 | 300 | [14, 0, 0] | [0, 69, 0] | [0, 0, 217] |
| aligned_14 | 300 | [0, 12, 2] | [0, 43, 26] | [0, 12, 205] |
| aligned_30 | 300 | [0, 10, 4] | [0, 20, 49] | [0, 17, 200] |
| train_quantile_7 | 300 | [14, 0, 0] | [69, 0, 0] | [28, 86, 103] |
| train_quantile_30 | 300 | [14, 0, 0] | [42, 19, 8] | [33, 88, 96] |

### Volatility threshold sensitivity

| Low CV boundary | High CV boundary | N | Accuracy (%) | Macro precision | Macro recall | Macro F1 |
| --- | --- | --- | --- | --- | --- | --- |
| 0.27 | 0.54 | 300 | 91.33 | 0.9526 | 0.8364 | 0.8822 |
| 0.30 | 0.60 | 300 | 100.00 | 1.0000 | 1.0000 | 1.0000 |
| 0.33 | 0.66 | 300 | 90.33 | 0.8626 | 0.9489 | 0.8964 |
| 0.27 | 0.60 | 300 | 99.33 | 0.9906 | 0.9524 | 0.9696 |
| 0.33 | 0.60 | 300 | 99.33 | 0.9583 | 0.9903 | 0.9729 |
| 0.30 | 0.54 | 300 | 92.00 | 0.9668 | 0.8841 | 0.9124 |
| 0.30 | 0.66 | 300 | 91.00 | 0.9062 | 0.9585 | 0.9233 |

### Health monotonicity

| Factor improved / increased | Adjacent pairs | Wrong-direction changes | Unchanged scores | Min score delta | Max score delta |
| --- | --- | --- | --- | --- | --- |
| liq | 5184 | 0 | 1296 | 0 | 20 |
| debtRatio | 4860 | 0 | 0 | -13 | -4 |
| vol | 3240 | 0 | 0 | 6 | 6 |
| trend | 4320 | 0 | 1440 | 0 | 8 |
| n | 4320 | 0 | 0 | 2 | 4 |
| income | 2160 | 0 | 2160 | 0 | 0 |

### Health phases

| Phase | Synthetic cases |
| --- | --- |
| survival | 2511 |
| crisis | 1875 |
| stability | 1686 |
| growth | 408 |

### Health weight ablation/perturbation

| Component | Weight multiplier before renormalization | Mean absolute score change | Max absolute score change | Phase changes / N | Score-70 crossings / N | Router changes / N |
| --- | --- | --- | --- | --- | --- | --- |
| liquidity | 0 | 12.273 | 29 | 3663 | 1167 | 585 |
| liquidity | 0.8 | 1.815 | 4 | 627 | 168 | 108 |
| liquidity | 1.2 | 1.627 | 4 | 486 | 138 | 96 |
| debtSafety | 0 | 9.748 | 24 | 2757 | 810 | 414 |
| debtSafety | 0.8 | 1.512 | 4 | 384 | 156 | 102 |
| debtSafety | 1.2 | 1.415 | 4 | 486 | 96 | 78 |
| incomeStability | 0 | 5.247 | 18 | 1185 | 486 | 264 |
| incomeStability | 0.8 | 0.891 | 3 | 315 | 84 | 42 |
| incomeStability | 1.2 | 0.764 | 3 | 129 | 90 | 66 |
| forecastTrend | 0 | 6.371 | 15 | 1827 | 594 | 396 |
| forecastTrend | 0.8 | 1.077 | 3 | 273 | 108 | 78 |
| forecastTrend | 1.2 | 1.116 | 3 | 324 | 132 | 114 |
| dataConsistency | 0 | 2.819 | 9 | 744 | 270 | 228 |
| dataConsistency | 0.8 | 0.555 | 2 | 144 | 42 | 42 |
| dataConsistency | 1.2 | 0.441 | 2 | 81 | 24 | 24 |

### Router policy-oracle results

| Safety oracle | Cases | Passed | Failed | False allow | False block |
| --- | --- | --- | --- | --- | --- |
| implemented | 1792 | 1792 | 0 | 0 | 0 |
| conservative | 1792 | 1549 | 243 | 243 | 0 |

### Investment sequential survivors

| Profile | Initial | After amount | After income | After debt | After savings | After risk | After risk/volatility | After volatility-safe | Final recommendations |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| safe_low | 37 | 36 | 35 | 35 | 35 | 34 | 34 | 34 | 5 |
| safe_medium | 37 | 36 | 35 | 35 | 35 | 35 | 35 | 35 | 5 |
| safe_high | 37 | 36 | 35 | 35 | 35 | 35 | 35 | 35 | 5 |
| medium_vol_low_risk | 37 | 36 | 35 | 35 | 35 | 34 | 30 | 30 | 5 |
| high_vol_gated | 37 | 36 | 35 | 35 | 35 | 34 | 30 | 20 | 0 |
| high_vol_filter_isolation | 37 | 36 | 35 | 35 | 35 | 35 | 35 | 23 | 5 |
| reserve_only | 37 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| small_budget | 37 | 14 | 13 | 13 | 13 | 12 | 12 | 12 | 5 |
| high_debt | 37 | 36 | 35 | 31 | 31 | 31 | 31 | 31 | 0 |
| no_surplus | 37 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| affluent | 37 | 37 | 36 | 36 | 36 | 36 | 36 | 36 | 5 |
| falling_forecast | 37 | 36 | 35 | 35 | 35 | 34 | 34 | 34 | 5 |

### Investment allocation constraints

| Constraint | Evaluated denominator | Violations |
| --- | --- | --- |
| budget | 1728 | 0 |
| negative | 1620 | 0 |
| minimum_allocated | 1620 | 468 |
| hard_filter | 1620 | 0 |
| top5 | 1728 | 0 |
| router_bypass | 1728 | 0 |
| pct_sum_not100 | 324 | 180 |

### Live LLM observations

| Call | Profile | API JSON parse success | Application schema success | Fallback path required | API latency (ms) |
| --- | --- | --- | --- | --- | --- |
| 1 | safe | 1 | 0 | 1 | 1277.498 |
| 2 | high volatility | 1 | 0 | 1 | 790.265 |
| 3 | vulnerable | 1 | 0 | 1 | 852.402 |
| 4 | safe | 1 | 0 | 1 | 1167.199 |

### API timing summary

| Calls | Mean ms | SD ms | Median ms | Minimum ms | Maximum ms |
| --- | --- | --- | --- | --- | --- |
| 4 | 1021.841 | 205.442 | 1009.801 | 790.265 | 1277.498 |

### Automated test counts

| Suite | Named tests | Passed | Failed | Errors |
| --- | --- | --- | --- | --- |
| Python unittest | 10 | 9 | 1 | 0 |
| Node built-in assert custom runner | 24 | 14 | 10 | 0 |
| Total | 34 | 23 | 11 | 0 |

### Python-only line tracing

| Python source / scope | Executable lines | Covered lines | Line coverage (%) |
| --- | --- | --- | --- |
| ml_service/modules/forecast.py | 64 | 58 | 90.62 |
| ml_service/modules/volatility.py | 81 | 38 | 46.91 |
| combined | 145 | 96 | 66.21 |

### Local performance

| Component / path | Warmups | Timed repetitions | Mean (ms) | SD (ms) | Median (ms) | p95 (ms) | Min (ms) | Max (ms) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Python forecast: 60 records, horizon 30 | 50 | 500 | 0.0780 | 0.0334 | 0.0725 | 0.1050 | 0.0668 | 0.4706 |
| Python forecast: 180 records, horizon 15 | 50 | 500 | 0.1356 | 0.0321 | 0.1293 | 0.1701 | 0.1202 | 0.3870 |
| Python forecast + volatility: 60 records, horizon 15 | 50 | 500 | 0.1463 | 0.1021 | 0.1157 | 0.2887 | 0.0966 | 1.2737 |
| Node health + router + investment: existing 60-record dataset | 50 | 500 | 0.2859 | 0.0945 | 0.2561 | 0.4717 | 0.1932 | 0.8529 |
| Loopback HTTP /analyze: 60 records, horizon 15 | 10 | 50 | 4.6660 | 4.7881 | 3.9330 | 5.4132 | 2.2555 | 37.7017 |
| Loopback /analyze + Node health/router/investment | 10 | 50 | 5.4261 | 4.7701 | 4.6568 | 6.6158 | 3.0281 | 38.2224 |
| Deterministic explanation template (VM harness) | 50 | 500 | 0.0046 | 0.0017 | 0.0044 | 0.0050 | 0.0042 | 0.0372 |
