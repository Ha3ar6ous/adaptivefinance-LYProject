# API reference

[Overview](../README.md) · [Startup](../STARTUP.md) · [Architecture](ARCHITECTURE.md)

This reference describes the routes mounted by the current source. Examples are request examples, not experimental observations. Express defaults to `http://localhost:5000`; Python defaults to `http://127.0.0.1:8000` in the startup guide.

## Authentication and conventions

Send JSON bodies with `Content-Type: application/json`. Protected Express endpoints require:

```http
Authorization: Bearer <token-from-login-or-signup>
```

Signup and login return a token and a user summary. Tokens expire after seven days in the current implementation. Missing or invalid bearer tokens are rejected with HTTP 401. The backend derives the user identity from the token; application endpoints do not accept an arbitrary user's ID as an authorization mechanism.

## Express endpoints

| Method | Path | Authentication | Request / result |
|---|---|---|---|
| GET | `/` | Public | Plain text: `Backend is working` |
| GET | `/api/test` | Public | `{ "message": "API working correctly" }`; liveness only |
| POST | `/api/auth/signup` | Public | `{name, email, password}` → HTTP 201, `{token, user}` |
| POST | `/api/auth/login` | Public | `{email, password}` → `{token, user}` |
| GET | `/api/auth/profile` | Bearer | `{user}`, excluding password |
| POST | `/api/auth/onboarding` | Bearer | Financial profile fields → `{user}` |
| POST | `/api/data/entry` | Bearer | Daily record → `{entry}`; HTTP 200 on create/update |
| GET | `/api/data/user` | Bearer | `{entries}`, sorted by date |
| GET | `/api/data/export` | Bearer | CSV download, filename `daily_income.csv` |
| GET | `/api/analytics/me` | Bearer | `{analytics}`; stored snapshot, possibly null |
| POST | `/api/analytics/run` | Bearer | Refreshes analytics → `{analytics}` |
| GET | `/api/analytics/charts` | Bearer | `{history, forecast, volatility, health, router}` |
| GET | `/api/investments/me` | Bearer | Recomputes current eligibility/suggestions → `{investment}` |
| POST | `/api/investments/run` | Bearer | Recomputes and persists suggestions → `{investment}` |
| GET | `/api/ai/explanation/me` | Bearer | `{explanation}`; stored result, possibly null |
| POST | `/api/ai/explanation/run` | Bearer | Generates and persists explanation → `{explanation}` |
| POST | `/api/chat` | Bearer | `{messages}` → `{reply}` |

### Onboarding

```json
{
  "bankBalance": 60000,
  "monthlyExpenses": 15000,
  "debts": 3000,
  "investments": 5000
}
```

The controller updates these four numeric fields and marks onboarding complete. It does not update the model's `riskPreference` field. Profile updates do not by themselves guarantee that stored analytics/health are freshly recomputed.

### Income entry

```json
{
  "date": "2026-10-01",
  "platform": "Swiggy",
  "hours_worked": 5,
  "orders_completed": 10,
  "income": 900
}
```

All fields are required by the controller. Prefer `YYYY-MM-DD`; `DD-MM-YYYY` is also supported. Dates are normalized to a UTC date. Uniqueness is **user + date**, so a repeated date updates the existing row even if the platform changes.

The write returns before the asynchronous analytics refresh finishes. A successful save is not confirmation that fresh forecasts, suggestions, or explanations are already available. The model has numeric constraints, but the update controller is not a complete financial-input validation layer.

### Analytics and investment responses

`analytics` combines `forecast`, `volatility`, `health`, `router`, entry count, and status/error information. The chart endpoint returns flattened chart-oriented data rather than the `{analytics}` wrapper. Inspect status and insufficiency/error indicators before interpreting scores.

An investment result includes eligibility, investable amount, risk profile, blocked reason, and suggestions. The GET path rechecks the gate with current financial inputs and stored analytics; it does not simply return a historical permission or persist its newly calculated result. Stored health and analytics can still be stale.

### Snapshot explanation and chat

To exercise deterministic explanation generation without a provider call, use:

```http
POST /api/ai/explanation/run?fallback=1
Authorization: Bearer <token>
```

This is a write: it persists the fallback explanation. Normal generation validates a structured provider response against a deterministic snapshot before rendering a server-owned template.

Chat request example:

```json
{
  "messages": [
    {"role": "user", "content": "Explain the current readiness decision."}
  ]
}
```

The chat service adds financial context and passes recent messages to the provider. It does not apply the snapshot explanation's strict fact validator or deterministic fallback. Missing credentials or provider errors can return HTTP 500. Do not treat chat text as an authoritative calculation.

## Python analytics service

The Python service is stateless and has **no built-in authentication**. Keep it private to the backend; the documented local startup binds it to loopback.

| Method | Path | Result |
|---|---|---|
| GET | `/health` | `{ "status": "ok" }` |
| POST | `/forecast` | Forecast object |
| POST | `/volatility` | Volatility object |
| POST | `/analyze` | `{forecast, volatility}` |
| GET | `/docs` | Interactive FastAPI schema/documentation |

All three POST endpoints use the same request model:

```json
{
  "userId": "local-example",
  "horizon": 15,
  "entries": [
    {"date": "2026-10-01", "income": 900},
    {"date": "2026-10-02", "income": 1100},
    {"date": "2026-10-03", "income": 850}
  ]
}
```

`userId` is required by the request schema but does not authorize access to a stored account. `entries` defaults to an empty list; each supplied entry requires `date`. Income, hours worked, and orders completed default to zero; platform is optional. `horizon` defaults to 15. The forecast function clamps it to 1–30 for a nonempty usable history; the request schema itself does not enforce that range.

Python does not return health, router, investment, or explanation results. Those are backend responsibilities. A direct Python request with a short history differs from the backend's minimum-three-entry orchestration.

## Error behavior and source of truth

Express controllers generally return `{message}` with HTTP 400 for required-input failures, 401 for authentication failures, or 500 for unexpected errors; route-specific behavior differs. Duplicate daily-entry conflicts can return 409. Python schema failures normally return FastAPI's 422 response. There is no single shared error envelope across both services.

Use the mounted [Express routes](../server/routes), their [controllers](../server/controllers), and [Python request models](../ml_service/app.py) as the definitive contract when extending integrations.
