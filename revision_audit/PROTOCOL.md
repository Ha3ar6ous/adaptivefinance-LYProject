# Revision protocol: prompts2–5

Baseline: baseline_results.json, commitdb3fc1d, dirty-tree hashes captured there.
Do not edit archived outputs, original datasets/labels or the research paper.

Deploy only the previously selected CV30 rule(.45/.75). Original forward14
target terciles, examples, chronology, feature definitions, candidate families
and validation-selected grid rule remain frozen. The historical comparator is
the archived .35/.75 runtime, explicitly separate from current deployment.
Recompute current deployment predictions on exactly the same examples, and
paired macro-F1 CIs using whole-platform cluster resampling: five seeds
11/23/37/53/71 ×1000 draws; no test selection or threshold adjustment.

Reevaluate the existing corrected hand scalar on the same score train/validation/
test partitions and seeds, with deployed volatility features. Existing candidate
families, C grid, validation selection and rounding remain unchanged. Adoption
requires both calibrated AUC↑ and Brier↓ on validation AND test versus the
calibrated original scalar; only the corrected fixed-weight scalar was eligible
under the existing guard. Learned log-odds models are diagnostic risk predictors,
not replacements for health phases or score70. If the scalar fails, retain health.

Router ablations retain the existing generator, household seeds101/211/307/401/503,
N10000/seed, monthly accounting, 12 months, current production health and deployed
volatility. Central/stress/neutral and engine_budget/reserve_free are separate.
Assert generated cohort hashes equal baseline (analytics are not in that hash).
Do not refit shock/return/expense assumptions or select new thresholds.

All ablation gates retain available/valid analytics; removing volatility removes
the label restriction, not the analytics requirement. Basic liquidity-only/debt
gates also require valid analytics, explicitly. No-score and L+D+vol gates are
identical. The suitability-style proxy is our own unvalidated checklist:
positive observed30 income surplus, declared low risk compatible with the
hypothetical low-risk asset, liquidity>=1 and valid analytics. It is not an
implementation of a regulation or commercial advisor.

Matched participation is exact at each month: compute the reference full-gate
mask on its current cash/debt state; k is its actual number cleared that month.
Select k among valid users (same exogenous valid set),
uniform without replacement or by highest current liquidity. Comparator outcomes
therefore affect their ranking state, but the target k is common. Match monthly
user-month clearance, not ever-cleared union or actual positive contributions;
the budget constraint can make investment participation differ. Report those
differences, do not call them exact investor matching. Five random-gate seeds
11/23/37/53/71 are crossed with every household seed using separate streams,
never best-seed selection. Average all assignments on the same households without
claiming additional independent users. Stable index tie breaking for liquidity.

Paired ablation uncertainty: retain household outcomes, aggregate by source
platform across all five seeds, and resample the same five platform clusters
for both policies.5000 draws (1000 per11/23/37/53/71). This represents uncertainty
conditional on this small donor pool, not population validation. Report absolute
forced-sale percentage-point differences vs full revised gate and percentile95%
CIs. No CI-based policy selection. Keep policy-point estimates and per-seed rows.

Prompt5 replays the full existing benchmark/test workflows after source edits,
with fresh outputs. Frozen historical comparator outputs remain historical;
current production metrics are separately named. Tests that encode preserved
known defects continue to fail, with their names and reasons retained. Count
each unique suite once, not report-triggered repeats. Live API quotas/latency
cannot reproduce exactly and are separately measured, without retries.
