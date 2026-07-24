# Gig Income + Volatility ML Integration — High-Level Plan

> This is a starting-point plan, not a strict spec. Read the actual codebase
> (notebooks, existing FE/BE, CSVs) and expand each phase into a more detailed
> plan.md before implementing. Feel free to reorder or merge small steps if
> the code shows a better path.

## Context (current state)
- MERN app: frontend, backend, auth, and a daily "punch-in" income entry
  module are already built.
- Two standalone Jupyter notebooks exist, not connected to the app:
  - `volatility_classifier_2.ipynb` — RandomForest, classifies a worker's
    income pattern as low/medium/high volatility. Trained on 5 small CSVs.
  - `gig_income_forecast.ipynb` — ARIMA-based, forecasts a worker's income
    for the next 15–30 days. Trained on 1 sample worker's 180-day CSV.
- Goal: get both models cleanly integrated into the web app, running off
  MongoDB data, refreshing daily, and giving useful output even for a user
  with only ~10–15 days of history.

---

## Phase 1 — Fix the volatility notebook's core logic
- The label it's trained to predict is currently calculated directly from
  one of its own input features — this is leakage, fix it (either drop the
  leaking feature, or reframe the target as a future-looking prediction).
- Re-run training, sanity-check the accuracy looks reasonable, not
  suspiciously perfect.
- Keep working inside the `.ipynb` for now — don't convert to `.py` yet.

## Phase 2 — Expand training data & retrain volatility model
- More synthetic CSVs will be added, same 6-column schema as the existing
  ones, just covering more scenarios/variance.
- Update the data-loading step so it's not hardcoded to a fixed list of 5
  files — should pick up however many synthetic CSVs are available.
- Retrain, and this time actually **save the trained model to disk**
  (currently it isn't saved at all).

## Phase 3 — Add a cold-start path to the income forecaster
- ARIMA itself doesn't need pretraining on a dataset — it fits on
  whatever series it's given, per user, at request time. No separate
  training phase needed for this one.
- Add a simple fallback for users with very little history (roughly
  under ~15 days) — something like a rolling average + day-of-week
  adjustment — since ARIMA isn't reliable on very short series.
- Strip out the notebook's file-upload/widget UI — replace with direct
  function calls so it can be tested without Jupyter's interactivity.

## Phase 4 — Convert both notebooks into plain Python modules
- Once the logic in both notebooks feels final, turn each into a regular
  `.py` file with clear functions (e.g. train/predict) instead of a
  top-to-bottom notebook script.
- Functions should accept data directly (e.g. a DataFrame or list of
  records) rather than reading from a CSV path — that assumption won't
  hold once data comes from MongoDB.
- Remove plotting/display code that only makes sense inside a notebook.

## Phase 5 — Build the service layer and connect it to the app
- Stand up a small Flask (or similar) service exposing prediction
  endpoints for both models, using the modules from Phase 4.
- Decide how results get stored — likely a couple of MongoDB collections
  for volatility scores and forecasts, updated per user rather than
  computed live on every dashboard load.
- Wire up the existing Node backend to pull a user's recent data, call
  the ML service, and save the results.
- Add whatever daily/periodic trigger makes sense (cron job, or
  triggered after a punch-in) so results stay fresh without needing a
  live call on page load.

## Phase 6 — Make it demoable end-to-end on the frontend
- Create a dummy/test user account (via the existing auth flow) that can
  be logged into normally.
- Seed MongoDB with mock punch-in data for that user — enough days to
  cover both the cold-start case and the full case (e.g. one dummy user
  with ~10-15 days of data, another with 60-90+ days), same schema as
  the punch-in module already uses.
- Run the Phase 5 pipeline (or trigger it manually) for that user so
  volatility scores and forecasts actually get generated and saved.
- Log in as that dummy user and confirm the dashboard shows real model
  output — forecast numbers/chart, volatility label — not placeholder
  or empty states.
- Goal here is just proof it works end-to-end, not polish — rough UI is
  fine as long as real model output is visibly flowing through.

---

## Notes for the agent
- Tackle one phase at a time; don't touch later-phase files while working
  on an earlier phase.
- It's fine to adjust scope within a phase based on what the codebase
  actually looks like — this doc is a guide, not a checklist to follow
  rigidly.
