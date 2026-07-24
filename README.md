# Adaptive Finance

An intelligent, risk-aware financial platform built for gig workers with irregular incomes. The system tracks daily earnings, forecasts future income, classifies income volatility, computes a weighted financial health score, and runs a rule-based decision engine that determines whether a user is financially ready to invest -- or should focus on safety actions first.

Built as a three-tier microservices architecture: a React 19 frontend, a Node.js/Express API server, and a Python/FastAPI ML inference service.

---

## Architecture Overview

```
                        +-------------------+
                        |   React Frontend  |
                        |  (Vite, Port 5173)|
                        +---------+---------+
                                  |
                           HTTP / REST
                                  |
                        +---------+---------+
                        | Express Backend   |
                        | (Node, Port 5000) |
                        +---------+---------+
                         /                  \
                        /                    \
              +--------+--------+    +-------+---------+
              |    MongoDB      |    | FastAPI ML Svc   |
              | (Mongoose ODM)  |    | (Python, Port    |
              |                 |    |  8000)           |
              +-----------------+    +-----------------+
```

| Layer      | Technology                          | Responsibility                                                      |
|------------|-------------------------------------|---------------------------------------------------------------------|
| Frontend   | React 19, Vite 8, React Router 7    | UI rendering, auth flow, data entry forms, SVG chart visualizations |
| Backend    | Express 5, Mongoose 9, JWT, bcrypt  | Auth, data persistence, analytics orchestration, ML integration     |
| ML Service | FastAPI 0.115, Uvicorn 0.34         | Income forecasting, volatility classification, stateless inference  |
| Database   | MongoDB                             | User profiles, daily income entries, cached analytics results       |

All three services run independently and communicate over HTTP. The backend acts as the sole orchestrator: it fetches user data from MongoDB, forwards it to the ML service for inference, computes health scores and decision routing locally, and persists the combined result back to the database.

---

## System Data Flow

The end-to-end data flow from user input to rendered predictions follows this sequence:

```
1. User logs daily income via the EnterData form
         |
2. POST /api/data/entry --> Express validates and upserts DailyIncomeEntry in MongoDB
         |
3. Express auto-triggers runAnalyticsForUser(userId) in the background
         |
4. analyticsController fetches all DailyIncomeEntry records for the user
         |
5. Express serializes entries into JSON and POST /analyze to FastAPI ML service
         |
6. ML service runs:
   a. forecast_income() --> trend + weekday-adjusted 15-day forecast
   b. classify_volatility() --> CV-based volatility label (low/medium/high)
         |
7. Express receives ML response, then locally computes:
   a. calculateHealthScore() --> weighted 0-100 score across 5 factors
   b. buildDecisionRouter() --> allowed/blocked financial actions
         |
8. Combined result (forecast + volatility + health + router) is persisted
   as a single IncomeAnalytics document in MongoDB
         |
9. Frontend fetches analytics via GET /api/analytics/me or GET /api/analytics/charts
         |
10. React renders DashboardHome (score gauge, forecast summary, volatility label,
    next action), Route1 (history charts), Route2 (forecast charts), Route3
    (health factors + decision router output)
```

If the ML service is unreachable, the backend gracefully degrades: it skips forecast and volatility, but still computes health scores and decision routing using whatever data is available.

---

## Frontend (Client)

**Stack**: React 19 | Vite 8 | React Router 7 | react-icons | Custom SVG charts

The frontend is a single-page application organized into feature modules. All visualizations are rendered as lightweight custom SVG components (ScoreGauge, SimpleLineChart, SimpleBarChart) instead of external charting libraries.

