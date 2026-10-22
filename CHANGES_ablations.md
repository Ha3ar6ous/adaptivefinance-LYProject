# Prompt4: policy outcome ablations

Added revision_audit/ablate.py, test_ablate.py and protocol; extended only the
research simulator's simulate function with optional gate_fn/return_details.
Default execution is unchanged, checked against every old policy, metric,
scenario, household seed and budget mode. Production router, health, engine,
forecast, data and labels were not edited for this prompt.

Commands executed:

```
forecast_audit/.venv/Scripts/python.exe -m unittest discover -s revision_audit -p test_ablate.py -v
forecast_audit/.venv/Scripts/python.exe revision_audit/ablate.py --out revision_audit/ablations_20261018
```

Eight tests passed. Generated78 aggregate rows (13 policies×3 scenarios×2 budget
modes), retaining all17 raw policy/randomization rows per household cohort.
Five household seeds101/211/307/401/503,10000 users each, identical exogenous
cohort hashes to baseline. Five crossed random-gate seeds11/23/37/53/71. Monthly
clearance counts match exactly; ever-cleared and positive-investment rates can
differ and are separately reported. Random averages use250000 dependent
assignment-household trials on50000 unique users, not250000 independent users.

All13-policy outcomes, per-seed rows, full counts, clusters and paired
platform-bootstrap5000-draw CIs are in ablation_results.json and
revision_audit/ablations_20261018. Root ablation_table.tex is a compact single-column
booktabs/graphicx snippet for central engine-budget results; all six panels are
in all_scenario_tables.tex. No simulation outcome is described as real-world
financial safety, profitability or regulated-advisor performance.

Central engine-budget forced sales: full1.132%, matched savings0.698%, matched
random2.126%. Savings-minus-full=-.434pp CI[-.8838439497465286,-.06040637012630426];
random-minus-full=.994pp CI[.6638323299186749,1.2834947907146774]. Same cleared
user-month rate23.262%; actual ever-invested43.012%,39.42%,46.0696%, respectively.
Thus the full gate does NOT outperform savings ranking at matched monthly
clearance in this scenario; investor participation is not exactly matched.
No-score and L+D+volatility are equivalent by construction and verified by
household outcomes. No-score also yields the same measured outcomes as full
in all six scenario/mode cohorts; do not claim an incremental score contribution.

Negative results and all stress/neutral/reserve-free outputs are retained.
The suitability comparator is explicitly our own illustrative checklist with
fixed low risk, positive surplus,>=1 month liquidity and valid analytics;
it is not a regulatory implementation. Five-platform donor pool,
hypothetical liquid assets, monthly settlement and exogenous shock assumptions
limit all effect estimates. No threshold or policy was selected on test outcomes.

The protocol wording was clarified after execution to state the implemented
five crossed random assignments and reference-state matching precisely;
this did not change code, outcomes, thresholds or selection.
