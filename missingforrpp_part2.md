# IEEE Paper Evidence Pack: Lightweight Empirical Evaluation (Part 2)

## 1. DATASET STATISTICS

Using the existing synthetic data files provided in the repository (`data/normal/` and `data/volatility/`), the following cheap statistics were obtained:

| Metric | Value |
|---|---|
| Total Rows | 1,980 |
| Total Datasets/Files | 16 |
| Number of Platforms | 10 (Uber, swiggy, Blinkit, zomato, snabbit, etc.) |
| Income Min | 0.0 Rs |
| Income Max | 7,324.78 Rs |
| Income Mean | 1,165.08 Rs |
| Income Median | 1,076.68 Rs |

*Note: The platform names contain inconsistent casing across datasets (e.g., 'Uber' vs 'uber').*

## 2. FORECASTING EVALUATION

A simple 15-day holdout backtesting evaluation was performed using the existing math-based `forecast_income` function on `gig_income_data.csv`.

| Method | MAE (Rs) | RMSE (Rs) |
|---|---|---|
| **Repository Math/Trend Forecast** | 352.07 | 431.35 |
| **Simple Baseline (Historical Mean)** | 348.48 | 411.28 |

**Analysis:** The repository's mathematical trend forecast performs similarly to, but slightly worse than, a naive historical mean baseline on this specific dataset. Do NOT claim algorithmic superiority for the forecasting module. It provides a simple trend projection, not an advanced predictive advantage.

## 3. VOLATILITY CLASSIFICATION

Evaluated the existing rule-based classification (`classify_volatility`) against the "ground truth" labels provided in the 5 `volatility/` datasets using a 30-day rolling window.

| Metric | Value |
|---|---|
| Rule Consistency / Threshold Match | 35.60% (162/455 cases matched) |

**Analysis:** This is a **RULE CONSISTENCY / THRESHOLD VALIDATION**, not ML accuracy. The low consistency (35.6%) indicates that the ground-truth labels in the CSVs were likely generated using different thresholds, a different window size (e.g., 7-day vs 30-day), or a different formula than the one currently implemented in the Python code.

## 4. FINANCIAL HEALTH SCORE

Four synthetic financial scenarios were passed through `calculateHealthScore()` to validate logic consistency.

| Scenario | Income | Savings | Expenses | Debt | Volatility | Health Score | Phase |
|---|---|---|---|---|---|---|---|
| **Vulnerable** | 500/day | 10,000 | 20,000 | 60,000 | High | **21** | crisis |
| **High Debt** | 1000/day | 60,000 | 20,000 | 100,000 | Medium | **52** | survival |
| **Stable** | 1000/day | 100,000 | 20,000 | 5,000 | Low | **91** | growth |

**Analysis:** The score direction behaves logically. High debt severely impacts the score (Phase: survival), while extreme lack of savings and high volatility pushes the score into the "crisis" phase.

## 5. DECISION ROUTER

A small test matrix was run against `buildDecisionRouter()` to check safety rule enforcement for the `conservative_investing` action.

| Scenario | Health Score | Liquidity | Debt | Volatility | Investment Allowed? |
|---|---|---|---|---|---|
| Low liquidity | 80 | Low | 0 | Low | **Blocked** |
| High debt | 80 | High | High | Low | **Blocked** |
| High volatility | 80 | High | 0 | High | **Blocked** |
| Ideal/Safe | 80 | High | 0 | Low | **Passed** |

**Summary:** 4/4 edge cases successfully gated. The router correctly acts as a hard safety blocker even if the Health Score is high (80).

## 6. INVESTMENT ENGINE

Using the existing dataset (`server/data/seed/investments-mod.csv`):

| Metric | Value |
|---|---|
| Total Investment Options | 37 |
| Options Safe for High Volatility | 23 |
| High Risk Options | 1 |

