# Gig Income + Volatility ML Integration — High-Level Plan

> This is a starting-point plan, not a strict spec. Read the actual codebase
> (notebooks, existing FE/BE, CSVs) and expand each phase into a more detailed
> plan.md before implementing. Feel free to reorder or merge small steps if
> the code shows a better path.

## Context (current state)
- MERN app: frontend, backend, auth, and a daily "punch-in" income entry
  module are already built.
- **Stage 1 complete (Phases 1-6 done):**
  - Volatility classifier's label-leakage issue fixed, retrained on
    expanded synthetic data, model saved to disk.
  - Income forecaster has a cold-start fallback for low-history users,
    ARIMA path retained for users with enough history.
  - Both models converted from notebooks into plain Python modules.
  - A working **FastAPI ML service** is live, exposing prediction
    endpoints for both models.
- Goal now: build **Stage 2 — Financial Health Score + Smart Decision
  Router** on top of this, using the existing model outputs as inputs.

---

# Stage 2 — Financial Health Score + Smart Decision Router

Builds on top of Stage 1 (income forecast + volatility, already implemented
and demoed via the FastAPI service). This stage uses those model outputs as
inputs, so it should come next — not micro-investment or the AI explanation
layer yet, since those depend on this.

## Phase 1 — Decide what the score actually needs
- Confirm target output: a 0-100 score, plus a phase label
  (crisis / survival / stability / growth), as already scoped in the PPT.
- List out what's actually available to feed it: punch-in income history,
  declared bank balance/debts/expenses from onboarding, the volatility
  label, and the income forecast trend.
- Lean toward a transparent weighted-formula approach rather than a
  black-box model — easier to justify later in the Explanation Engine, and
  doesn't need heavy training. The Home Credit / Personal Finance datasets
  can be used just to sanity-check reasonable weight ranges, not
  necessarily to train a full model on.

## Phase 2 — Prototype the scoring logic
- Build and test this in a notebook/quick script first, same as before.
- Try it on the same dummy users from Stage 1 Phase 6 (one low-data, one
  full-history) to see if the score/phase output looks sensible for both.

## Phase 3 — Build the Decision Router
- Plain if-then rule logic, no model needed here.
- Input: health score + emergency fund status + volatility label.
- Output: which actions are currently allowed (build emergency fund /
  pay down debt / invest) and which are blocked, with a reason.

## Phase 4 — Turn into a callable module and add to the service layer
- Decide whether this lives inside the existing FastAPI service (likely
  cleanest, since it consumes outputs already computed there) or as
  logic in Node — pick whichever keeps related logic together.
- Store results in a new Mongo collection, similar pattern to the
  forecasts/volatility collections.

## Phase 5 — Wire into the daily pipeline and dashboard
- Extend the existing daily/triggered job to also compute health score
  and router output after volatility/forecast are refreshed.
- Update the frontend dashboard to show the score, phase, and which
  actions are unlocked vs blocked.

## Phase 6 — Re-demo with the dummy users
- Re-run seeding/refresh for the existing dummy users.
- Log in as both and confirm the score, phase, and router decisions show
  up correctly — especially that the cold-start user gets sensible
  (not broken/empty) output.

*(After this stage: Micro-Investment Engine (Module 5) and the Gemini-based
Explanation Engine (Module 6) are next in line per the PPT, each likely
warranting their own phased plan once this stage is done.)*

## Notes for the agent
- Tackle one phase at a time; don't touch later-phase files while working
  on an earlier phase.
- It's fine to adjust scope within a phase based on what the codebase
  actually looks like — this doc is a guide, not a checklist to follow
  rigidly.
