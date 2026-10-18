# Architecture and current behavior

[Overview](../README.md) · [Startup](../STARTUP.md) · [API](API.md) · [Research evidence](RESEARCH.md)

This page describes the application source as reviewed on **2026-10-19**. Research candidates are identified separately in the research guide.

## Request and data flow

1. The React client authenticates through Express and sends its JWT as a bearer token. The current client keeps the token in browser local storage.
2. Express reads and writes user profiles and daily income in MongoDB. An income write triggers an asynchronous analytics refresh.
3. The analytics controller loads date-sorted entries. With sufficient history, it calls Python `/analyze` for forecast and volatility results.
4. The backend calculates health, applies the conservative router, and stores the combined analytics snapshot. It then refreshes investment suggestions and attempts a snapshot explanation.
5. Dashboard reads can observe a previous snapshot while the asynchronous refresh is running. Investment reads recheck readiness using the current profile and stored analytics rather than trusting a cached permission alone.

The backend requires at least three income entries before requesting normal analytics. Insufficient history produces empty forecasts, unknown volatility, an insufficient-data health phase, and blocked investment readiness. Python-service failures are recorded as analytics errors and also block readiness.

## Frontend

The active application is wired through [client/src/App.jsx](../client/src/App.jsx), using components under `client/src/modules/`. Older files under `client/src/pages/` are not the route definition.

| Route | Purpose |
|---|---|
| `/` | Landing page |
| `/login`, `/signup` | Authentication |
| `/onboarding` | Financial profile |
| `/dashboard` | Dashboard overview |
| `/dashboard/enter-data` | Income entry |
| `/dashboard/income-history` | Recorded income |
| `/dashboard/forecasts` | Forecast and volatility views |
| `/dashboard/health` | Health score and router decisions |
| `/dashboard/investments` | Investment recommendations |
| `/dashboard/chat` | Conversational assistant |

Onboarding and dashboard routes require a client token; Express independently checks protected requests. Chat state is held in the dashboard provider during navigation, with no backend conversation model for durable chat history. The frontend API base is currently hardcoded to `http://localhost:5000/api`.

## Forecasting

Source: [ml_service/modules/forecast.py](../ml_service/modules/forecast.py).

The deployed method is deterministic:

- Sort usable income records by date and clamp negative income to zero.
- Set the base to the mean of the most recent 14 entries, or all available entries if shorter.
- Estimate weekday adjustments from up to 42 recent entries.
- With at least 15 entries, estimate a slope from the difference between the early and late means of up to 30 entries, divided by the window length. Clamp the slope to ±8% of the base.
- For each future day, combine base, lead-scaled slope, and weekday adjustment; clip at zero and round to two decimals.

The default horizon is 15 days. For nonempty histories the function clamps the horizon to 1–30. Short histories use method identifier `cold_start_rolling_weekday`; longer histories use `trend_weekday`. Direct Python calls can forecast from fewer than three entries, although application orchestration requires three.

