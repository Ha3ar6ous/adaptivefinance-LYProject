# AI-Driven Risk-Aware Micro-Investing Framework for Gig Workers

## Project Vision

This project aims to build an intelligent financial assistant for gig workers (Zomato, Swiggy, Blinkit, Uber, Rapido, freelancers, etc.) who have irregular incomes and often struggle with savings, debt management and investment planning.

Instead of simply recommending investments, the system first evaluates whether the user is financially ready to invest. It predicts future income, analyzes financial stability, calculates a financial health score and only then recommends suitable investment options with AI-generated explanations.

The end goal is to create a production-ready web application that feels like an intelligent financial advisor rather than just an ML dashboard.

---

# User Journey

The complete application should feel like the following flow.

```
Login
   ↓
Onboarding
   ↓
Financial Profile Creation
   ↓
Daily Income Tracking
   ↓
Income Analysis
   ↓
Financial Health Calculation
   ↓
Decision Engine
   ↓
Investment Recommendation
   ↓
AI Explanation
```

Every module should naturally lead into the next one.

---

# Core Modules

## 1. Authentication

The user signs in using Google Authentication.

After successful login, a profile is created and the user enters the application dashboard.

---

## 2. User Onboarding

The user provides their initial financial information.

Typical fields include

- Current bank balance
- Existing debt
- Monthly expenses
- Savings
- Occupation
- Income source
- Investment preference

This information becomes the user's financial profile.

---

## 3. Daily Income Tracking

The application continuously collects user income.

Possible methods

- Daily punch-in system
- CSV upload
- Manual income entry

The objective is to build an income history that continuously grows over time.

This historical data becomes the primary input for the ML models.

---

## 4. Income Analytics

Once sufficient income history exists, the system performs analysis.

Outputs include

- Income trend
- Daily earnings visualization
- Weekly and monthly summaries
- Forecasted income
- Income volatility

Users should immediately understand how stable or unstable their earnings are.

---

## 5. ML Prediction Engine

The machine learning service receives processed user data.

Models perform tasks such as

- Income forecasting
- Volatility classification
- Financial metric prediction

The ML service **never retrains during application usage**.

Training happens offline.

Only pre-trained models are loaded into memory and used for prediction.

Typical flow

```
User Data
      ↓
Node Backend
      ↓
Python ML API
      ↓
Prediction
      ↓
JSON Response
```

---

## 6. Financial Health Score

Using both user profile data and ML outputs, the system calculates an overall financial health score.

Factors may include

- Income stability
- Savings
- Debt
- Expenses
- Liquidity
- Forecasted earnings

Output

```
Health Score

0 - 100
```

The score determines the user's financial readiness.

---

## 7. Decision Router

This is the intelligence layer of the application.

Instead of recommending investments immediately, the application first decides whether investing is appropriate.

Examples

- Low score → Do not invest
- High debt → Clear debt first
- No emergency fund → Build emergency fund
- Stable finances → Allow investing

The system prioritizes financial safety before investment growth.

---

## 8. Investment Recommendation Engine

If the user is eligible, the application recommends suitable investment options.

Possible recommendations

- SIP
- Mutual Funds
- Fixed Deposits
- Emergency Fund
- Liquid Funds
- Other low-risk investment products

Recommendations should match

- User risk profile
- Income stability
- Investment amount
- Financial health

---

## 9. AI Explanation Engine

Recommendations should never appear as black-box outputs.

The AI explains

- Why this recommendation was made
- Benefits
- Risks
- Trade-offs
- Things the user should improve
- Future financial suggestions

The explanation should feel like a financial advisor rather than a chatbot.

---

# Dashboard Experience

The dashboard should gradually evolve into a complete financial command center.

Possible sections

- Financial Health Score
- Income Forecast Chart
- Income Trend
- Volatility Indicator
- Savings Overview
- Debt Summary
- Investment Eligibility
- Recommended Investments
- AI Insights
- Recent Income History

The user should understand their financial condition within a few seconds.

---

# System Architecture

```
                React Frontend
                      │
                      │
              Express Backend
             Authentication
             User Management
             Business Logic
                      │
          ┌───────────┴───────────┐
          │                       │
      MongoDB               Python ML API
     User Data             Forecast Models
                           Classification
                           Financial Models
          │                       │
          └───────────┬───────────┘
                      │
               AI Explanation API
                      │
                 Final Response
                      │
                Interactive Dashboard
```

---

# Technology Stack

## Frontend

- React
- Tailwind CSS
- shadcn/ui
- Chart.js
- Recharts

## Backend

- Node.js
- Express
- MongoDB
- Mongoose

## ML Service

- Python
- FastAPI
- Pandas
- NumPy
- scikit-learn
- statsmodels
- XGBoost
- joblib

## AI

- Gemini API

---

# Current Development Status

Completed

- Frontend setup
- Backend setup
- Authentication
- Database integration
- User onboarding
- Income punch-in system
- Basic project structure

In Progress

- Income processing
- ML integration
- Dashboard development

Pending

- Income forecasting integration
- Financial health scoring
- Decision router
- Investment recommendation engine
- AI explanation engine
- Complete dashboard
- Production deployment

---

# Guiding Principles

Every feature should answer one question:

> "How can this help a gig worker make safer financial decisions?"

The application should always prioritize

- Simplicity
- Explainability
- Financial safety
- Data-driven recommendations
- Clean user experience

Machine learning should remain invisible to the user. Users should simply feel that the application understands their financial situation and provides trustworthy guidance.