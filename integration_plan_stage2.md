# Stage 2 Integration Plan

Goal: add Financial Health Score + Smart Decision Router using Stage 1 analytics, then show score, decisions, income charts, and model-output charts across existing dashboard routes.

## Current Baseline

- Stage 1 exists: FastAPI `/analyze`, Express `/api/analytics/run`, Mongo `IncomeAnalytics`, dashboard cards.
- Available inputs:
  - `User`: `bankBalance`, `monthlyExpenses`, `debts`, `investments`
  - `DailyIncomeEntry`: income history
  - `IncomeAnalytics`: forecast points + volatility label/score
- Frontend has space: `DashboardHome`, `Route1`, `Route2`, `Route3`.
- No chart library is installed; use small inline SVG/CSS chart components for minimum tokens.

## Target Output

Store and display:

- `healthScore`: 0-100
- `phase`: `crisis | survival | stability | growth`
- `decisionRouter`: actions with `allowed`, `blocked`, `reason`
- charts:
  - historical daily income
  - forecast income
  - actual vs forecast
  - volatility/score summary

## Implementation Steps

### 1. Add Scoring + Router Logic

Keep this in Express for Stage 2 because it uses Mongo user profile + saved Stage 1 analytics.

Create:

```text
server/services/healthScoreService.js
server/services/decisionRouterService.js
```

Formula inputs:

- liquidity: `bankBalance / monthlyExpenses`
- debt burden: `debts / max(monthlyExpenses, 1)`
- income stability: volatility label/score
- forecast strength: forecast average vs recent actual average
- consistency: recent working days + entry count

Use transparent weighted scoring, no ML model.

Suggested weights:

- liquidity 30
- debt safety 25
- income stability 20
- forecast trend 15
- data consistency 10

Phase mapping:

- `0-39 crisis`
- `40-59 survival`
- `60-79 stability`
- `80-100 growth`

Router rules:

- High debt blocks investing, recommends debt payoff.
- Low liquidity blocks investing, recommends emergency fund.
- High volatility limits investing, recommends safer cash buffer.
- Score >= 70 and no blockers allows conservative investing.

### 2. Extend Analytics Persistence

Extend `server/models/IncomeAnalytics.js` with:

```js
health: { score, phase, factors, generatedAt }
router: { actions: [{ key, allowed, reason }], summary, generatedAt }
```

Update `runAnalyticsForUser`:

1. fetch entries
2. call Stage 1 ML service
3. fetch user profile
4. compute health score
5. compute router output
6. upsert one combined analytics document

Keep `/api/analytics/me` unchanged so frontend gets all outputs from one call.

### 3. Add Chart Data API

Add `GET /api/analytics/charts` protected.

Return compact data:

```json
{
  "history": [{ "date": "...", "income": 1000 }],
  "forecast": [{ "date": "...", "income": 1200 }],
  "volatility": { "label": "medium", "score": 0.42 },
  "health": { "score": 68, "phase": "stability" }
}
```

This avoids each route re-fetching and shaping raw entries separately.

### 4. Frontend Route Usage

Create shared helpers:

```text
client/src/services/analyticsApi.js
client/src/components/charts/SimpleLineChart.jsx
client/src/components/charts/SimpleBarChart.jsx
client/src/components/charts/ScoreGauge.jsx
```

Use routes:

- `DashboardHome`: score, phase, top router summary, forecast/volatility cards.
- `Route1`: income history line/bar chart + recent entries table.
- `Route2`: forecast chart + actual vs forecast chart.
- `Route3`: decision router actions + health factor breakdown + volatility card.

Rename sidebar labels later if desired; route paths can stay as-is for minimum changes.

### 5. Manual Demo Flow

- Run ML service, backend, frontend.
- Seed or enter 15+ income records.
- Complete onboarding fields for balance/expenses/debts.
- Click dashboard `Refresh`.
- Verify:
  - score and phase appear
  - router allows/blocks actions with reasons
  - all three routes show charts using real user/forecast data
  - cold-start users still get a score with lower data-consistency factor

## Acceptance Checklist

- [x] Health score is persisted in `IncomeAnalytics`.
- [x] Router output is persisted and returned by `/api/analytics/me`.
- [x] `/api/analytics/charts` returns history + forecast data.
- [x] Dashboard home shows score, phase, and router summary.
- [x] Route1 shows historical income chart.
- [x] Route2 shows forecast/model-output chart.
- [x] Route3 shows router decisions and factor breakdown.
- [x] No new ML training needed for Stage 2.

## Recommended Order

1. Add health score service.
2. Add decision router service.
3. Extend `IncomeAnalytics` and analytics controller.
4. Add chart endpoint.
5. Add small frontend API helper + SVG charts.
6. Fill `Route1`, `Route2`, `Route3`.
7. Build and manually test.

