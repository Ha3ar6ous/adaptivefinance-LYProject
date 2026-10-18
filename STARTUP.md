# Startup and run commands

[Project overview](README.md) · [Architecture](docs/ARCHITECTURE.md) · [Development and tests](docs/DEVELOPMENT.md)

This guide runs the current application locally. Commands use **PowerShell** and start from the repository root unless stated otherwise. Install commands are first-time setup; subsequent runs need only MongoDB and the three application processes.

## 1. Prerequisites

| Requirement | Version / expectation |
|---|---|
| Node.js and npm | Use Node 22.12+ within the 22.x series; the recorded audit used 22.18.0. Vite's declared engine range is `^20.19.0 \|\| >=22.12.0`. |
| Python | Python 3.12 for the application service. Research tooling has a separate environment described in the development guide. |
| MongoDB | A running local instance, or a reachable instance configured through `MONGO_URI`. |
| Network access | Required for dependency installation and optional live language-model requests. |

Check installed runtimes:

```powershell
node --version
npm --version
py -3.12 --version
```

If the Windows Python launcher is unavailable, use the full path to an installed Python 3.12 interpreter. MongoDB is managed separately from this repository; start it through your existing service or installation and verify its address.

## 2. Install dependencies

From the repository root:

```powershell
npm --prefix server ci
npm --prefix client ci
py -3.12 -m venv ml_service/.venv
& ./ml_service/.venv/Scripts/python.exe -m pip install -r ml_service/requirements.txt
```

`npm ci` installs the committed lockfiles and replaces the corresponding `node_modules` directory. Create the Python virtual environment only if it does not already exist. Calling its interpreter directly avoids PowerShell activation-policy issues.

The Python application needs the packages in `ml_service/requirements.txt`. Scientific benchmark dependencies belong to the separate research environment; they are not required to launch the dashboard.

## 3. Configure the backend

Create **`server/.env`** in your editor:

```dotenv
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/lyproject
JWT_SECRET=replace-with-a-long-random-local-secret
ML_SERVICE_URL=http://127.0.0.1:8000

# Optional: enable provider-backed explanations and chat.
# GROQ_API_KEY=your-own-key
# GROQ_MODEL=your-supported-chat-model-id
# GROQ_TIMEOUT_MS=12000
```

Replace the `JWT_SECRET` placeholder. To generate a random value locally:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Keep real secrets out of commits, reports, screenshots, and frontend code. The MongoDB variable is **`MONGO_URI`**, not `MONGODB_URI`.

| Variable | Behavior |
|---|---|
| `PORT` | Express port; defaults to `5000`. |
| `MONGO_URI` | Database connection; defaults to the local URI above. |
| `JWT_SECRET` | Token-signing secret. Set your own value rather than relying on the development fallback. |
| `ML_SERVICE_URL` | Python service base URL; the explicit IPv4 address above avoids local IPv4/IPv6 resolution differences. |
| `GROQ_API_KEY` | Backend-only provider credential. Without it, snapshot explanations use deterministic fallback; chat requests fail. |
| `GROQ_MODEL` | Model override for **free-form chat only**. Confirm that the chosen model is available to your provider account. |
| `GROQ_TIMEOUT_MS` | Optional shared timeout override, in milliseconds. Without an override, structured explanations use 12,000 ms and chat uses 30,000 ms. |

The structured explanation client is pinned in code to `openai/gpt-oss-20b`; `GROQ_MODEL` does not change it. Model identifiers are implementation settings, not guarantees of current provider availability.

The browser currently calls **`http://localhost:5000/api` directly**. There is no implemented `VITE_API_URL` setting or Vite API proxy. Keep Express on port 5000 for this setup. Changing its port or deploying remotely also requires updating the frontend API configuration in source.

## 4. Start the application

Start MongoDB first. Open three terminals, each initially at the repository root.

### Terminal 1 — Python analytics

```powershell
Set-Location ml_service
& ./.venv/Scripts/python.exe -m uvicorn app:app --host 127.0.0.1 --port 8000 --reload
```

Keep this terminal running. Interactive Python API documentation is available at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

### Terminal 2 — Express backend

```powershell
Set-Location server
npm run dev
```