| Route                     | Component          | Auth | Description                                |
|---------------------------|--------------------| ---- |--------------------------------------------|
| `/`                       | LandingPage        | No   | Marketing page with feature cards and CTAs |
| `/login`                  | LoginPage          | No   | Email/password login form                  |
| `/signup`                 | SignupPage         | No   | Registration form (name, email, password)  |
| `/onboarding`             | OnboardingPage     | Yes  | 4-step financial profile wizard            |
| `/dashboard`              | DashboardHome      | Yes  | Health gauge, forecast, volatility, action |
| `/dashboard/enter-data`   | EnterData          | Yes  | Daily income punch-in form                 |
| `/dashboard/download-data`| DownloadData       | Yes  | CSV export of income history               |
| `/dashboard/route1`       | Route1             | Yes  | Income history line/bar charts + table     |
| `/dashboard/route2`       | Route2             | Yes  | Forecast charts + actual vs predicted      |
| `/dashboard/route3`       | Route3             | Yes  | Health score gauge + decision router       |

State management uses React's built-in primitives: `useState` for local state, `useOutletContext` for passing user data from the dashboard shell to child routes, `useMemo` for derived computations, and `localStorage` for JWT persistence.

---

## Backend (Server)

**Stack**: Express 5 | Mongoose 9 | bcrypt | jsonwebtoken | dotenv

The backend is a REST API server with three route groups: authentication, data management, and analytics. It serves as the central orchestrator, integrating user data from MongoDB with ML inference results from the Python service.

### Service Layer

| Service                  | File                         | Purpose                                                          |
|--------------------------|------------------------------|------------------------------------------------------------------|
| ML Integration           | `services/mlService.js`      | Serializes income entries and forwards to FastAPI `/analyze`     |
| Health Score Calculator   | `services/healthScoreService.js` | Weighted 0-100 score across 5 financial factors              |
| Decision Router          | `services/decisionRouterService.js` | Rule-based engine determining allowed/blocked actions     |
| CSV Export               | `services/csvService.js`     | Converts income entries to CSV format for download               |

### Middleware

- **`authMiddleware.js`**: Extracts and verifies JWT from the `Authorization: Bearer <token>` header. Attaches `req.user = { id, email }` for downstream handlers. Returns 401 on missing or invalid tokens.

---

## ML Service

**Stack**: FastAPI 0.115.6 | Uvicorn 0.34.0 | Pure Python (no NumPy/pandas/scikit-learn required at runtime)

The ML service is a stateless Python microservice exposing three inference endpoints. It performs all computation using standard library math -- no heavy ML frameworks are required at runtime.

### Endpoints

| Method | Endpoint      | Description                                              |
|--------|---------------|----------------------------------------------------------|
| GET    | `/health`     | Returns `{"status": "ok"}` for health checks             |
| POST   | `/forecast`   | 15-day income forecast with trend and weekday adjustment |
| POST   | `/volatility` | Income volatility classification via Coefficient of Variation |
| POST   | `/analyze`    | Combined endpoint returning both forecast and volatility |

### Request Payload (Pydantic Schema)

```json
{
  "userId": "string",
  "entries": [
    {
      "date": "2026-07-01",
      "platform": "Swiggy",
      "hours_worked": 8.5,
      "orders_completed": 12,
      "income": 850.0
    }
  ],
  "horizon": 15
}
```

### Forecast Algorithm

The forecasting module uses an adaptive trend + weekday-seasonality hybrid model:

1. **Baseline**: Mean of the most recent 14 income entries.
2. **Weekday Adjustment**: Computes per-weekday income deltas over the last 42 entries, producing day-of-week seasonal offsets.
3. **Mode Selection**:
   - **Cold Start** (fewer than 15 entries): Slope = 0. Uses baseline + weekday offsets.
   - **Trend Mode** (15+ entries): Splits a 30-day window into early/late halves, computes linear slope, and clamps it to +/-8% of baseline to prevent runaway extrapolation.
4. **Forecast Generation**: For each day `d` in `[1, horizon]`:

   ```
   forecast(d) = max(base + slope * d + weekday_delta, 0)
   ```

### Volatility Classification

The volatility module classifies income stability using the Coefficient of Variation (CV):

