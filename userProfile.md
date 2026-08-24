# Demo User Profiles

These two profiles have been seeded into the database to demonstrate how Adaptive Finance handles different financial situations and adapts its recommendations accordingly.

## Profile 1: Aditya Singh (Good Metrics)
**Email:** `aditya.s@gmail.com`  
**Password:** `password`

### Financial Data:
- **Bank Balance:** Rs 85,000
- **Monthly Expenses:** Rs 25,000
- **Debts:** Rs 0
- **Investments:** Rs 15,000
- **Risk Preference:** Medium
- **Income History:** High and very stable. Works consistently every day and earns Rs 2,000 - Rs 2,499 daily.

### Expected App Behavior (Good Metrics):
1. **Health Score:** Will be very high (likely 90+). The phase will be categorized as "Growth".
2. **Dashboard Overview:** Will suggest conservative/medium risk investing. 
3. **Forecasts:** Very stable and high predicted income due to zero missed days and stable average.
4. **Health & Decisions:** 
   - **Liquidity (Cash Buffer):** High (bank balance easily covers monthly expenses).
   - **Debt Safety:** Excellent (0 debt).
   - **Decision Router:** Will actively "Allow" investing and explicitly block "Debt Payoff" (since there is none).
5. **Investment Suggestions:** Will match them with moderate-growth or equity funds (like Index Funds or Flexi Cap) because their cash flow and liquidity can handle some market risk.

---

## Profile 2: Vikram Gupta (Poor Metrics)
**Email:** `vikram.g@gmail.com`  
**Password:** `password`

### Financial Data:
- **Bank Balance:** Rs 1,500
- **Monthly Expenses:** Rs 30,000
- **Debts:** Rs 60,000
- **Investments:** Rs 0
- **Risk Preference:** Low
- **Income History:** Low and highly volatile. Misses work frequently (40% of the time, 0 income), and on working days earns between Rs 100 to Rs 1,299 randomly.

### Expected App Behavior (Poor Metrics):
1. **Health Score:** Will be very low (likely under 40). The phase will be categorized as "Crisis" or "Survival".
2. **Dashboard Overview:** Will urgently recommend building an emergency fund or paying down debt. Investing will be strongly discouraged.
3. **Forecasts:** Low and highly volatile, predicting cash flow shortages.
4. **Health & Decisions:**
   - **Liquidity (Cash Buffer):** Extremely poor (Rs 1,500 cannot cover Rs 30,000 expenses).
   - **Debt Safety:** Critical (Rs 60,000 debt with high expenses and low balance).
   - **Income Stability:** Extremely low due to frequent 0-income days.
   - **Decision Router:** Will "Block" investing entirely. Will strongly "Allow" and prioritize debt payoff and liquidity building.
5. **Investment Suggestions:** Will likely show no viable high-risk investments, suggesting liquid funds or nothing at all until debt is paid.

---

## Profile 3: Vijay Kumar (High Income, High Volatility, High Debt)
**Email:** "vijay.k@gmail.com"
**Password:** "password"

### Financial Data:
- **Bank Balance:** Rs 2,500
- **Monthly Expenses:** Rs 25,000
- **Debts:** Rs 800,000
- **Investments:** Rs 0
- **Risk Preference:** Low (defaulted)
- **Income History:** High income but extremely volatile. Misses work frequently (30% of the time, 0 income), earns moderately sometimes (Rs 800 - Rs 1,499), but also has very high income days (Rs 4,000 - Rs 7,999).

### Expected App Behavior:
1. **Health Score:** Will be relatively low (Crisis or Survival phase) due to the extreme debt and low cash buffer, despite the high income.
2. **Dashboard Overview:** Will recommend prioritizing cash flow protection and aggressively paying down debt.
3. **Forecasts:** Will show a high overall projected income but a very high coefficient of variation (High Volatility).
4. **Health & Decisions:**
   - **Liquidity (Cash Buffer):** Very poor (Rs 2,500 vs Rs 25,000 expenses).
   - **Debt Safety:** Critical (Rs 800,000 debt drastically brings down the health score).
   - **Income Stability:** High volatility.
   - **Decision Router:** Will "Block" investing because the emergency fund is below 1 month, debt is too high, and income is volatile.
5. **Investment Suggestions:** Will block investing and advise focusing on safety actions like building an emergency fund first.

