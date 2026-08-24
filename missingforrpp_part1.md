# IEEE Paper Evidence Pack: Codebase Analysis (Part 1)

## 1. SYSTEM OVERVIEW
**Purpose:** Financial advisory and planning system for Indian gig workers based on daily income tracking.
**Architecture & Modules:** 
- **Frontend:** React application (mentioned in docs).
- **Backend (Node.js/Express):** Orchestrator service. Calculates multi-factor Health Score, executes Rule-based Decision Router, runs Micro-Investment Curation Engine, and integrates LLM-based Explanations.
- **ML Service (Python/FastAPI):** Stateless inference service computing income forecasting and volatility classification.
- **Database:** MongoDB (Mongoose ODM).
**Data Flow:**
1. Backend fetches user and income data from MongoDB.
2. Backend POSTs data to FastAPI ML service `/analyze`.
3. ML service returns forecast and volatility scores statelessly.
4. Backend locally computes Health Score, Decision Router, and Investment Suggestions.
5. Backend calls Groq API (LLM) for explanation generation based on deterministic calculation results.
**Fallback Mechanisms:** 
- If ML Service is down, backend gracefully degrades, skipping forecast/volatility but computing health score and router based on available data.
- If Groq LLM fails/times out (12s), backend falls back to deterministic hardcoded string generation (`fallbackFromSnapshot`).

## 2. CURRENT TECHNOLOGY STACK
- **Backend:** Node.js, Express, Mongoose
- **Database:** MongoDB
- **Statistical/Mathematical Analytics:** Pure Python standard library (No external dependencies like pandas, numpy, or scikit-learn).
- **AI/LLM:** Groq API (`llama-3.1-8b-instant`).
- **Mentioned but NOT USED:** XGBoost, ARIMA, Google Gemini API, Chart.js/Recharts.

## 3. INCOME FORECASTING
- **File/Function:** `ml_service/modules/forecast.py` -> `forecast_income(records, horizon=15)`
- **Input Features:** `date` and `income` from up to 42 recent entries.
- **Base Calculation:** Average of up to 14 most recent income entries.
- **Weekday Seasonality:** Average of up to 42 recent entries grouped by weekday, subtracted from the base average.
- **Trend (Slope) Calculation:** Requires >= 15 entries. Splits a window of up to 30 recent entries into two halves (`early` and `late`). Computes slope as `(late_avg - early_avg) / window_size`. Slope is clamped to ±8% of the base average.
- **Cold-Start Logic:** If < 15 entries, uses base + weekday adjustments only (slope = 0).
- **Forecast Horizon:** Default 15 days, clamped between 1 and 30 days.
- **Formula (per day):** `forecast = max(base + (slope * day) + weekday_delta, 0)`
- **Missing-data:** Skips malformed rows. Returns "insufficient_data" if 0 entries.
- **Output Format:** JSON array of `{"date": "...", "income": value}`.
**Classification:** (C) Mathematical/rule-based forecasting.
*Explanation:* The current implementation does not use any trained ML models (like ARIMA, XGBoost, or Random Forest). It applies purely descriptive descriptive statistics (rolling averages, static slope calculation, weekday offsets) to project future income.

## 4. VOLATILITY ANALYSIS
- **File/Function:** `ml_service/modules/volatility.py` -> `classify_volatility(records)`
- **Statistical Measure:** Coefficient of Variation (CV) = Standard Deviation / Mean.
- **Window Size:** Up to 30 most recent entries (requires at least 3).
- **Classification Labels:** "low" (<0.35), "medium" (<0.75), "high" (>=0.75). 
- **Threshold Origin / Calibration:** `train_volatility_model` scans offline CSVs for `rolling_cv_7`, sorts values, and sets `low_max_cv` to the 33rd percentile and `medium_max_cv` to the 66th percentile. These are saved to `artifacts/volatility_model.json`.
- **Classification:** Statistical/rule-based classification.

