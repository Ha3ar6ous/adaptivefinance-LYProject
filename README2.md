# Adaptive Finance - New Modules

This document details the newer modules and architectures implemented in the Adaptive Finance backend. It supplements the main `README.md` and focuses on the **Micro-Investment Framework**, **Investment Recommendation Engine**, and the **AI/LLM Explanation Layer**.

---

## 1. Micro-Investment Framework

The Micro-Investment Framework acts as the final stage of the financial decision pipeline. It evaluates a user's preparedness to take on financial risk and, if eligible, calculates safe investment capacity.

### Role in the Pipeline
The framework is gated by the **Decision Router** (`decisionRouterService.js`). It ensures that vulnerable gig workers do not invest if they lack basic financial safety nets.

### Eligibility & Safety Logic
Investing is categorized under the `conservative_investing` action in the router. It is **Allowed** only if:
1. **Health Score is $\ge$ 70.**
2. **No Critical Blockers Exist:**
   - **Liquidity Blocker:** Emergency fund (bank balance) must be $\ge$ 1 month of expenses.
   - **Debt Blocker:** Total debt must be $\le$ 2 months of expenses.
   - **Volatility Blocker:** Income volatility (calculated by the ML service) must not be labeled as `high`.

If any blocker exists or the score is too low, the router **Blocks** the investment action and outputs safety-first directives (e.g., "Build emergency fund" or "Pay down debt").

### Investable Amount Calculation
If eligible, the framework derives the safe `investableAmount` (`investmentEngineService.js`) using the following deterministic formula:
1. **Monthly Income:** Actual sum of the last 30 days, or a 30-day extrapolated average if fewer entries exist.
2. **Surplus:** `max(0, Monthly Income - Monthly Expenses)`
3. **Emergency Reserve:** `Monthly Expenses * 3`
4. **Spare Savings:** `max(0, Bank Balance - Emergency Reserve)`
5. **Investable Amount:** The engine safely limits investment to `min(Surplus * 25%, Spare Savings * 10%)`.

---

## 2. Investment Recommendation Engine

Once the user is eligible and an `investableAmount > 0` is established, the Investment Engine filters, scores, and ranks curated investment products.

### Investment Dataset
The engine parses a curated CSV (`server/data/seed/investments-mod.csv` via `investmentOptions.js`). 
It normalizes the data into standard types:
- `expectedReturnPct` (Numeric, derived from string)
- `riskLevel` (low/medium/high)
- `liquidity` (Low/Medium/High)
- `volatilitySafe` (Boolean)
- Hard requirement thresholds: `minMonthlyAmount`, `minMonthlyEarning`, `maxDebt`, `minSavings`.

### Hard Filters
Before scoring, options are strictly filtered (`hardFilter`):
- Option's `minMonthlyAmount` $\le$ User's `investableAmount`.
- User's Income $\ge$ Option's `minMonthlyEarning`.
- User's Debt $\le$ Option's `maxDebt`.
- User's Savings $\ge$ Option's `minSavings`.
- **Risk Mismatch:** A 'low' risk user cannot be shown 'high' risk options.
- **Volatility Protection:** If the user has 'high' income volatility, the option *must* be flagged as `volatilitySafe`.

### Weighted Scoring Logic
Eligible options are scored out of 100 using a 5-factor weighted formula:

| Factor | Weight | Calculation Logic |
|--------|--------|-------------------|
| **Risk Match** | 30% | Decreases by 45 points for every step of mismatch between user preference and option risk level. |
| **Liquidity** | 25% | Based on liquidity rank (Low=1, Medium=2, High=3). If the user's ML *forecast ratio* is poor ($< 0.9$), liquidity scores are boosted by 20 points. |
| **Volatility Safety** | 20% | 100 points if the option is explicitly marked safe for volatile incomes; otherwise 45 points. |
| **Gig Priority** | 15% | Scaled based on a curated `gigPriority` rating (1-5) from the dataset. |
| **Expected Return** | 10% | Scaled up to 100 based on the percentage return (Return% * 10). |

### Output and Allocation
The engine sorts options by score descending and selects the top 5. It calculates a proportional `allocationPct` based on the relative scores and assigns an `allocationAmount`. Finally, it computes a 12-month low/median/high future projection (`projectionFor`) using the option's `expectedReturnPct` and risk bands. The result is persisted in the `InvestmentSuggestion` MongoDB collection.

---

## 3. AI/LLM Explanation Layer

The AI Explanation layer translates the deterministic outputs (Health, ML Forecast, Router, Investment Engine) into empathetic, actionable, human-readable insights. 

### Provider and Architecture
- **Provider:** Groq Cloud API (`groqService.js`)
- **Model:** `llama-3.1-8b-instant` (via OpenAI compatibility layer)
- **Format Enforcement:** Uses `response_format: { type: 'json_object' }` with low temperature (`0.2`) to ensure deterministic JSON structure.
- **Timeout:** Fast 12-second abort timeout.

### Snapshot/Context Builder
The `aiExplanationService.js` builds a `sourceSnapshot` object containing:
- Health score, phase, and the top two weakest factors.
- Router summary and allowed/blocked actions.
- Forecast total, horizon, direction, and Volatility CV.
- Investment eligibility, top suggestion name, and allocated amount.
- User context (balance buckets, expenses, debt, risk preference).

### Prompt Contract
The LLM operates under a strict system prompt:
> *"You are a cautious financial advisor for Indian gig workers. Use only the JSON values provided. Do not calculate new numbers or invent products. Do not promise returns... Avoid generic encouragement. Prefer concrete actions around cash buffer, debt, volatility, and small safe investments."*

### Validation and Fallback
The backend actively validates the LLM's JSON output (`validateExplanation`). It enforces length limits and requires specific keys: `overview`, `healthInsight`, `forecastInsight`, `decisionInsight`, `investmentInsight`, `reasons`, `actionPlan`, `watchOut`, and `tone`.

**Graceful Degradation:** If Groq times out, throws a 500, or returns invalid JSON, the service instantly fails over to `fallbackFromSnapshot`. This local function dynamically generates the exact same JSON structure using deterministic template strings, ensuring the frontend UI never breaks. The AI solely acts as an explanation layer; it has no authority to alter financial math, predictions, or router decisions.
