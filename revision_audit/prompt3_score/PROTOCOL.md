# Score protocol fixed before scoring

Outcome: any unpaid shortfall after asset liquidation within six simulated months,
under NO investing. Reuse router_sim's fixed central generative assumptions and
monthly liability accounting, no router/score-defined labels. Extend simulator
only with train future pool [30,60), past [0,30); validation [60,90), past [30,60);
test [90,n), past [60,90). Donors unchanged. Model sees only initial observed data.
N10000 per seed; train 601/607/613/617/619; validation 11/23/37/53/71;
test101/211/307/401/503. Same fixed household assumptions, no new real-world data.

Baseline 30/25/20/15/10 score; raw 1-score/100 is only an uncalibrated diagnostic.
Fair baseline: training logistic calibration of that scalar score. Corrected
fixed-weight candidate uses debt/monthly-observed-income instead of debt/expenses;
adds absolute sufficiency cap min(weighted score, clip(50+100*(income/expenses-1),0,100)).
Existing five weights unchanged. This prevents expenses increasing debt safety
and prevents high scores when earnings cannot cover absolute expenses. No debt
amortization schedule is inferred in this score cap. Same rounding as JS.

Compare original-calibrated, corrected-calibrated, regularized logistic on original
five factors, logistic on corrected five plus sufficiency factor. StandardScaler
fit on training only. C [.01,.1,1,10], unweighted lbfgs max_iter2000; select validation
Brier, then AUC, then smaller C. Freeze before test; refit train+validation only.
Logistic fitting deterministic; all simulator randomness replicated across five
seeds. Do not select any seed. Test AUC, Brier, 10-fixed-bin ECE/reliability.
95% bootstrap CIs resample whole platform clusters (5), 1000 draws total,
200 per seeds11/23/37/53/71. Exact weighted AUC (including ties), Brier and ECE;
conditional CIs do not represent real-world uncertainty. No test tuning.

Weight sensitivity on validation ONLY: each old component multiplied by0/.5/1.5,
renormalize sum1, calibrate scalar on training; report all15. Monotonic intervention:
train households' expenses +10%, all other factors fixed; compare score changes.
Production weights will remain unchanged: fitted risk coefficients are simulation
predictors, not outcome-calibrated 0–100 health weights or validated phase thresholds.
Corrected fixed-weight formula is eligible for a production defect fix only if
its frozen calibrated score improves BOTH test AUC and Brier over original scalar
AND did so on validation; otherwise keep production, document candidate-only fix.
No post-test alternative selection. No claim that six-month simulated outcomes
justify real-world health weights. Preserve original code/results before changes.