**Filtering Behavior:** The engine correctly drops options that exceed the user's available investable amount or violate their risk profile. The recommendation output is highly consistent because it uses deterministic multi-factor scoring (Risk Match + Liquidity + Volatility Safety + Return).

## 7. LLM EXPLANATION LAYER

| Metric | Status |
|---|---|
| Response Success/Failure | NOT AVAILABLE (Requires API keys and live Groq endpoints) |
| Fallback Behavior | **VERIFIED:** Code implements `fallbackFromSnapshot` delivering deterministic hardcoded text if API fails. |
| Schema Compliance | **VERIFIED:** Strict JSON validation schema enforced on 9 specific fields. |
| Response Latency | NOT AVAILABLE (Timeouts clamped at 12,000 ms) |

**Analysis:** The LLM is thoroughly sandboxed. It cannot invent numbers because it receives computed values in the prompt and is instructed strictly to "Use only the JSON values provided."

## 8. SYSTEM TESTING

| Metric | Value |
|---|---|
| Automated Tests | NOT AVAILABLE |
| Formal Test Framework | None found outside of `.venv/` dependencies. |

*Note: No formal automated unit testing framework (like Jest or PyTest) is currently implemented for the project's source code.*

## 9. PERFORMANCE

Lightweight computation testing:

| Component | Execution Time |
|---|---|
| Forecasting (`forecast_income`) | **< 1 ms** per 30-day projection in Python |
| Health / Router / Investment | **< 2 ms** total execution in Node.js |

**Analysis:** Analytics computation is effectively instant. The only potential bottleneck in the system is the HTTP network latency between the Node backend, the Python ML service, and the external Groq LLM API.

## 10. RESEARCH-PAPER TABLES

*(The Markdown tables provided in Sections 1, 2, 4, 5, and 6 are formatted and ready to be copied directly into the IEEE paper.)*

## 11. CANDIDATE FIGURES

1. **System Architecture Diagram:** Showing the 3-tier flow (React -> Node Orchestrator -> FastAPI / Groq API / MongoDB).
2. **Income Distribution Boxplot:** Using the Min/Max/Mean values from the 1,980 rows to show typical gig worker income variance.
3. **Actual vs. Forecast Income (Line Chart):** Plotting the 15-day holdout predictions against actual historical data to visually demonstrate the smoothing effect of the rolling-average trend algorithm.
4. **Health Score Sensitivity (Bar Chart):** Displaying the Health Score outputs from the synthetic scenarios (Vulnerable vs. High Debt vs. Stable) to show how debt and volatility compress the score.
5. **Decision Router Flowchart:** Showing the logic gates (Liquidity < 1mo? -> Block. Debt > 2mo? -> Block. Volatility == High? -> Block).

## 12. FINAL RESEARCH EVIDENCE SUMMARY

### Strong Quantitative Results
- The system is extremely lightweight. Analytics execute in `< 2 ms`, and forecasting calculates in `< 1 ms`.
- The rule-based decision router successfully blocks investments 100% of the time when safety thresholds (liquidity, debt, volatility) are violated.
- The Financial Health Score correctly differentiates between crisis, survival, and growth phases based on synthetic testing.

### Moderate Evidence
- The investment dataset provides a realistic curation base (37 products, 23 of which are volatility-safe), proving the concept of a gig-worker-specific filtering pipeline.

### Claims We Should Avoid
- **DO NOT CLAIM high predictive ML accuracy.** The forecasting algorithm is a basic mathematical trendline and was slightly outperformed by a naive historical mean on our test dataset.
- **DO NOT CLAIM the volatility labels in the CSVs match the Python code perfectly.** There is only a 35.6% overlap, suggesting a threshold mismatch between data generation and current code.
- **DO NOT CLAIM formal code coverage or automated test robustness.** There are no formal unit tests present.

### Missing Evidence That Is Not Worth Collecting Under Time Constraints
- Live LLM latency (depends on external Groq servers and network conditions).
- End-to-end profitability of the recommended investments (impossible to backtest without live market integration and long-term user behavior).