ETS, ARIMA/SARIMA, gradient boosting, robust and quantile variants, conformal intervals, and mean/median blends exist in the evaluation tooling. They are not the deployed forecaster. See [forecast evaluation](RESEARCH.md#forecasting).

## Volatility

Source: [ml_service/modules/volatility.py](../ml_service/modules/volatility.py).

Runtime CV is sample standard deviation divided by mean income over up to **30 recent entries**. The classifier returns `unknown` below three usable entries.

| Runtime CV | Label |
|---|---|
| `< 0.45` | `low` |
| `>= 0.45` and `< 0.75` | `medium` |
| `>= 0.75` | `high` |

Entries are not automatically a complete calendar-day series. These runtime categories also differ from the forward-looking research target, which uses realized CV over future income and training-derived target cutoffs. Neither should be silently substituted for original dataset labels.

An all-zero recent history currently produces CV zero and a `low` label. This is a known defect. The router separately rejects a nonpositive recent mean, so that label alone cannot authorize investing.

## Financial-health score

Source: [server/services/healthScoreService.js](../server/services/healthScoreService.js).

Each component is clipped to 0–100, then combined and rounded:

| Component | Weight | Current basis |
|---|---:|---|
| Liquidity | 30% | Bank balance divided by monthly expenses; full component credit at three months |
| Debt safety | 25% | `100 - 35 × debt / monthly expenses` |
| Income stability | 20% | Volatility label maps to low: 90, medium: 60, high: 30, unknown: 45 |
| Forecast trend | 15% | Forecast average relative to the last 14 actual entries |
| Data consistency | 10% | 60% history-length score and 40% positive-income share of recent entries |

The liquidity and debt components floor their expense denominator at one. This is a computational safeguard, not economic validation. Fewer than three entries force score zero and phase `insufficient_data`.

| Score | Phase |
|---|---|
| `< 40` | `crisis` |
| `40–59` | `survival` |
| `60–79` | `stability` |
| `80–100` | `growth` |

Weights are engineering choices, not empirically optimal coefficients. The debt-to-expense formulation can reward increasing reported expenses in some fixed-profile comparisons. Absolute income increases need not improve the score. Candidate corrections were evaluated but not deployed because their selection guard failed; see [score_decision.md](../score_decision.md).

## Conservative readiness router

Source: [server/services/decisionRouterService.js](../server/services/decisionRouterService.js).

Every mandatory condition must pass:

| Condition | Requirement |
|---|---|
| Financial inputs | Finite numeric bank balance and debt, both nonnegative; finite monthly expenses greater than zero |
| Liquidity | Bank balance **at least 3 × monthly expenses** |
| Debt | Debt **at most 0.5 × monthly expenses** |
| Health | Finite score **at least 70**, at most 100, and a phase consistent with that score |
| Volatility | Known `low` or `medium` label |
| Analytics state | No error; status, when supplied, must be `ready` |
| Volatility features | At least three entries, positive finite recent mean, nonnegative finite standard deviation and CV, consistent within rounding tolerance |
| Forecast | Recognized method; integer horizon 1–30; matching point count; consecutive valid dates; finite nonnegative incomes with at least one positive value and a finite total |

Equality passes the liquidity, debt, and health thresholds when the other requirements hold. HIGH/unknown volatility and absent or malformed analytics fail closed. The router also emits emergency-fund and debt-reduction actions with reasons.

These checks establish consistency with an explicit engineering policy. They do not prove that analytics are fresh, that supplied values match original records, or that an allowed user will avoid financial shortfall. There is no timestamp freshness check in this validator.

## Investment engine

Source: [server/services/investmentEngineService.js](../server/services/investmentEngineService.js).

The engine uses a curated catalogue of 37 products. Read and refresh paths re-evaluate the router using the current profile and stored analytics/health. A passing gate can still yield no recommendation because the budget is zero or products fail constraints.

Monthly income is estimated from up to 30 recent entries: use their sum when at least 25 are available, otherwise extrapolate their mean to 30. This is an entry-based estimate, not calendar reconciliation.

```text
surplus = max(monthlyIncome - monthlyExpenses, 0)
spareBalance = max(bankBalance - 3 × monthlyExpenses, 0)
investableAmount = floor(max(0, min(0.25 × surplus, 0.10 × spareBalance)))
```

Hard filters check product minimum investment, minimum income, maximum absolute debt, minimum savings, and risk/volatility restrictions. The product debt cap is distinct from the router's debt-to-expense ratio. Ranking weights risk fit (30%), liquidity (25%), volatility safety (20%), gig-worker priority (15%), and the catalogue return field (10%). The top five candidates enter allocation. The allocator removes infeasible low-ranked candidates and redistributes integer amounts while respecting minimums; displayed allocation percentages sum to 100 when recommendations exist.

The model includes a risk-preference field, defaulting to `low`; the current onboarding controller does not update that field. Do not assume that submitting a new risk preference through onboarding changes recommendations.

Return projections use catalogue assumptions. There is no broker integration, trade execution, historical market backtest, or demonstrated profitability.

## Two different language-model paths

| Property | Snapshot explanation | Free-form chat |
|---|---|---|
| Source | [aiExplanationService.js](../server/services/aiExplanationService.js) | [chatService.js](../server/services/chatService.js) |
| Input | Deterministic financial/decision snapshot | Snapshot context, recent income context, and recent messages |
| Output | Structured template choice and facts, then server-rendered text | Provider-generated text |
| Validation | Schema and exact typed facts checked against snapshot | No equivalent numerical or decision validator |
| Provider configuration | Pinned JSON model; temperature zero | `GROQ_MODEL` override; temperature 0.7 |
| Provider/invalid-output failure | Deterministic fallback explanation | Request error; no server-side deterministic chat fallback |

Both paths use [groqService.js](../server/services/groqService.js). The snapshot path catches provider, parse, and validation failures; database or snapshot-construction errors can still fail outside that fallback boundary. The constrained-explanation audit does not establish chat quality or chat numerical fidelity.

## Persistence and operational boundaries

| Model | Stored information |
|---|---|
| `User` | Account, hashed password, onboarding and financial fields |
| `DailyIncomeEntry` | Daily income/work record; unique by user and date |
| `IncomeAnalytics` | Forecast, volatility, health, router, status and timestamps |
| `InvestmentSuggestion` | Persisted recommendation snapshot from refresh operations |
| `AiExplanation` | Source snapshot, explanation, fallback/status/error information |

Re-entering a date replaces that user's daily record; platform is not part of the uniqueness key. No calendar imputation happens automatically. Stored analytics and explanations can lag profile or income changes.

The local defaults include permissive CORS, browser-local token storage, no authentication on the Python service, and an API address embedded in frontend source. Production deployment would require additional operational and security work. Keep the Python service bound to loopback for the documented local setup.