1. Computes mean and sample standard deviation over the most recent 30 income entries.
2. Calculates `CV = std / mean`.
3. Classifies using calibrated thresholds (loaded from `artifacts/volatility_model.json`):
   - `low`: CV < 0.35
   - `medium`: 0.35 <= CV < 0.75
   - `high`: CV >= 0.75
4. Returns the label, raw CV score, and statistical features.

---

## Database Schema

The application uses three MongoDB collections managed by Mongoose:

### User

| Field                   | Type     | Description                              |
|-------------------------|----------|------------------------------------------|
| `name`                  | String   | Required, trimmed                        |
| `email`                 | String   | Required, unique, lowercase              |
| `password`              | String   | Required, bcrypt-hashed                  |
| `hasCompletedOnboarding`| Boolean  | Default: false                           |
| `bankBalance`           | Number   | Default: 0                               |
| `monthlyExpenses`       | Number   | Default: 0                               |
| `debts`                 | Number   | Default: 0                               |
| `investments`           | Number   | Default: 0                               |
| `createdAt` / `updatedAt` | Date  | Mongoose timestamps                     |

### DailyIncomeEntry

| Field              | Type       | Description                              |
|--------------------|------------|------------------------------------------|
| `userId`           | ObjectId   | References User, required                |
| `date`             | Date       | Required                                 |
| `platform`         | String     | Required, trimmed (e.g., Swiggy, Uber)   |
| `hours_worked`     | Number     | Required, min 0                          |
| `orders_completed` | Number     | Required, min 0                          |
| `income`           | Number     | Required, min 0                          |

Compound unique index on `(userId, date)` prevents duplicate entries per day.

### IncomeAnalytics

| Field                     | Type    | Description                                              |
|---------------------------|---------|----------------------------------------------------------|
| `userId`                  | ObjectId| References User, unique (one analytics doc per user)     |
| `forecast.horizon`        | Number  | Forecast window in days (default: 15)                    |
| `forecast.points[]`       | Array   | `{ date: String, income: Number }` forecast data points  |
| `forecast.method`         | String  | Algorithm used (e.g., `trend_weekday`, `cold_start_rolling_weekday`) |
| `forecast.note`           | String  | Human-readable method description                        |
| `volatility.label`        | String  | Classification: `low`, `medium`, `high`, `unknown`       |
| `volatility.score`        | Number  | Raw CV value (capped at 2.0)                             |
| `volatility.features`     | Mixed   | Statistical details (entry count, mean, std, CV)         |
| `health.score`            | Number  | Weighted health score (0-100)                            |
| `health.phase`            | String  | Phase: `crisis`, `survival`, `stability`, `growth`       |
| `health.factors`          | Mixed   | Per-factor scores and explanations                       |
| `router.summary`          | String  | One-line decision summary                                |
| `router.actions[]`        | Array   | Action items with `key`, `label`, `allowed`, `reason`    |
| `entryCount`              | Number  | Total income entries for the user                        |
| `status`                  | String  | `ready`, `insufficient_data`, or `error`                 |

---

## API Reference

### Authentication (`/api/auth`)

| Method | Endpoint              | Auth | Request Body                                  | Description                |
|--------|-----------------------|------|-----------------------------------------------|----------------------------|
| POST   | `/api/auth/signup`    | No   | `{ name, email, password }`                   | Register new user          |
| POST   | `/api/auth/login`     | No   | `{ email, password }`                         | Login, returns JWT         |
| GET    | `/api/auth/profile`   | Yes  | --                                            | Get current user profile   |
| POST   | `/api/auth/onboarding`| Yes  | `{ bankBalance, monthlyExpenses, debts, investments }` | Complete financial onboarding |

### Data Management (`/api/data`)

| Method | Endpoint            | Auth | Request Body / Params                                   | Description                    |
|--------|---------------------|------|---------------------------------------------------------|--------------------------------|
| POST   | `/api/data/entry`   | Yes  | `{ date, platform, hours_worked, orders_completed, income }` | Create or update daily entry |
| GET    | `/api/data/user`    | Yes  | --                                                      | Get all user income entries    |
| GET    | `/api/data/export`  | Yes  | --                                                      | Download entries as CSV        |

