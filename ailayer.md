# AI Layer Integration Plan

Goal: add a Groq-powered explanation layer that turns existing analytics into short, useful, plain-English guidance woven into the dashboard experience.

## Current Baseline

- Stage 1: forecast + volatility stored in `IncomeAnalytics`.
- Stage 2: health score + decision router stored in `IncomeAnalytics`.
- Stage 3: investment suggestions stored in `InvestmentSuggestion`.
- Express backend owns auth, Mongo, pipeline orchestration, and dashboard APIs.
- Frontend dashboard already shows numeric cards, charts, health decisions, and investments.

## Principle

The AI must not calculate, decide eligibility, invent numbers, or replace the existing rules. It explains already-computed outputs in simple, contextual language.

It should feel like smart guidance inside the product, not a standalone chatbot/card sitting in the corner.

## Target Output

Persist one explanation per user:

```js
{
  overview: { headline, summary, nextAction },
  healthInsight,
  forecastInsight,
  decisionInsight,
  investmentInsight,
  reasons: [string, string, string],
  tone: "safe" | "caution" | "growth",
  sourceSnapshot,
  generatedAt,
  status: "ready" | "fallback" | "error"
}
```

Each field should be short enough to sit near the UI section it explains.

## Backend Design

```text
server/models/AiExplanation.js
server/services/groqService.js
server/services/aiExplanationService.js
server/controllers/aiExplanationController.js
server/routes/aiExplanationRoutes.js
```

- `GET /api/ai/explanation/me`
- `POST /api/ai/explanation/run`

- `GROQ_API_KEY`
- `GROQ_MODEL` default from env, not hardcoded
- optional `GROQ_TIMEOUT_MS=12000`

Use native `fetch`; no SDK required unless needed later.

## Input Snapshot

Build a compact snapshot from Mongo:

- health: score, phase, top weak factors
- router: allowed/blocked actions + reasons
- forecast: horizon, total, average, method/note
- volatility: label, CV if present
- investment: eligible, blocked reason, top suggestion, investable amount, reason tags
- user context: monthly expenses, debt, balance bucket only; avoid exposing email/name to Groq unless needed

Never send raw daily income history.

## Prompt Contract

System prompt:

- Explain like a cautious financial advisor for gig workers.
- Use only provided values.
- Do not invent returns, scores, dates, or products.
- Do not give legal/guaranteed financial advice.
- Prefer safety: emergency fund, debt, liquidity before investment.
- Return strict JSON only.

Expected JSON:

```json
{
  "overview": {
    "headline": "...",
    "summary": "...",
    "nextAction": "..."
  },
  "healthInsight": "...",
  "forecastInsight": "...",
  "decisionInsight": "...",
  "investmentInsight": "...",
  "reasons": ["...", "...", "..."],
  "tone": "safe"
}
```

Validate all fields before saving.

## Fallback

If Groq fails, times out, rate limits, or returns invalid JSON:

- generate deterministic fallback from saved numbers
- save with `status: "fallback"`
- dashboard still shows a useful explanation

Example fallback logic:

- score < 60: focus on emergency fund/debt
- router blocks investing: use router blocked reason
- investment eligible: mention top suggestion and monthly amount

## Pipeline Integration

Extend the existing refresh flow:

1. analytics refresh runs
2. investment suggestion refresh runs
3. AI explanation refresh runs from saved analytics + investment
4. save to `AiExplanation`

Do not call Groq during dashboard page load.

Manual refresh:

- dashboard `Refresh` may call analytics refresh, then fetch explanation
- AI route can also regenerate explanation directly for testing

## Frontend Integration

Add reusable contextual components:

```text
client/src/components/AiInsightStrip.jsx
client/src/components/AiInlineNote.jsx
client/src/services/aiApi.js
```

Placement:

- `DashboardHome`: compact smart strip under welcome: headline, summary, next action.
- Health card/Route3: `healthInsight` near score/factor bars.
- Forecast card/Route2: `forecastInsight` near forecast chart.
- Decisions section: `decisionInsight` above router actions.
- Investment Suggestions page: `investmentInsight` above suggestion cards or blocked reason.

Design behavior:

- Use the existing card/bento style, but render AI text as inline guidance.
- No chatbot UI, no large AI-only page, no prompt box.
- Keep numeric cards/charts as the source of truth; AI text supports them.
- Use subtle labels like `In plain words` or `What this means`.
- If fallback is used, show the same UI with a tiny `basic insight` label only if needed.

## Safety Rules

- Never show AI text as the only source of truth.
- Keep exact numeric outputs from existing backend modules.
- Sanitize/validate Groq JSON before rendering.
- Store source snapshot for audit/debug.
- Keep generated text concise; max 90-120 words total.
- English only for this stage.

## Universal User Handling

The explanation builder must handle:

- new users with little/no income data
- cold-start forecast users
- ineligible users blocked by router
- eligible users with investment suggestions
- Groq unavailable or rate-limited

Every path should return a non-empty explanation.

## Acceptance Checklist

- `POST /api/ai/explanation/run` generates and stores explanation.
- `GET /api/ai/explanation/me` returns latest explanation.
- Groq response is strict JSON and validated.
- Fallback works without `GROQ_API_KEY`.
- Existing analytics/investment math remains unchanged.
- Dashboard shows AI summary without live LLM calls.
- Explanation matches stored score/router/investment state.

## Recommended Order

1. Add `AiExplanation` model.
2. Add snapshot builder + fallback generator.
3. Add Groq service with timeout + JSON validation.
4. Add AI routes/controllers.
5. Wire AI refresh after investment refresh.
6. Add frontend `AiInsight` display.
7. Test normal Groq path and forced fallback path.
