# Router outcome simulation — frozen before results, 2026-10-17

This is simulation-based outcome validation, not real-world safety validation,
oracle agreement, investment advice or a market backtest. No production changes.

## Data, chronology, independence

Use all eleven data/normal income series separately; never duplicate the five
volatility files. Sort/check contiguous dates, finite nonnegative daily income.
First 60 entries are calibration/past initialization data. Validation resamples
only indices [60,90), with initial observed history [30,60). Held-out simulations
resample [90,n), with history [60,90). No random temporal split. The longer gig
series remains one zomato donor, not many workers. Donor histories previously
inspected by other tasks; this is not an external test population.

N=10000 distinct simulated households per seed, 12 synthetic months of 30 days.
Validation seeds [11,23,37,53,71]; test seeds [101,211,307,401,503]. Common random
numbers for all policies/thresholds within seed/scenario/mode. Five repetitions
are not five independent source populations. All household/shock/market process
parameters below are assumptions, not fitted real-worker epidemiology.

## Exogenous generative process

Pick a source uniformly among 11; scale income by exp(N(0,.25²)) clipped .5–2.
Draw 7-day circular moving blocks with replacement within the allowed partition,
concatenate/truncate to 360 days. Blocks may wrap within that partition; never
cross into another partition. Preserve zeros. Expenses = initial observed 30-day
income * Uniform(.65,1.10), floor Rs1000; initial cash = expenses*Uniform(0,8).
Debt is zero with probability .35, otherwise expenses*Uniform(.25,3).

Draw household regime {ordinary, erosion, disruption} with probabilities
{.60,.30,.10}. Monthly Markov adverse state starts off: entry probabilities
{.06,.12,.18}, recovery {.50,.35,.25}. Income multipliers when adverse
{.70,.55,.20}; monthly persistent trends {1,.985,.995} raised to month index.
Independent monthly mean-one lognormal multiplicative noise sigma=.05.
Expense trend 3% annually; monthly mean-one lognormal noise sigma=.05.
Medical event independent monthly p=.025, cost expenses*Uniform(.5,3);
vehicle repair p=.04, cost expenses*Uniform(.25,1.5). Events can coincide.
Debt amortizes initial principal/12 each month plus 18% annual interest on
remaining principal. Unpaid bills become arrears, accrue 18% annual interest,
are paid before new discretionary investment next month. No new credit access.

Analytics at start of month depend ONLY on observed incomes before that month:
exact existing trend/weekday 15-day forecast and trailing30 sample-CV runtime
thresholds (snapshot actual optional artifact/defaults), health formula/weights
unchanged. Independent analytics failures: .02 missing forecast, .02 missing
volatility, .01 explicit error status; remaining .95 available. They do not
predict shocks by construction. Unknown volatility uses existing health default.
Risk preference fixed low. No synthetic HIGH label is defined by router rules.

## Cash-flow and asset assumptions (all scenario assumptions)

All policies start with zero investments, same cash/debt/income/expense/shocks.
Gate then contribution occurs at month START, before future income/bills.
Cash earns 3% annually /12; portfolio gross monthly multiplier is lognormal with
expected monthly gross 1+.05/12, annual volatility 8% (log correction sigma²/2),
independent of income/shocks. At month end, realize income and pay expenses,
debt service, shocks, and prior arrears with interest. If cash is negative,
sell portfolio at 2% haircut up to full value; any remaining deficit becomes
unpaid arrears. Retain all households after insolvency; do not drop failures.
Sale records forced liquidation even if it successfully pays all bills.
Debt principal amortization plus arrears accounting conserves liabilities.

Supplementary fixed scenarios, no threshold tuning: neutral (portfolio drift3%,
vol0, haircut0), stress (shock probabilities doubled; portfolio drift0%, vol15%,
haircut5%). Keep all other parameters fixed and the same underlying random
draws. These assumed assets are not the curated products' realized returns.

## Policies and execution

(a) always permit investing (stylized ungated comparator, not a claim about any
commercial robo-advisor); (b) original frozen router: liquidity>=1, debt/expense
<=2, score>=70, volatility!=high; (c) revised production router: liquidity>=3,
debt/expense<=.5, score>=70, LOW/MEDIUM and valid available analytics; (d) health
score>=70 only; (e) no investing. No oracle pass/fail outcomes are used.

Common PRIMARY budget is actual engine formula:
floor(max(0,min(max(past30Income-expense,0)*.25,
max(cash-3*expense,0)*.10))). DIAGNOSTIC reserve-free execution uses
floor(min(max(past30Income-expense,0)*.25,cash)). Both deduct full approved
budget into a common hypothetical liquid asset, with no per-product ranking,
lock-ins, min-ticket filtering or allocation rounding. Thus this tests gates
with the existing budget, NOT end-to-end product implementation. The second
mode changes execution, not gates, and cannot be called production performance.
Blocked policies retain surplus as cash; no extra discretionary debt repayment.

## Outcomes and threshold selection

For each seed/policy/scenario/execution mode report users with any unpaid
shortfall, any forced sale, either event, mean months below one current month's
expenses (primary liquidity breach), mean months below three months (secondary),
mean final net wealth = cash + portfolio - remaining principal - unpaid arrears,
median final net wealth, mean wealth/initial expense, % ever cleared, % cleared
at initial month and across all user-months, % ever actually contributing,
mean total contributions, mean final arrears. Every rate denominator is all N.
Monthly breaches assessed after settlement. Both policies can fail even when
initially blocked. No-investing is a substantive benchmark, not a gold oracle.

Validation ONLY: sweep revised-gate liquidity {1,2,3,4,5,6} and debt/expense
{.25,.5,.75,1,1.25,1.5,1.75,2}; keep all other checks unchanged. Show all 48 cells
for both execution modes, seed means/SD, Pareto flags: minimize shortfall rate,
maximize actual participation, maximize mean final net wealth. Compute Pareto
on raw validation means, no rounded dominance. More objectives/outcomes remain
in tables even if not used for Pareto. No complete test grid.

Predeclared operational selection (central scenario only, separately by mode):
among threshold pairs with validation shortfall <= no-investing+.005 and mean
months below one expense <= no-investing+.05, maximize ever-contributing share;
ties maximize mean final wealth, then higher liquidity, then lower debt cutoff.
These risk budgets are illustrative research constraints, NOT outcome-derived
clinical/financial safety tolerances. If no pair meets budgets choose no-investing.
Freeze choices and hashes BEFORE held-out runs. Test the five named policies
plus selected pair only; retain 3/.5 production thresholds regardless of outcome.
Compare existing 3/.5 to validation frontier and chosen pair honestly, including
failure to justify it. Never choose parameters on held-out results.

Report means and sample SD over five seeds; paired policy-minus-no-investing and
revised-minus-original seed deltas with t-based 95% CI (df4). Monte Carlo intervals
are conditional on assumed distributions/donor pool, not real-world uncertainty.
Record actual event counts, regime/source coverage, cohort hashes, all commands,
environment, data/code snapshots, failures and source preservation. Test vectorized
health/gates/forecast against actual frozen Node/Python modules on sampled
snapshots; that check establishes implementation consistency only. Separately
test conservation, cash settlement and outcome definitions. No new dependencies.