### Analytics (`/api/analytics`)

| Method | Endpoint               | Auth | Description                                              |
|--------|------------------------|------|----------------------------------------------------------|
| GET    | `/api/analytics/me`    | Yes  | Get cached analytics (forecast, volatility, health, router) |
| POST   | `/api/analytics/run`   | Yes  | Trigger fresh analytics computation                      |
| GET    | `/api/analytics/charts`| Yes  | Get optimized chart payload (history + forecast + health) |

---

## Authentication

Authentication uses JSON Web Tokens (JWT) with bcrypt password hashing:

1. **Registration**: Password is hashed with bcrypt (10 salt rounds). A JWT is generated containing `{ id, email }` and returned to the client.
2. **Login**: Password is compared against the stored hash. On success, a new JWT is issued.
3. **Token Lifetime**: 7 days expiry.
4. **Client Storage**: The JWT is persisted in `localStorage` under the key `token`.
5. **Route Protection**: The `PrivateRoute` component checks for token presence. The `authMiddleware` on the backend verifies token validity on every protected request.
6. **Onboarding Gate**: After login/signup, the client checks `user.hasCompletedOnboarding`. Users who have not completed onboarding are redirected to `/onboarding` before accessing the dashboard.

---

## Financial Health Scoring

The health score is a weighted composite of five sub-scores, each rated 0-100:

| Factor             | Weight | Calculation                                                       |
|--------------------|--------|-------------------------------------------------------------------|
| Liquidity          | 30%    | `(bankBalance / monthlyExpenses) / 3 * 100` -- months of expense cover |
| Debt Safety        | 25%    | `100 - (debts / monthlyExpenses) * 35` -- penalizes high debt load |
| Income Stability   | 20%    | Mapped from volatility label: low=90, medium=60, high=30          |
| Forecast Trend     | 15%    | `50 + (forecastAvg/actualAvg - 1) * 100` -- upward trend bonus    |
| Data Consistency   | 10%    | `(entryCount/30)*100 * 0.6 + (activeDays/recentDays)*100 * 0.4`  |

The final score determines the user's financial phase:

| Score Range | Phase      |
|-------------|------------|
| 0 -- 39     | Crisis     |
| 40 -- 59    | Survival   |
| 60 -- 79    | Stability  |
| 80 -- 100   | Growth     |

---

## Decision Router

The decision router evaluates three financial safety conditions and produces an actionable output:

**Blockers checked:**
- Emergency fund below 1 month of expenses
- Debt above 2 months of expenses
- High income volatility

**Actions generated:**

| Action                     | Allowed When                              | Blocked When                      |
|----------------------------|-------------------------------------------|-----------------------------------|
| Build emergency fund       | Liquidity < 3 months                      | Already adequate                  |
| Pay down debt              | Debt ratio > 0.5x monthly expenses        | Debt manageable                   |
| Start conservative investing| Health score >= 70 AND no blockers present | Any blocker active or score < 70  |

The router summary communicates a clear directive: either "Investing can begin conservatively" or "Focus on safety actions before investing."

---

## Training Data and Offline Model Calibration

The `data/normal/` directory contains 11 raw CSV files of daily income across 5 gig platforms (Swiggy, Zomato, Uber, Blinkit, Snabbit) in stable and volatile variants. The `data/volatility/` directory contains 5 feature-engineered CSVs with 7-day rolling statistics used for threshold calibration.

The `train_volatility_model()` function in `modules/volatility.py` performs offline calibration: it scans all volatility CSVs, collects `rolling_cv_7` values, computes the 33rd and 66th percentiles, and persists the resulting thresholds to `ml_service/artifacts/volatility_model.json`. The `seed_user.js` script generates 60 days of synthetic high-volatility income data for end-to-end testing.

---

## Project Structure

