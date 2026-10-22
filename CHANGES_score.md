# Health score outcome audit

2026-10-17: inspected healthScoreService and router simulator. Outcome is six-month
unpaid shortfall under NO investing, independent of the score/router oracle.
Frozen protocol: score_audit/PROTOCOL.md. No production change before evaluation.
New scripts derive a train-only simulator partition without editing router_sim or
its results. Fixed-weight candidate fixes expense/debt denominator and adds an
income-sufficiency cap. Logistic fits are research risk models, not assumed optimal
health-score weights. Exact results and changes follow after execution.

## Executed results (simulation only)

Data/provenance/expense/shock assumptions: router_sim/PROTOCOL.md; source CSVs
unchanged. Train/validation/test each 50,000 synthetic households, five seeds ×
10,000. Train outcomes resample source days30–59, validation60–89, test90–end;
all initial features precede outcomes. Six-month no-investing unpaid shortfall
is independent of score/gate decisions. Held-out events: 7,572/50,000.
Original CSV generation seeds and real-worker population remain unknown.

All four logistic families selected C=.01 on validation Brier; final fit on
train+validation only. Models deterministic; simulator seeds fixed in protocol.
No production weights/formula changed: corrected scalar failed the predeclared
validation AND test AUC/Brier improvement guard. Known production defects thus
remain, explicitly; their candidate fixes exist only in the research formulation.
Do not silently deploy the better six-factor risk predictor as a 0–100 health score.

| Held-out predictor | AUC | 95% CI | Brier | 95% CI | ECE10 |
|---|---:|---|---:|---|---:|
| Original raw 1-score/100 | .832602 | [.813403,.850433] | .135540 | [.128372,.141858] | .184781 |
| Corrected raw scalar | .779483 | [.768746,.791978] | .180760 | [.177589,.184937] | .268215 |
| Original, training logistic calibration | .832602 | [.813403,.850433] | .097646 | [.085627,.107635] | .007967 |
| Corrected, training logistic calibration | .779483 | [.768746,.791978] | .109427 | [.088402,.125899] | .022596 |
| Logistic original five factors | .872166 | [.857777,.889482] | .089643 | [.077485,.102853] | .020666 |
| Logistic corrected factors + sufficiency | .888228 | [.873475,.906567] | .081197 | [.070538,.094238] | .007313 |

Exact values, ECE CIs and reliability bins: score_audit/results_20261017/
test_metrics.csv and calibration_bins.csv. CIs: 1,000 whole-platform cluster
bootstrap draws, 200 per seeds11/23/37/53/71, exact tie-aware weighted AUC. Only
five source platform clusters; intervals are conditional and do not establish
real-worker validity. Uncalibrated raw-score Brier is diagnostic, not proof that
the original health score was intended to be a probability.

Expense +10% intervention on 50,000 TRAIN profiles, holding other inputs fixed:
original score increases in **20,312**, unchanged18,910, decreases10,778;
corrected increases **0**, unchanged8,113, decreases41,887. Candidate debt safety
uses debt/observed monthly income; the income sufficiency cap is
clip(50+100*(monthlyIncome/monthlyExpenses−1),0,100). It fixes directional defects
but harms discrimination when collapsed to this hand-designed scalar. A sensible
monotonic property does not guarantee better predictive utility.

Fifteen weight ablations/perturbations (component×0/.5/1.5, renormalize) retained
in validation_weight_sensitivity.csv, validation ONLY. Coefficients and original
feature-scale intercepts in coefficients.csv are risk log-odds, not optimal
positive health-score weights. Fitted coefficients/70-point routing threshold
have not been validated for production financial decisions.

Added six automated checks: candidate monotonicity, retained original failure,
frozen selection, source preservation, recomputed held-out AUC, and exact clustered
weighted-AUC implementation versus sklearn. Run output saved separately.
Production source and prior results preserved before any later prompts modify
other services. Environment reused: Python3.11.9, numpy2.3.4/pandas2.3.3,
scipy1.16.3/sklearn1.7.2. No new dependency or source label changes.

Reproduce from repository root into a NEW directory:

```powershell
$py='forecast_audit/.venv/Scripts/python.exe'
& $py score_audit/run.py --out score_audit/reproduction --stage prepare
& $py score_audit/run.py --out score_audit/reproduction --stage select
& $py score_audit/run.py --out score_audit/reproduction --stage test
$env:SCORE_AUDIT_RESULTS='score_audit/reproduction'
& $py -m unittest discover -s score_audit -p test_score.py -v
```

Six tests passed, zero failed. Tests default to archived results_20261017 and
accept SCORE_AUDIT_RESULTS for fresh outputs. The original
router simulator was copied and given a train partition; its original files and
results were never edited. Negative finding: neither current hand weights nor
the naive corrected hand scalar are empirically optimal. Strongest supported
claim: absolute income coverage adds predictive information in this assumed
six-month simulation when learned with regularization, without a production change.
