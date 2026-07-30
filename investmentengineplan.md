# Micro-Investment Engine Plan

Goal: suggest safe, gig-worker-friendly investment options only after Stage 2 marks the user eligible to invest.

## Current Baseline

- Stage 1: income forecast + volatility stored in `IncomeAnalytics`.
- Stage 2: health score + decision router available in analytics.
- User profile has `bankBalance`, `monthlyExpenses`, `debts`, `investments`.
- Income history exists in `DailyIncomeEntry`.
- Frontend dashboard routes can display output with minimal styling.

## Data Source Note

The initial investment option catalog (36 options) is a **hand-curated dataset**, compiled manually from public rate sheets (Post Office schemes, RBI bonds, bank FDs, AMC-published fund categories, gold-linked instruments) at the time this plan was written. It is **not** pulled from a live feed and **will go stale** — rates like FD %, POMIS %, and fund YTMs move over time.

- File: `investments-mod.csv` (36 rows, 14 columns — see Step 1 for schema mapping)
- Curated by: [your name], [approx. date — fill in]
- Treat as a **seed/reference dataset**, not a source of truth for current rates
- Revisit and refresh manually every 3–6 months until a live data step is added (see "Future Work")

## Target Output

Persist and show:

- `eligible`: true/false from Stage 2 router.
- `investableAmount`: conservative monthly amount.
- `riskProfile`: `low | medium | high`, default `low` unless user later chooses.
- `suggestions`: top 3-5 options with score, allocation, expected return range, liquidity, risk, reason tags.
- `blockedReason`: router reason when user is not eligible.

## Implementation Steps

### 1. Add Investment Option Data

Use the curated CSV as the seed source — do not have the agent invent option data.

**Files:**

```text
server/data/seed/investments-mod.csv       # raw curated source, unmodified
server/data/investmentOptions.js           # normalized/parsed output used by the engine
server/models/InvestmentSuggestion.js
server/services/investmentEngineService.js
```

Place `investments-mod.csv` at `server/data/seed/investments-mod.csv` in the project folder. `investmentOptions.js` is generated/written once from this CSV (either by a one-time parsing script or by hand) — it is the *cleaned* version the engine actually reads at runtime. Keep the raw CSV in the repo for traceability/re-parsing later.

**Schema mapping (CSV → engine fields):**

| CSV column | Engine field | Notes / normalization needed |
|---|---|---|
| `Investment_Name` | `name` | direct copy |
| `Type` | `type` | direct copy |
| `Expected_Return` | `expectedReturnPct` | **parse out numeric %** from strings like `"6.9% p.a."`, `"~7.0% p.a. (YTM)"`, `"Gold price linked"`. Where return is non-numeric (gold-linked), store `expectedReturnPct: null` and keep the raw text in `tags` or a `returnNote` field. |
| `Risk_Level` | `riskLevel` | map `Very Low/Low/Low-Medium/Medium/High` → your `low\|medium\|high` scale; decide how `Low-Medium` buckets (recommend: `low` for filtering, tag it for scoring nuance) |
| `Liquidity` | `liquidity` | direct copy (`Low/Medium/High`) |
| `Min_Investment_Rs` | `minMonthlyAmount` | **parse out numeric value** from strings like `"100 (SIP)"`, `"500 per month"` — strip suffixes, keep the SIP/lump-sum distinction as a tag if needed |
| `Lock_in_Period` | new field `lockInPeriod` | not in original schema — add it, useful for liquidity fit scoring |
| `Description` | `tags` or new `description` field | short static text is fine here |
| `Suitability_for_Gig_Workers` | feeds `gigPriority` reasoning | free text — use to help set `gigPriority` score, don't surface as prose per plan's "no explanation text" rule |
| `Safe_For_High_Volatility` | `volatilitySafe` | `Yes/No` → boolean |
| `Min_Monthly_Earning_Rs` | new eligibility field | use in Step 2/3 filtering — a legitimate hard filter you didn't have before |
| `Max_Debt_Rs` | new eligibility field | same — hard filter candidate |
| `Min_Savings_Rs` | new eligibility field | same — hard filter candidate |
| `Gig_Priority` | `gigPriority` | already numeric (1–5) — direct copy |