```
LYProject/
+-- client/                          # React 19 frontend (Vite 8)
|   +-- src/
|       +-- components/charts/       # ScoreGauge, SimpleBarChart, SimpleLineChart
|       +-- modules/auth/            # LoginPage, SignupPage
|       +-- modules/dashboard/       # Dashboard shell, DashboardHome, Route1-3
|       +-- modules/data/            # EnterData, DownloadData
|       +-- modules/landing/         # LandingPage
|       +-- modules/onboarding/      # OnboardingPage
|       +-- services/analyticsApi.js # Analytics API client
|       +-- App.jsx, main.jsx        # Routing and entry point
+-- server/                          # Express 5 backend
|   +-- controllers/                 # authController, dataController, analyticsController
|   +-- models/                      # User, DailyIncomeEntry, IncomeAnalytics
|   +-- routes/                      # authRoutes, dataRoutes, analyticsRoutes
|   +-- services/                    # mlService, healthScoreService, decisionRouterService, csvService
|   +-- middleware/authMiddleware.js  # JWT verification
|   +-- server.js                    # App entry point
+-- ml_service/                      # Python FastAPI ML service
|   +-- app.py                       # FastAPI endpoints
|   +-- modules/forecast.py          # Trend + weekday income forecasting
|   +-- modules/volatility.py        # CV-based volatility classification
|   +-- artifacts/                   # Calibrated volatility thresholds
+-- data/normal/                     # Raw gig worker income CSVs (11 files)
+-- data/volatility/                 # Feature-engineered CSVs (5 files)
```

---

## Environment Variables

Create a `.env` file in the `server/` directory:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/adaptive-finance
JWT_SECRET=your_secure_jwt_secret_change_in_production
ML_SERVICE_URL=http://127.0.0.1:8000
```

| Variable         | Required | Default                                 | Description                        |
|------------------|----------|-----------------------------------------|------------------------------------|
| `PORT`           | No       | `5000`                                  | Express server port                |
| `MONGO_URI`      | Yes      | `mongodb://127.0.0.1:27017/lyproject`   | MongoDB connection string          |
| `JWT_SECRET`     | Yes      | `supersecretjwtkey` (dev fallback only) | Secret for signing JWT tokens      |
| `ML_SERVICE_URL` | No       | `http://localhost:8000`                 | URL of the Python ML service       |

---

## Local Development

**Prerequisites**: Node.js 18+, Python 3.12+, MongoDB (local or Atlas), Git.

Run three concurrent terminal processes:

```bash
# Terminal 1: ML Service (port 8000)
cd ml_service
python -m venv .venv
.venv\Scripts\Activate.ps1    # Windows (macOS/Linux: source .venv/bin/activate)
pip install -r requirements.txt
python -m uvicorn app:app --reload --port 8000

# Terminal 2: Backend (port 5000)
cd server
npm install
# Create server/.env (see Environment Variables section)
npm start

# Terminal 3: Frontend (port 5173)
cd client
npm install
npm run dev
```

Optional: seed 60 days of test data with `cd server && node seed_user.js`.

Verify: sign up, complete onboarding, enter 3+ income entries, then click "Refresh" on the dashboard to trigger the full analytics pipeline.

---

## Deployment

All three services are independently deployable. The React frontend builds to static files (`npm run build` produces `dist/`) deployable on Vercel, Netlify, or Cloudflare Pages. The Express backend runs as a Node.js process on Render, Railway, or AWS EC2. The ML service deploys as a Python web service or Docker container. MongoDB Atlas provides the production database. For production, update the frontend API base URL and set `JWT_SECRET` to a cryptographically strong random value.

---

## Implemented Features

All features listed below are fully built and functional in the current codebase:

