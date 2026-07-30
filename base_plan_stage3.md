# Gig Income + Volatility ML Integration — High-Level Plan

> This is a starting-point plan, not a strict spec. Read the actual codebase
> (notebooks, existing FE/BE, CSVs) and expand each phase into a more detailed
> plan.md before implementing. Feel free to reorder or merge small steps if
> the code shows a better path.

## Context (current state)
- MERN app: frontend, backend, auth, and a daily "punch-in" income entry
  module are already built.
- **Stage 1 (DONE)** and **Stage 2 (DONE)** — summarized below for context only.
  No further work needed on either; do not touch their files.
- **Goal now: Stage 3 — Micro-Investment Suggestion Engine** is the only
  active work. Full phase breakdown is below — work through it top to bottom.

---

# Stage 1 — Income Forecast + Volatility Model (DONE)

Fixed the volatility classifier's label-leakage bug and retrained it on
expanded synthetic data; added a cold-start fallback (rolling average +
day-of-week adjustment) to the income forecaster for low-history users while
keeping the ARIMA path for users with enough history. Converted both
notebooks into plain Python modules (function-based, DataFrame/record input,
no notebook-only plotting), stood up a FastAPI ML service exposing
prediction endpoints for both models, and wired the Node backend to pull
user data, call the service, and persist results in MongoDB on a periodic/
triggered basis. Demoed end-to-end with two seeded dummy users (one
low-history/cold-start, one full-history) — dashboard shows real forecast
and volatility output on login, not placeholders.

**Status: complete, confirmed working. No action needed.**

---

# Stage 2 — Financial Health Score + Smart Decision Router (DONE)

Built a transparent, weighted-formula Financial Health Score (0-100 +
phase label: crisis / survival / stability / growth) fed by punch-in
income history, onboarding financial data, the Stage 1 volatility label,
and the income forecast trend. Paired it with a rule-based Smart Decision
Router (if-then logic, no model) that takes the health score + emergency
fund status + volatility label and outputs which actions are currently
allowed (build emergency fund / pay down debt / invest) vs. blocked, with
reasons. Both were turned into a callable module inside the existing
FastAPI service, results stored in a new Mongo collection, and wired into
the daily pipeline so they compute right after volatility/forecast refresh.
Dashboard updated to show score, phase, and unlocked/blocked actions.
Re-demoed on both dummy users, including confirming the cold-start user
gets sensible (not broken/empty) output.

**Status: complete, confirmed working. No action needed.**

---

# Stage 3 — Micro-Investment Suggestion Engine

Builds on top of Stage 2 (Financial Health Score + Decision Router). This
engine should only ever run for users the Router has already marked
"eligible to invest" — it doesn't make its own eligibility decisions, it
just decides *what/how much* once eligibility is confirmed.

### Reference material
A standalone prototype already exists (attached separately) — a CLI
notebook that asks the user 5 manual questions, filters/scores a 36-row
investment CSV, and prints long templated "explanation" paragraphs. It's
a good starting point for the *scoring logic*, but it was built as a
one-off demo, not for the real app, so several things need to change on
the way in:
- No more manual questionnaire — the app already has real data (income
  history, health score, volatility label, forecast) that should replace
  the 5 typed-in answers.
- The CSV was hand-typed once and never updates — needs a real refresh
  strategy.
- The long templated "why this is right for you" paragraphs are really
  the job of the later Gemini Explanation Engine (Module 6) — building
  that twice is wasted effort, so this stage should output structured
  reasons, not prose.

## Phase 1 — Replace the questionnaire with real pipeline data
- Map each of the prototype's 5 questions to data that already exists
  by this point in the pipeline instead of asking the user directly:
  - earning level → actual average from punch-in income data
  - debt / savings → onboarding financial data
  - income steadiness → Stage 1 volatility label
  - investable amount → Stage 2's surplus-after-emergency-fund figure
- Risk tolerance is the one input with no existing source — decide
  whether to add a single one-time question at onboarding/settings
  (asked once, not every recommendation) or infer a conservative default
  and let the user adjust it later.

## Phase 2 — Decide the investment options data source
- Keep the existing CSV's gig-specific columns (minimum earning/debt/
  savings thresholds, volatility-safety flag, gig-priority score) as a
  manually curated base — no public API knows what's "gig-worker
  friendly," that part has to stay yours.
- For the numbers that do go stale (returns, interest rates), look into
  pulling from live/public sources where available — e.g. mutual fund
  NAV data (AMFI), post office/small-savings scheme rates, bank FD
  rates — and check what's actually free and reliable before committing.
- These rates don't change minute-to-minute, so a periodic refresh job
  (e.g. weekly) updating a Mongo `investment_options` collection is
  enough — no need to call an external API on every recommendation.

## Phase 3 — Upgrade the scoring and allocation logic
- Reuse the prototype's two-stage approach as the base, it's sound:
  hard eligibility filters first (earning/debt/savings thresholds,
  volatility-safety), then weighted scoring (risk alignment, liquidity,
  gig-priority, volatility-safety bonus).
- Feed it real computed values from Phase 1 instead of typed-in answers.
- Let Stage 1's income forecast trend (rising/falling) slightly nudge
  the risk/liquidity weighting — e.g. lean more liquid if forecast looks
  shaky, even if the user's stated risk tolerance is higher.
- Upgrade the return projection from the prototype's flat compound-
  interest formula to a small Monte Carlo-style range (reuse the same
  simulation approach already built for income forecasting) so it shows
  a realistic best/median/worst case instead of one exact number.

## Phase 4 — Turn into a callable module and add to the service layer
- New function/module, exposed via the existing FastAPI service (e.g.
  `/investment/suggest`), consistent with the other two models.
- Output should be structured: top options with scores, key numbers,
  and short reason *tags* (e.g. "matches your risk level", "safe for
  volatile income") — not full paragraphs, since Module 6 will turn
  this into natural language later.
- Store results in a new Mongo collection, same pattern as forecasts/
  volatility/health-score.

## Phase 5 — Wire into the daily pipeline and dashboard
- Extend the existing job so it also computes investment suggestions
  for users the Router marks eligible; skip everyone else.
- Update the frontend dashboard to show the suggested options and
  projected range, only when eligible — otherwise show the Router's
  blocked reason from Stage 2.

## Phase 6 — Re-demo with the dummy users
- Likely need a third dummy user whose data actually clears the
  Router's eligibility bar, since the existing two were built to test
  cold-start vs. full-history, not investment-eligibility.
- Log in and confirm the eligible user sees real suggestions + a
  growth range, and ineligible ones correctly see the blocked state.

*(After this stage: the Explanation Engine (Module 6, Gemini-based) is
last — it turns Stage 2's and Stage 3's structured output into plain,
personalised language for the dashboard.)*

## Notes for the agent
- Stage 1 and Stage 2 are done — treat their sections above as background
  context only, not as work items. Do not modify their files.
- Tackle Stage 3 one phase at a time; don't touch later-phase files while
  working on an earlier phase.
- It's fine to adjust scope within a phase based on what the codebase
  actually looks like — this doc is a guide, not a checklist to follow
  rigidly.