## 5. FINANCIAL HEALTH SCORE
**File:** `server/services/healthScoreService.js`

| Factor | Weight | Formula/Logic | Range/Clamping |
|---|---|---|---|
| Liquidity | 30% | `((BankBalance / MonthlyExpenses) / 3) * 100` | 0 - 100 |
| Debt Safety | 25% | `100 - ((Debt / MonthlyExpenses) * 35)` | 0 - 100 |
| Income Stability | 20% | low=90, medium=60, high=30, unknown=45 | Fixed mapping |
| Forecast Trend | 15% | `50 + ((ForecastAvg / ActualAvg) - 1) * 100` | 0 - 100 |
| Data Consistency | 10% | `60% * (TotalEntries/30*100) + 40% * (ActiveDays/RecentLength*100)` | 0 - 100 |

- **Final Calculation:** Weighted sum of all factors, clamped to `0 - 100`.
- **Phases:** Crisis (<40), Survival (<60), Stability (<80), Growth (>=80).

## 6. DECISION ROUTER
**File:** `server/services/decisionRouterService.js`
- **Blockers Generated:** "emergency fund below 1 month", "debt above 2 months of expenses", "high income volatility".

| Condition | Threshold | Action | Allowed/Blocked |
|---|---|---|---|
| liquidityMonths < 3 | Bank Balance < 3x Expenses | Build emergency fund | Allowed if true |
| debtRatio > 0.5 | Debt > 0.5x Expenses | Pay down debt | Allowed if true |
| Score >= 70 & 0 Blockers | Health Score >= 70, Liquidity >= 1 mo, Debt <= 2 mo, Volatility != high | Start conservative investing | Allowed if true |

## 7. MICRO-INVESTMENT ENGINE
**File:** `server/services/investmentEngineService.js`
- **Eligibility:** 'conservative_investing' action is allowed by Decision Router.
- **Investable Amount:** `Math.floor(max(0, min(Surplus * 0.25, SpareSavings * 0.1)))`
    *(Surplus = Income - Expenses, SpareSavings = Balance - (Expenses * 3))*
- **Hard Filters:** Drops options where: MinMonthlyAmount > InvestableAmount; MinMonthlyEarning > Income; MaxDebt < Debt; MinSavings > Savings; User Risk is low but Option is high; User Risk is low and Volatility is not low but Option is medium; Volatility is high and Option is not volatilitySafe.
- **Ranking Score (0-100):** Risk Match (30%) + Liquidity (25%) + VolatilitySafe (20%) + GigPriority (15%) + Expected Return (10%).
- **Allocation:** Top 5 passing options are returned. Total Investable Amount is split proportionally across options based on their normalized ranking scores.
- **Projection:** 12-month future value compound interest based on `expectedReturnPct`.

## 8. INVESTMENT DATASET
- **Filename:** `server/data/seed/investments-mod.csv`
- **Options Count:** 37 products
- **Columns:** `Investment_Name`, `Type`, `Expected_Return`, `Risk_Level`, `Liquidity`, `Min_Investment_Rs`, `Lock_in_Period`, `Description`, `Suitability_for_Gig_Workers`, `Safe_For_High_Volatility`, `Min_Monthly_Earning_Rs`, `Max_Debt_Rs`, `Min_Savings_Rs`, `Gig_Priority`
- **Risk Categories:** Low, Medium, High
- **Expected Return:** Parsed from percentage string (e.g., "4.0% p.a.")

## 9. AI/LLM EXPLANATION LAYER
- **Provider / Model:** Groq API / `llama-3.1-8b-instant`
- **Temperature / Timeout:** 0.2 / 12000 ms (12 seconds)
- **Source Context Passed:** JSON object of deterministic calculation outputs (health score, weak factors, router actions, forecast stats, volatility label, user balance/expenses/debt/risk).
- **Validation / Output:** Enforces strict JSON format (`overview`, `healthInsight`, `forecastInsight`, `decisionInsight`, `investmentInsight`, `reasons`, `actionPlan`, `watchOut`, `tone`).
- **Why it's an Explanation Layer:** The system prompt states: "Use only the JSON values provided. Do not calculate new numbers or invent products." The LLM acts purely as a natural language synthesizer for the deterministic output of the math/rule engines. It holds no authority over numerical recommendations or action gating.

