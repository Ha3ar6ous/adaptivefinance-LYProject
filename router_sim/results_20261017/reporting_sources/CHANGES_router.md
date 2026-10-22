# Router outcome simulation change log

## 2026-10-17 — inspection and frozen scope

- Inspected README, router, healthScoreService, investment engine, original router
  snapshot under paper_audit/baseline, forecasting/volatility modules and product
  loader. No core implementation changes. Existing server edits and results belong
  to previous tasks and will be preserved.
- Original gate uses one-month liquidity/debt<=2; revised uses three months/debt
  <=.5 and valid analytics. Both require health>=70 and reject HIGH volatility.
- Engine already retains three expense-months when computing its budget. This
  can mask liquidity-gate differences; primary analysis preserves this formula,
  with an explicitly separate reserve-free diagnostic.
- Added router_sim/PROTOCOL.md before simulations. Defines source chronology,
  next-month exogenous cash flows, assumed shocks/returns, outcomes, five seeds per
  partition, validation-only threshold selection, and separate held-out testing.
- This is simulation-based outcome evidence, not real-world validation or a
  historical investment backtest. Commands/results and every material change
  will be appended after execution. Existing labels/results will not be edited.

## Implementation checks before scoring

- Added vectorized simulator, read-only Node bridge and ten initial unit checks.
  First run: 9 passed, 1 error: a small test cohort can leave a donor unselected;
  reshaping its empty bootstrap block array failed. Skip empty donor groups.
  This is a generator robustness fix, not a policy/outcome change; no full-size
  validation or test simulations had run. Reproduction: run test_simulator.py.
- Clarified monthly portfolio expectation as 1+annual drift/12 before scoring;
  lognormal correction makes the neutral scenario match cash's monthly yield.

## Executed methodology and reproducibility

**All results below are simulation-based.** They measure unpaid bills and forced
sales in generated cash flows, not agreement with a router-derived safety oracle.
Existing oracle checks remain implementation tests only. No production rule,
health weight, source income, original label, paper or existing result was edited.

Added files: `router_sim/simulate.py`, `bridge.cjs`, `PROTOCOL.md`,
`requirements.txt`, `.gitignore`, `test_simulator.py`, `test_results.py`,
`report.py`, `finalize.py`. Scripts write exclusively to a new directory and
refuse overwrites. Results: **`router_sim/results_20261017/`**.

Environment: Windows build 22631; Python 3.11.9; NumPy 2.3.4, pandas 2.3.3,
SciPy 1.16.3; Node v22.18.0. Reused `forecast_audit/.venv`, no installation.
Base Git HEAD `db3fc1d56a8f38042a91e21ec6164ac8be0dfe40`, already-dirty server
files preserved. **206 existing files passed SHA-256 preservation checks**,
including previous forecasting/volatility results, server code and reports.
Source/runtime snapshots, environment, product snapshot and hashes are retained.

### Generative process and chronology

Full frozen specification: `router_sim/PROTOCOL.md` (copied under results/snapshots).

- Eleven `data/normal/*.csv` donors, 1,380 rows; five platforms. Ten histories
  have 120 contiguous days; `gig_income_data.csv` has 180, platform zomato.
  Files named stable/volatile are income-pattern donors, not independent real
  workers with known sampling provenance. Existing volatility files duplicate
  donors and are excluded. No data-generation seeds for original CSVs are known.
- Calibration/past pool indices 0–59; validation future blocks only 60–89;
  held-out future blocks only 90–end. Initial observed histories are 30–59 for
  validation and 60–89 for test. Circular seven-day blocks wrap only WITHIN their
  own allowed partition. Validation uses 330 raw future donor-days; test 390.
  All raw source files were inspected by prior work: this is not an external test.
- **10,000 households per seed**; validation seeds **11,23,37,53,71**; held-out
  seeds **101,211,307,401,503**. Thus 50,000 households per policy per partition;
  12 months × 30 days. The same households and random shocks/returns are paired
  across policies/modes; scenarios reuse households. Repeated policy/scenario
  trajectories are NOT counted as independent new households.
- Uniform donor sampling; household income multiplier clipped lognormal
  sigma=.25, range .5–2. Monthly expense budget is initial observed monthly
  earnings × Uniform(.65,1.10), floor ₹1,000; initial cash 0–8 expense months;
  debt zero with probability .35, otherwise .25–3 expense months uniformly.
