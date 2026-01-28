# Technical References and Datasets

## Datasets
The integrity of our machine learning models relies on high-quality, domain-specific datasets. We utilize the following sources for training and validation.

### 1. Gig Economy Income Patterns
*   **Source**: Aggregated anonymized data from E-commerce logistics platforms (simulated based on Swiggy/Zomato trends).
*   **Application**: Used to train the **Income Forecasting Engine**. It provides baseline volatility patterns specific to delivery partners (e.g., weekend spikes, monsoon attrition).

### 2. Freelancer Earnings & Job Trends
*   **Source**: Open-source datasets on freelancer marketplaces.
*   **Application**: Validates our volatility classification models against irregular but higher-value income streams (e.g., gig-drivers vs. freelance designers).

### 3. Credit Default Risk Data
*   **Source**: Home Credit Default Risk dataset.
*   **Application**: Calibrates the **Financial Health Scoring System**. We analyze historical default patterns to identify early warning signs in spending behavior (e.g., rapid increase in small-ticket credit usage).

### 4. Indian Consumer Expenditure
*   **Source**: NSSO (National Sample Survey Office) reports and aggregated personal finance studies.
*   **Application**: Establishes baseline "Survival" thresholds. This data helps the **Smart Decision Router** estimate reasonable limits for essential expenses (food, rent) in different urban tiers.

### 5. Mutual Fund Performance Indices 2025
*   **Source**: AMFI (Association of Mutual Funds in India) historical data.
*   **Application**: Powers the **Micro-Investment Engine**. We filter for low-volatility, high-liquidity funds (Liquid/Overnight categories) to ensure recommendations align with the risk-averse profile of gig workers.

## Literature Review
Our architectural decisions are informed by research in the following domains:

*   **Behavioral Economics in Poverty**: Understanding why "scarcity mindset" leads to poor long-term financial decisions, justifying our "Smart Router" interventionism.
*   **Time-Series Forecasting for Irregular Intervals**: Research on applying ARIMA and LSTM models to non-standard time series data (gig work is often bursty rather than continuous).
*   **Explainable AI (XAI) in FinTech**: Methodologies for translating black-box ML outputs into trust-building user communications.