**Action for the coding agent:** write a small one-time normalization script (or do it by hand given only 36 rows) that reads the CSV and emits `investmentOptions.js` in the exact shape the engine expects. Flag any row where automatic % or ₹ parsing is ambiguous rather than guessing silently.

### 2. Derive Real User Inputs

No questionnaire for now.

- earning level: recent average income from `DailyIncomeEntry`
- debt/savings: `User` onboarding fields
- income steadiness: `IncomeAnalytics.volatility.label`
- investable amount: conservative surplus from recent income minus monthly expenses, capped by available liquidity
- risk tolerance: default `low`; allow `User.riskPreference` later
- eligibility: router action `conservative_investing.allowed === true`

### 3. Scoring Logic

Use filters first, then weighted score.

**Hard filters:**

- router says investing is allowed
- option minimum amount <= investable amount
- high-risk options blocked if volatility is high/medium and risk profile is low
- user's monthly earning >= option's `Min_Monthly_Earning_Rs`
- user's debt <= option's `Max_Debt_Rs`
- user's savings >= option's `Min_Savings_Rs`

**Score weights:**

- risk match 30
- liquidity fit 25
- volatility safety 20
- gig priority 15
- return potential 10

**Forecast adjustment:**

- falling/weak forecast increases liquidity weight and reduces risky options.
- stable/rising forecast allows slightly higher allocation to SIP/index options.

**Projection:**

- calculate 12-month low/median/high range using expected return +/- simple risk band.
- for options where `expectedReturnPct` is null (gold-linked), skip numeric projection or use a documented placeholder band — don't fabricate a return figure.
- keep output numeric + reason tags, not long explanation text.

### 4. Pipeline Integration

Extend `runAnalyticsForUser` after health/router:

1. compute Stage 1 + Stage 2 outputs
2. if router blocks investing, save blocked investment state
3. if eligible, run investment engine
4. persist in `InvestmentSuggestion`

Add routes:

- `GET /api/investments/me`
- optional `POST /api/investments/run`

Do not call external APIs during dashboard load.

### 5. Frontend Display

Use existing routes:

- `DashboardHome`: show top suggestion or blocked reason.
- `Route3`: add investment eligibility + router state.
- Add/repurpose one route section for suggestion cards:
  - option name/type
  - allocation amount
  - projected low/median/high
  - reason tags

Keep styling minimal; no prose-heavy explanations yet.

### 6. Demo Data

Seed or create one eligible user:

- 30+ income entries
- low/medium volatility
- health score >= 70
- bank balance >= 3 months expenses
- low debt

Verify ineligible users still see Stage 2 blocked reason, not suggestions.

## Acceptance Checklist

- Investment suggestions are skipped when router blocks investing.
- Eligible user gets 3-5 ranked suggestions.
- Suggestions are persisted and returned by API.
- Dashboard shows blocked state or suggestions correctly.
- Output includes structured reason tags and projection ranges.
- No Gemini/natural-language explanation is added in this stage.
- CSV-to-`investmentOptions.js` normalization is documented and reviewable (no silent parsing guesses on ambiguous rows).

## Recommended Order

1. Add investment option seed data (place raw CSV in `server/data/seed/`, write normalization step, generate `investmentOptions.js`).
2. Add investment engine service.
3. Add `InvestmentSuggestion` model + routes.
4. Wire engine into analytics refresh.
5. Add frontend suggestion display.
6. Seed eligible user and test end to end.

## Future Work (explicitly out of scope for this stage)

- Replace/supplement static CSV data with a live source, e.g. free AMFI-based mutual fund NAV APIs for the MF-type options (SIP/index/liquid/debt funds). FD/RD/POMIS/SGB rates have no reliable public API and will likely stay manually refreshed.
- Periodic re-curation cadence for the static dataset (suggest every 3–6 months) since several rows (FD ranges, floating rate bonds) are time-sensitive.
- Natural-language explanation layer (explicitly deferred — "No Gemini/natural-language explanation is added in this stage").