- Ordinary/erosion/disruption regimes probabilities .60/.30/.10. Adverse-state
  entry .06/.12/.18, recovery .50/.35/.25, adverse income factors .70/.55/.20,
  monthly trends 1/.985/.995. Mean-one monthly income and expense noise sigma=.05;
  expense inflation 3% annually. Medical monthly probability .025, cost .5–3
  expense months; repair probability .04, cost .25–1.5. All are declared assumptions.
- Debt: scheduled initial principal/12 monthly plus 18% annual interest on
  remaining principal. Unpaid obligations persist as arrears at 18% annual rate;
  available cash repays arrears before new investment. Remaining arrears enter
  end-month bills with interest. No household is removed after a shortfall.
- Gates see the known monthly expense budget; random expense deviations and
  future shocks are unknown. Forecast/volatility use strictly prior incomes.
  Health score uses unchanged application weights and rounding. Independently
  simulated analytics failures: .02 missing forecast, .02 missing volatility,
  .01 error status. Missingness has no manufactured association with future harm.
- Central asset assumptions: cash 3%/year paid monthly; hypothetical investment
  expected monthly gross 1+.05/12, annual volatility .08, forced-sale haircut .02.
  Neutral: asset 3%, volatility0/haircut0. Stress: asset0%, volatility.15/haircut.05,
  doubled medical/repair probabilities. These are NOT estimated market returns.
  Returns are independent of income/shocks; no market-crash correlation assumed.
- Contribution at month start; income, recurring expenses, debt and shocks settle
  at month end. Negative cash triggers an asset sale; any residual is unpaid
  shortfall. Final wealth = cash+marked portfolio−remaining debt−arrears; principal
  is fully scheduled by month12, so unpaid principal remains in arrears. Final
  portfolio is marked, not obligatorily sold with a terminal haircut.

### Policies, execution and outcome definitions

Always-invest means **always permit** the common affordable contribution, not
compulsory investment of all cash or a faithful model of any commercial advisor.
Original gate uses liquidity≥1, debt/expense≤2, health≥70, volatility≠HIGH;
revised uses liquidity≥3, debt/expense≤.5, health≥70, LOW/MEDIUM and valid analytics.
Score-only uses health≥70; no-investing always retains surplus as cash.

PRIMARY execution reproduces the engine BUDGET:
`floor(min(max(past30Income-expense,0)*.25,max(cash-3*expense,0)*.10))`.
DIAGNOSTIC reserve-free execution uses `floor(min(max(past30Income-expense,0)*.25,cash))`.
Only allowed budgets are invested. All policies buy the SAME hypothetical liquid
asset. Product min-tickets, filtering/ranking, lock-ins and per-product allocation
rounding are NOT simulated; the 37-product snapshot is provenance only. This is
gate-and-budget outcome validation, not end-to-end investment-engine validation.
No optimized debt repayment is introduced for blocked users.

Shortfall rate: share with any residual unpaid bills after asset sales over the
full horizon (tolerance ₹1e-8). Forced liquidation: any forced asset sale >₹1e-9,
including a sale that prevents shortfall. Combined rate is their union, not sum.
Liquidity breaches count end-month CASH below one current known expense month
(primary) and three (secondary), averaged over ALL households. Portfolio balances
are excluded from cash cover. Clearance is reported initially, across user-months
and ever over horizon; actual contribution is separate. Final wealth includes
initial holdings and net earned cash flows, not just investment performance.
Tables include means, medians, initial-expense normalization and final arrears.

## Main held-out results — central scenario, production engine budget

Each row: five seeds × 10,000 users, shared exogenous paths. Percentages use all
50,000 users. Means are across equal-size seeds; SDs retained in CSV.

| Policy | Shortfall % | Forced sale % | Either % | Months cash<1 | Months cash<3 | Mean final wealth ₹ | Ever cleared % | Ever invested % |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Always permit | 31.120 | 7.570 | 31.444 | 3.03248 | 5.71060 | 52,099.27 | 100.000 | 65.372 |
| Original gate | 31.124 | 3.156 | 31.280 | 3.02030 | 5.66576 | 52,073.67 | 74.544 | 53.240 |
| Revised gate | 31.124 | 1.132 | 31.192 | 3.01420 | 5.63636 | 52,052.46 | 51.768 | 43.012 |
| Score-only ≥70 | 31.124 | 4.066 | 31.322 | 3.02306 | 5.67972 | 52,085.48 | 78.138 | 59.326 |
| No investing | 31.124 | 0.000 | 31.124 | 3.01020 | 5.61384 | 52,022.54 | 0.000 | 0.000 |
| Validation-selected 3/2 | 31.124 | 3.048 | 31.276 | 3.01984 | 5.66296 | 52,071.15 | 63.020 | 52.244 |

