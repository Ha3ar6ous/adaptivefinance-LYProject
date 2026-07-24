# ML Integration Plan

Goal: integrate the income forecast and volatility models into the existing MERN app so MongoDB income entries produce real dashboard outputs.

## Current Baseline

- App stack: React client, Express API, MongoDB/Mongoose.
- Income source: `DailyIncomeEntry` with `date`, `platform`, `hours_worked`, `orders_completed`, `income`.
- Existing endpoints: auth plus `/api/data/entry`, `/api/data/user`, `/api/data/export`.
- ML state: notebooks only:
  - `1forcastingmodel/gig_income_forecast.ipynb`
  - `2volatilitymodel/volatility_classifier_2.ipynb`
- Training data exists in `data/normal/*.csv` and volatility samples in `data/volatility/*.csv`.

## Target Architecture

```text
React Dashboard
  -> Express API
  -> MongoDB income entries
  -> Python FastAPI ML service
  -> Express stores latest ML outputs
  -> React reads saved analytics
```

Use the Python service only for ML inference/training helpers. Keep user auth, persistence, dashboard APIs, and business rules in Express.

## Implementation Steps

### 1. Finalize Notebook Logic

- Fix volatility leakage: do not train on `rolling_cv_7` if the label is directly derived from it, or predict a future volatility label using only past-window features.
- Load volatility CSVs dynamically from `data/normal/*.csv` / `data/volatility/*.csv`.
- Keep ARIMA as per-user runtime fitting; add fallback for `<15` income records using rolling average + weekday adjustment.
- Confirm both notebooks return sensible results before converting.

### 2. Convert ML to Python Service Code

Create:

```text
ml_service/
  app.py
  requirements.txt
  modules/
    forecast.py
    volatility.py
  artifacts/
    volatility_model.joblib
```

Required functions:

- `forecast_income(records, horizon=15)` -> forecast list, method, confidence note.
- `classify_volatility(records)` -> label, score/probability, feature summary.
- `train_volatility_model(csv_dir)` -> saves `artifacts/volatility_model.joblib`.

Input records should match MongoDB entries after Express serialization.

### 3. Add FastAPI Endpoints

Expose:

- `GET /health`
- `POST /forecast`
- `POST /volatility`
- Optional: `POST /analyze` returns both outputs together.

Request shape:

```json
{
  "userId": "...",
  "entries": [
    {
      "date": "2026-07-24",
      "platform": "zomato",
      "hours_worked": 8,
      "orders_completed": 20,
      "income": 1200
    }
  ]
}
```

### 4. Add Express Analytics Layer

Add backend files:

```text
server/models/IncomeAnalytics.js
server/services/mlService.js
server/controllers/analyticsController.js
server/routes/analyticsRoutes.js
```

Endpoints:

- `POST /api/analytics/run` protected: fetch current user's entries, call ML service, upsert analytics.
- `GET /api/analytics/me` protected: return latest saved forecast + volatility.

`IncomeAnalytics` should store:

- `userId`
- `forecast`: horizon, points, method, generatedAt
- `volatility`: label, score, features, generatedAt
- `entryCount`
- `status`: `ready | insufficient_data | error`

### 5. Refresh Strategy

For a working integration, trigger analytics after successful `/api/data/entry`.

- Save income entry first.
- Fire analytics update for that user.
- If ML service fails, keep the entry saved and log analytics error.
- Later improvement: add cron/manual admin refresh.

### 6. Dashboard Integration

Update `DashboardHome.jsx` to call `GET /api/analytics/me`.

Show:

- next 15-day forecast total/average
- volatility label: low/medium/high
- simple empty state when `entryCount < 3`
- fallback method note when using cold-start forecast

Charts can stay simple for first integration; real data flow matters more than polish.

### 7. Demo Data

- Reuse `server/seed.js` or add a small seed script for two users:
  - cold-start user: 10-14 entries
  - full-history user: 40-90 entries
- Run `/api/analytics/run` for both.
- Login and verify dashboard values are not placeholders.

## Acceptance Checklist

- Volatility model artifact exists and loads on service start.
- FastAPI `/health`, `/forecast`, `/volatility` work with sample JSON.
- Express can call ML service via env var `ML_SERVICE_URL`.
- New income entry updates saved analytics without breaking entry save.
- `GET /api/analytics/me` returns persisted forecast and volatility.
- Dashboard displays real forecast + volatility for seeded user.
- Cold-start user gets fallback forecast instead of failure.

## Recommended Order

1. Notebook fixes and model artifact.
2. `ml_service` modules + FastAPI endpoints.
3. Express analytics model/service/routes.
4. Trigger refresh after income entry.
5. Dashboard read/display.
6. Seed and end-to-end demo.

