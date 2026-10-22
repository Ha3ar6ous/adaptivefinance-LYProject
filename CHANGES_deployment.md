# Prompt3: deploy the frozen volatility rule; apply the score guard

Changed ml_service/modules/volatility.py to CV30 .45/.75. Stale7-day quantile
artifacts can no longer override this frozen deployment. The offline helper
still produces research candidates; README now distinguishes the two. Added
four boundary/pinning/artifact tests. One initial boundary-fixture failure was
caused by100*(1-.45) floating arithmetic; centered100±100*CV yields the intended
exact sampleCV. No tolerance or classifier optimization was introduced.

Updated router_sim runtime snapshot capture, score_audit runtime thresholds,
router simulator fixtures and retained Python boundary probes. The forward-CV
audit now explicitly loads its archived .35/.75 comparator; its original targets,
training terciles, candidate grid and selected .45/.75 rule remain unchanged.
The live deployment is evaluated separately on exactly the same247 test rows.
Updated the Node integration test to accept a fresh-fixture path via environment.
Archived results, source data, labels and the paper remain unchanged.

Executed commands:

```
forecast_audit/.venv/Scripts/python.exe revision_audit/evaluate.py volatility --out revision_audit/prompt3_volatility
forecast_audit/.venv/Scripts/python.exe score_audit/run.py --out revision_audit/prompt3_score --stage prepare
forecast_audit/.venv/Scripts/python.exe score_audit/run.py --out revision_audit/prompt3_score --stage select
forecast_audit/.venv/Scripts/python.exe score_audit/run.py --out revision_audit/prompt3_score --stage test
forecast_audit/.venv/Scripts/python.exe revision_audit/evaluate.py score --score-out revision_audit/prompt3_score --out revision_audit/prompt3_score_guard.json
forecast_audit/.venv/Scripts/python.exe revision_audit/run_prompt3.py
```

Use fresh output paths on replay; exact command vectors/exit codes are in
revision_audit/prompt3_score_commands.json and prompt3/commands.json.
All9 test suites ran110 tests:109 passed,1 retained zero-income volatility failure.
The legacy custom Node harness is separately rerun in prompt5.

Forward-CV macro-F1: .32435757244395846 -> .6033091202582729;
HIGH recall .72 -> .72; paired macro-F1 gain .2789515478143144 with95%CI
[.01340388007054677,.3380322580645161]. No target relabeling or test tuning.

The corrected hand scalar fails the existing guard on validation and test.
Validation AUC/Brier: .7565982192833907/.10562119502813373 versus calibrated
original .8143877335532124/.09733992341964837. Test:
.7646143812399299/.1121924118340255 versus .828172078762587/.099471363143902.
Production health is unchanged; score_decision.md explains the retained defect.
Learned risk models are outside the predeclared score-adoption guard.

Full before/after router outcomes for every scenario/mode/policy are in
revision_audit/prompt3_router_deltas.csv. Both versions use identical households,
shocks, accounting and seeds; raising the LOW cutoff changes stability scores
but leaves HIGH identification unchanged. The original gate in these comparisons
means original gate predicates using the currently supplied analytics, not a
frozen whole-system replay; baseline_results.json preserves the old whole system.