Original versus revised counts: unpaid shortfall **15,562 versus 15,562**;
forced sales **1,578 versus 566**; ever-cleared **37,272 versus 25,884**;
actually contributing **26,620 versus 21,506**. Reduced forced sales accompany
lower investment exposure; this is not evidence of equal-deployment superiority.

Paired revised-minus-original, five-seed t-based 95% intervals (df4):

| Outcome | Change | 95% Monte Carlo CI |
|---|---:|---|
| Shortfall | 0.0000 percentage points | [−.0088, .0088] pp |
| Forced sale | −2.0240 percentage points | [−2.1393, −1.9087] pp |
| Either event | −.0880 percentage points | [−.1201, −.0559] pp |
| Months below one expense | −.006100 | [−.007221, −.004979] |
| Mean final wealth | −₹21.2186 | [−₹23.0174, −₹19.4197] |
| Ever cleared | −22.7760 percentage points | [−23.1129, −22.4391] pp |

These intervals quantify conditional simulation noise, not uncertainty about
real-world parameters or donor representativeness; comparisons are descriptive
and not adjusted for multiple comparisons. Shortfall prevalence is an assumed
population/scenario result, not a measured prevalence in gig workers.

## Diagnostic execution and scenario negatives

Reserve-free central results (changes execution; not production performance):

| Policy | Shortfall % | Forced sale % | Months cash<1 | Mean final wealth ₹ | Ever invested % |
|---|---:|---:|---:|---:|---:|
| Always permit | 31.140 | 26.104 | 3.21812 | 52,117.74 | 90.156 |
| Original gate | 31.124 | 5.914 | 3.04030 | 52,084.83 | 61.934 |
| Revised gate | 31.126 | 1.152 | 3.01554 | 52,054.30 | 43.016 |
| Score-only | 31.126 | 7.086 | 3.04592 | 52,098.69 | 68.210 |
| No investing | 31.124 | 0.000 | 3.01020 | 52,022.54 | 0.000 |
| Validation-selected 1/2 | 31.124 | 5.756 | 3.03904 | 52,081.84 | 60.864 |

Primary stress scenario: original/revised/no-invest shortfall **39.968/39.960/
39.948%**, forced sale **5.672/2.336/0%**, final wealth **₹19,430.22/₹19,472.40/
₹19,524.65**. Revised-minus-original shortfall −.0080 pp, conditional CI
[−.0136,−.0024] pp: small even where the interval excludes zero. No-investing has
higher mean wealth and lower shortfall than revised in this assumed stress case.

Neutral scenario: **all policies' mean final wealth equals ₹52,022.54** under
primary execution. Equal deterministic asset/cash returns with zero sale fee
make transfers wealth-neutral; automated checks confirm this per seed and mode.
Forced-sale and cash-cover differences still occur because cash is the liquidity
measure. This prevents interpreting transfers themselves as newly created wealth.

## Validation threshold sweep and Pareto interpretation

Swept liquidity **1,2,3,4,5,6** months × debt/expense
**.25,.5,.75,1,1.25,1.5,1.75,2** = **48 pairs per execution mode**, five validation
seeds each. Other revised checks fixed. All rows, seed SDs and matrix-form rates
are saved. NO full test sweep: only the frozen chosen pair is added to held-out
policies. Stress/neutral do not retune the choice.

Selection was predeclared: shortfall at most no-invest+.5pp AND mean months below
one expense at most no-invest+.05; among eligible cells maximize actual investment
participation, then wealth, then higher liquidity/lower debt. **All 48 pairs in
both modes pass these illustrative risk budgets**. Thus the constraints are slack
and cannot establish scientifically optimal risk thresholds.

Frozen selected thresholds: engine-budget **3/2**, reserve-free **1/2**. The
production **3/.5** policy stays unchanged. Higher debt cutoff won participation
under the predeclared objective; this is not evidence recommending more debt.

Validation Pareto objectives: minimize shortfall, maximize actual participation,
maximize mean wealth. Original 3/.5 is off this THREE-objective frontier in both
modes. Forced-sale risk is shown but is NOT a dominance objective; 3/.5 has fewer
forced sales, so 'dominated' must not be generalized to all safety outcomes.