Wait for the MongoDB connection confirmation in the console. To run without the development watcher, use `npm start` from `server/` instead.

### Terminal 3 — React frontend

```powershell
Set-Location client
npm run dev -- --port 5173 --strictPort
```

Open [http://localhost:5173](http://localhost:5173). `--strictPort` makes an occupied port fail explicitly instead of silently choosing another one.

### Verify service availability

In a fourth terminal:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health
Invoke-RestMethod http://localhost:5000/api/test
```

Expected response fields:

| Endpoint | Expected value | What it checks |
|---|---|---|
| Python `/health` | `status: ok` | Python service responds. |
| Express `/api/test` | `message: API working correctly` | Express responds. This is not a database readiness check. |

A successful Express liveness check does not prove MongoDB connected. Confirm both the console connection message and a successful account/data operation.

## 5. First-use workflow

1. Register a new account and sign in.
2. Complete onboarding with bank balance, monthly expenses, debt, and existing investments.
3. Enter income for at least three distinct dates. Include explicit zero-income days when appropriate; omitted dates are not automatically filled.
4. Open the dashboard, forecasts, health and decisions, and investment views. Income writes trigger analytics asynchronously, so a result may lag the save.
5. If needed, request an analytics refresh through `POST /api/analytics/run` using your bearer token; see the [API reference](docs/API.md).

The application stores one income record per user per date. Entering the same date again updates that record, including its platform. It does not create a separate row per platform. Short or irregular histories limit the interpretation of analytics even when the minimum-entry check passes.

You do not need a seed script to use the application. Existing seed/reset utilities can write or replace database contents and are not part of the normal startup process.

## 6. Stop and restart

Press **Ctrl+C** in each application terminal. Stop MongoDB separately if appropriate for your machine. Restart with the three commands in step 4; dependency installation and virtual-environment creation do not need to be repeated.

## Build and preview the frontend

From the repository root:

```powershell
npm --prefix client run build
npm --prefix client run preview -- --port 4173 --strictPort
```

Preview serves the frontend build at port 4173. MongoDB, Express, and the Python service must still run for application features. Vite preview is a local build check, not a production deployment configuration.

For linting and backend tests, use the [development guide](docs/DEVELOPMENT.md).

## macOS / Linux equivalents

Use the same npm commands and environment file. Replace PowerShell directory changes with `cd` and use the POSIX virtual-environment interpreter:

```bash
python3.12 -m venv ml_service/.venv
./ml_service/.venv/bin/python -m pip install -r ml_service/requirements.txt
cd ml_service
./.venv/bin/python -m uvicorn app:app --host 127.0.0.1 --port 8000 --reload
```

In separate terminals, run `npm run dev` from `server/` and `npm run dev -- --port 5173 --strictPort` from `client/`. POSIX commands describe equivalent paths; the recorded research environment was Windows.

## Troubleshooting

| Symptom | Check / action |
|---|---|
| Vite reports an unsupported Node version | Check `node --version` and use a version within Vite's declared engine range. |
| MongoDB connection fails or requests hang | Check the database process, `MONGO_URI`, credentials if applicable, and the backend connection log. `/api/test` alone is insufficient. |
| Backend cannot reach analytics | Check Python `/health`, port 8000, and `ML_SERVICE_URL`. Restart Express after editing `.env`. |
| Dashboard says insufficient data | Add at least three distinct-date records. Repeated dates update an existing record. |
| Analytics show an error after a save | Verify Python is running, then request a refresh. Unknown/error analytics block investment readiness. |
| Investment recommendations are empty | Inspect gate blockers, available budget, and product minimums. Passing the router does not guarantee a positive budget or matching products. |
| Explanation is marked fallback | Missing credentials, provider failures, timeouts, or invalid structured output can trigger the deterministic explanation. |
| Chat returns an error | Check provider credentials and chat-model availability. Chat has no equivalent server-side deterministic fallback. |
| Browser calls the wrong backend | The current frontend API base is hardcoded. An arbitrary `.env` frontend variable will not change it. |
| Port already in use | Stop the conflicting local process or adjust configuration consistently. Frontend/backend addresses must continue to match. |