## 10. DATABASE / DATA MODEL
- **MongoDB Collections:**
  - `User`: Profile, riskPreference, bankBalance, monthlyExpenses, debts.
  - `DailyIncomeEntry`: date, income.
  - `IncomeAnalytics`: Cached results of forecast, volatility, health score, router rules.
  - `InvestmentSuggestion`: Curated and allocated investment results.
  - `AiExplanation`: Stored LLM natural-language output.

## 11. DATASETS USED FOR ANALYTICS
- **Testing Synthetic Data:** `server/seed_user.js` (generates 60 days of synthetic data for testing).
- **Calibration Data:** Mentioned as offline CSV files used by `train_volatility_model` to extract `rolling_cv_7` thresholds. (Not shipped in production).

## 12. CURRENT IMPLEMENTATION STATUS

| Feature | Implemented? | Evidence/File | Notes |
|---|---|---|---|
| Forecasting | Yes | `ml_service/modules/forecast.py` | Math/Rules, not ML |
| Volatility | Yes | `ml_service/modules/volatility.py` | Statistical CV |
| Health Score | Yes | `healthScoreService.js` | Weighted Multi-Factor |
| Decision Router | Yes | `decisionRouterService.js` | Rule-based gating |
| Investment Engine | Yes | `investmentEngineService.js` | Filter, Score & Allocate |
| LLM Explanation | Yes | `aiExplanationService.js` | Groq Llama-3.1 |

## 13. IMPORTANT DOCUMENTATION CONFLICTS
- **ML Models:** `wholeprojectcontext.md` and `README.md` claim usage of XGBoost and advanced ML for forecasting/classification. The actual code uses purely mathematical/statistical computations (Rolling Averages, Slope, Standard Deviation).
- **LLM Provider:** Documentation plans for Google Gemini API integration. The codebase actually implements Groq API (`llama-3.1-8b-instant`).
- **Investment Engine:** README states the Investment Recommendation Engine is a planned future feature. It is actually fully implemented.

## 14. PAPER-USEFUL FACTS
### Strong Claims Supported Directly by Code
1. The system features a hardcoded graceful degradation mechanism that bypasses LLM failures or ML service downtime to ensure 100% dashboard uptime.
2. The ML service requires zero external computational dependencies (no scikit-learn/pandas), utilizing purely the Python standard library for extreme lightweight scaling.
3. The AI is strictly sandboxed as an explanation layer; all gating, allocations, and financial logic are entirely deterministic and rule-based.
4. Volatility is derived using the Coefficient of Variation, comparing the Standard Deviation to the Mean over a 30-day window.
5. The Health Score calculates a single 0-100 metric by weighting 5 unique financial facets (Liquidity, Debt Safety, Income Stability, Forecast Trend, Data Consistency).
6. Micro-investment allocations cap investments strictly at 25% of monthly surplus or 10% of spare savings, whichever is lower.
7. The decision router acts as a hard gatekeeper, completely blocking investments if emergency funds fall below 1 month of expenses or if debt exceeds 2 months.

### Claims NOT Supported
- Do not claim the system uses XGBoost, ARIMA, or any predictive ML model with learned weights.
- Do not claim the system uses Google Gemini.
- Do not claim the LLM calculates financial advice directly.

### Easy Numbers Available
- Max Forecast Horizon: 30 days (default 15).
- Investment Options Available: 37 products.
- LLM API Timeout: 12 seconds.
- Score Phase Thresholds: Crisis < 40, Survival < 60, Stability < 80, Growth >= 80.