| Execution | Pareto liquidity/debt | Shortfall % | Forced sale % | Ever invested % | Mean wealth ₹ |
|---|---|---:|---:|---:|---:|
| Engine budget | 1/2, 2/2, 3/2 (identical outcomes) | 26.930 | 2.164 | 47.238 | 100,981.67 |
| Reserve-free | 1/2 | 26.934 | 4.168 | 53.478 | 100,996.92 |
| Reserve-free | 2/2 | 26.932 | 3.464 | 51.766 | 100,995.29 |
| Reserve-free | 3/2 | 26.930 | 2.206 | 47.238 | 100,989.16 |
| Engine budget production reference | 3/.5 | 26.932 | .862 | 40.470 | 100,950.71 |
| Reserve-free production reference | 3/.5 | 26.932 | .886 | 40.470 | 100,954.80 |

Engine liquidity thresholds 1–3 produce **identical investment/outcome paths for
each debt cutoff** because the budget already enforces a three-month reserve.
Clearance counts can differ even when money never moves. This structural masking
is tested explicitly. Neither this equality nor the selected 3-month tie-break
independently validates a 3-month router threshold. The stricter .5 debt cutoff
has an observed forced-sale/participation trade-off, not an established optimum.

## Tests, failures and files safe to cite

- Initial small-cohort generator error was fixed before any full-size run and
  logged above. No validation/test run failed; no cases were dropped or reclassified
  after observing results. All households remain in every outcome denominator.
- **20 final tests passed, 0 failed**, captured at `final_tables/tests.txt`.
  Tests include accounting with unpaid liabilities/sale fees; sales preventing
  shortfall; no-income-surplus invariance; neutral wealth conservation; poisoning
  test data without changing validation bootstrap; future-feature isolation;
  common paths; threshold selection; rate denominators; no test grid; preservation.
- **600 sampled snapshots** compared against frozen actual application health,
  original/revised routers and engine budget (300 validation, 300 test): **0
  mismatches**; vectorized forecast versus actual Python runtime maximum error
  **0.0**. This is implementation consistency, explicitly NOT outcome validation.
- No coverage percentage claimed. No network/API, database, new dependency,
  production change or original-paper edit was needed.
- `final_tables/central_engine_budget.csv`: primary paper table (rates in %).
  `central_reserve_free.csv`: diagnostic table. `all_scenarios_mean.csv` /
  `all_scenarios_seed_sd.csv`: complete fixed scenario results.
  `paired_effects_95ci.csv`: paired deltas with explicit units.
  `validation_threshold_tradeoffs.csv` / `validation_pareto_frontier.csv` and
  `validation_*_matrix.csv`: complete grid and trade-offs. Raw per-seed tables,
  source/regime/event counts and cohort hashes remain in the results root.

Defensible contribution: reproducible simulation outcomes reveal lower forced-sale
exposure from conservative gating, at a participation/wealth cost under central
assumptions; the engine reserve masks lower liquidity thresholds; unpaid shortfall
is largely unchanged. Do not claim prevention of financial distress, optimal
thresholds/weights, suitability of real products, profitability, real-world safety,
or superiority over commercial advisors. The no-investing benchmark must remain.

Remaining limitations: few donor histories/unknown provenance; equal-donor sampling;
short bootstrap pools recycled into a year; blocks splice calendar effects;
fixed regime/shock/debt/expense assumptions; no household correlations or external
calibration; independent returns; no product lock-ins/tax/inflation-adjusted wealth,
transaction delays or borrowing response; fixed low-risk profiles; monthly rather
than intramonth cash settlement can hide daily shortfalls. Cash-only liquidity
breaches do not mean total liquid assets are unavailable. These results do not
validate health score>=70 or make outcome-defined safety a deterministic rule.

## Exact commands (PowerShell, repository root)

Executed using `router_sim/results_20261017`; reproduce into a fresh directory:

```powershell
$py = 'forecast_audit/.venv/Scripts/python.exe'
$out = 'router_sim/reproduction_20261017'
& $py -m unittest discover -s router_sim -p test_simulator.py -v
& $py router_sim/simulate.py --out $out --stage prepare
& $py router_sim/simulate.py --out $out --stage validation
# selection.json now frozen before held-out generation
& $py router_sim/simulate.py --out $out --stage test
& $py router_sim/report.py --out $out
& $py router_sim/finalize.py --out $out
# Standalone full check against this output:
$env:ROUTER_SIM_RESULTS = $out
& $py -m unittest discover -s router_sim -p 'test_*.py' -v
```

No install was performed. A separate Python3.11 environment with the pinned
`router_sim/requirements.txt` and Node22 can reproduce the audit if the reusable
interpreter is unavailable. Actual stage wall times: prepare **2.3326793s**,
validation **8.6318064s**, held-out simulations **5.1738960s** on this machine;
these are observed audit-run times, not application-serving benchmarks.
