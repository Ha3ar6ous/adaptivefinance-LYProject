# Gig Income + Volatility ML Integration — Stage 4 Plan

> This is a starting-point plan, not a strict spec. Read the actual codebase
> and expand each phase into a more detailed plan.md before implementing.
> Feel free to reorder or merge small steps if the code shows a better path.

## Work done so far
- MERN app: frontend, backend, auth, and daily punch-in income entry are built.
- **Stage 1 (done):** Income forecaster (ARIMA + cold-start fallback) and
  volatility classifier (label-leak fixed, retrained), both converted to
  plain Python modules, served via a working FastAPI ML service, wired
  into the daily pipeline and confirmed live on the dashboard.
- **Stage 2 (done):** Financial Health Score (0-100 + phase) and Smart
  Decision Router (allowed/blocked actions + reasons), wired into the
  pipeline and dashboard.
- **Stage 3 (done):** Micro-Investment Suggestion Engine — eligibility-
  gated, real pipeline data (no manual questionnaire), curated +
  refreshable investment options data, upgraded scoring + Monte Carlo-
  style projection range, live on the dashboard (suggested amount, risk
  level, ranked fund cards with projection range and reason tags).

## Goal now
Build **Stage 4 — AI Explanation Layer**, using **Groq's Llama API** (not
Gemini) to turn the existing numeric output into plain-language
explanations for gig workers. English-only for now; Hindi/Hinglish via
Google Translate API is a later add-on, out of scope for this stage.

---

# Stage 4 — AI Explanation Layer (Groq Llama)

This layer doesn't compute anything new — it takes numbers/labels that
already exist (health score, decision router reasons, volatility label,
forecast trend, investment suggestion tags) and turns them into plain,
simple language a gig worker can actually act on. If it can be
hardcoded (labels, thresholds, bar values), it should stay hardcoded —
AI is only for the parts that genuinely need natural language, not for
anything numeric or rule-based.

## Phase 1 — Decide exactly where AI is actually adding value
- The dashboard already shows numeric/labelled output reasonably clearly
  (score, blocked/allowed reasons, health factor bars, investment tags)
  — don't replace any of that with AI-generated text.
- The real gap: there's no single, plain-language summary tying it all
  together for someone who isn't going to parse 5 separate numbers.
  That's the core job of this stage — one short daily "here's where you
  stand and what to do" explanation.
- Keep the scope tight for v1: one overall summary is the baseline. A
  per-investment-card "explain this one" on demand is a nice-to-have,
  not required for the first version.

## Phase 2 — Design the input/output contract for the model
- Feed it a small structured summary (health score + phase, router
  decisions, volatility label, forecast total + trend, top investment
  suggestion + its tags) — not raw daily punch-in history. Keeps the
  prompt short and avoids the model needing to do any math itself.
- System prompt should explicitly tell the model to only use the
  numbers it's given, not invent or recalculate anything — this matters
  more with a free-tier model, where hallucinated figures are a real
  risk.
- Prefer a structured output (e.g. a short headline + 2-3 plain-language
  reasons + one suggested next action) over a free-form paragraph — much
  easier to validate and render safely on the dashboard.

## Phase 3 — Design around Groq's free-tier limits
- Free tier has real rate/token limits — this must run as part of the
  existing daily/triggered batch job, never live on dashboard page load.
- Keep the prompt itself compact (structured summary only, not raw
  data) to stay well within context limits and reduce per-call cost.
- Add a fallback: if the Groq call fails, times out, or gets rate
  limited, fall back to a simple hardcoded sentence built directly from
  the numbers — the dashboard should never show a blank or broken state.

## Phase 4 — Build the module and add it to the service layer
- New function, exposed via the existing FastAPI service (e.g.
  `/explain/generate`), consistent with the other stages.
- Validate the model's response has the expected fields before saving;
  retry once on a malformed response, then fall back per Phase 3.

## Phase 5 — Wire into the daily pipeline and dashboard
- Extend the existing job to generate one explanation per user, after
  Stages 1-3 have already run for that user, and store it (e.g. an
  `explanations` collection in Mongo).
- Add it to the dashboard as a short "in plain words" summary — likely
  at the top of the overview, reusing the existing numeric sections
  underneath rather than duplicating them.

## Phase 6 — Re-demo with the dummy users
- Confirm each existing dummy user gets a summary that actually matches
  their real numbers (cold-start, full-history, investment-eligible).
- Deliberately test the fallback path too (simulate a failed/rate-
  limited call) to confirm the dashboard degrades gracefully.

*(Hindi/Hinglish output via Google Translate API is a planned follow-up
once this English version is working end-to-end — not part of this
stage.)*

## Notes for the agent
- Tackle one phase at a time; don't touch later-phase files while working
  on an earlier phase.
- It's fine to adjust scope within a phase based on what the codebase
  actually looks like — this doc is a guide, not a checklist to follow
  rigidly.