- **User Authentication**: Email/password signup and login with bcrypt hashing and JWT tokens.
- **Financial Onboarding**: 4-step wizard collecting bank balance, monthly expenses, debts, and investments.
- **Daily Income Punch-In**: Date-restricted form with duplicate detection, confirmation dialog, and platform/hours/orders/income fields.
- **CSV Data Export**: Download complete income history as a formatted CSV file.
- **Income Forecasting**: 15-day adaptive forecast using trend analysis and weekday seasonality, with cold-start fallback for new users.
- **Volatility Classification**: Coefficient of Variation-based classification (low/medium/high) with quantile-calibrated thresholds.
- **Financial Health Score**: Weighted 0-100 composite score evaluating liquidity, debt safety, income stability, forecast trend, and data consistency.
- **Decision Router**: Rule-based engine that gates investing behind safety checks (emergency fund, debt, volatility).
- **Analytics Dashboard**: Bento-grid layout with health gauge, forecast card, volatility card, and next-action card.
- **Income History View**: SVG line chart, bar chart, and recent entries table.
- **Forecast View**: Forecast line chart, actual-vs-predicted comparison bar chart, and volatility statistics.
- **Health and Decisions View**: Health gauge, factor-by-factor progress bars, and allowed/blocked action items.
- **ML Service Fallback**: Backend computes health scores and decisions even when the ML service is offline.
- **Offline Threshold Training**: Quantile-based volatility model calibration from labeled CSV datasets.
- **Data Seeding**: Script to generate 60 days of realistic synthetic income data for testing.

---

## Roadmap

The following features are planned but not yet implemented:

- **Advanced ML Models**: Upgrade from statistical methods to XGBoost or scikit-learn classifiers for income forecasting and volatility prediction. Training pipeline exists in concept but production-grade model training is not yet wired.
- **Gemini AI Explanation Engine**: Integrate Google Gemini API to generate natural-language explanations for health scores, decision routing, and investment recommendations -- replacing static text with conversational financial advice.
- **Investment Recommendation Engine**: Map decision router output to specific Indian financial products (SIPs, Mutual Funds, Liquid Funds, Fixed Deposits) based on risk tolerance, income stability, and investable surplus.
- **Automated Data Ingestion**: Support CSV upload and OCR-based receipt/screenshot parsing for automatic income entry instead of manual punch-in.
- **Google Authentication**: Add Google OAuth as an alternative to email/password authentication.
- **Production Deployment**: Containerized deployment with Docker, CI/CD pipeline, and environment-specific configuration.

---

## Technical Design Decisions

1. **Stateless ML Service**: The Python service loads no user state and performs no database access. All user context is passed in the request payload, making the service horizontally scalable and independently deployable.

2. **Dual Fallback Architecture**: Both the Express backend and the ML service have independent fallback mechanisms. If the ML service is down, the backend still computes health scores and routing. If the ML service has no trained model file, it uses statistical fallbacks internally. This ensures the application never shows a blank dashboard.

3. **No External Charting Libraries**: The frontend renders all charts as custom inline SVG components (ScoreGauge, SimpleLineChart, SimpleBarChart) rather than depending on Chart.js or Recharts. This eliminates heavy dependencies and keeps the client bundle small.

4. **Computed Metrics, Not Stored**: Financial summaries (savings rate, net worth, debt-to-income ratio) and health scores are computed on-the-fly from raw data rather than stored as denormalized fields. The IncomeAnalytics document is a cached computation result that is regenerated on every analytics run.

5. **Upsert Pattern**: Both income entries and analytics documents use `findOneAndUpdate` with `upsert: true`, so the same endpoint handles creation and updates without requiring separate create/update routes.

6. **Safety-First Financial Philosophy**: The decision router blocks investment actions until liquidity, debt, and volatility are within safe ranges. This reflects the project's core principle: financial safety before investment growth.

7. **Weekday-Adjusted Forecasting**: Gig worker income varies significantly by day of week (e.g., weekends for food delivery). The forecast model captures this with per-weekday deltas rather than treating all days equally.

8. **Quantile-Calibrated Thresholds**: Volatility classification thresholds are derived from actual gig worker data distributions (33rd and 66th percentiles) rather than arbitrary constants, making classifications adapt to real earning patterns.

