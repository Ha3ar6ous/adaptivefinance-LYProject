# Changes versus baseline_results.json

Prompts2–5 executed in order on revision-ablations. Baseline artifacts, original datasets/labels, archived results and the research paper remain unchanged. Full executed evidence and command logs are under revision_audit/.

- Provenance: recovered deleted notebooks and documented first file additions/renames; original income/original-label origin and seeds remain unverified.
- Deployed CV30 .45/.75: macro-F1 0.32435757244395846 -> 0.6033091202582729; HIGH recall remains0.72. Frozen forward targets/train terciles and selection remain unchanged; legacy .35 comparator is explicitly named.
- Corrected hand health scalar fails validation and test guard, so production health remains unchanged. See score_decision.md and the guard JSON; diagnostic fitted risk models are not silently deployed as health scores.
- Router simulation now consumes deployed volatility, changing some original/score-only gate outcomes; the full gate outcomes remain unchanged in the measured cohorts. Per-scenario deltas are in prompt3_router_deltas.csv. The optional simulator callback changes no existing policy/accounting default.
- New ablations retain50000 unique households, five seeds, all scenarios/budget modes and5000-draw paired platform bootstrap. Full gate has no measured incremental score contribution. It loses to matched savings ranking and beats matched random on central forced sales; monthly clearance matching does not match actual investing.
- Forecast, investment allocator and explanation logic are unchanged; full benchmarks were reexecuted. API outcomes/latency are new run-dependent measurements, not deterministic improvement.
- Tests: baseline 126/130 passed; current 138/142 passed, 4 failures, 0 errors. Twelve added revision tests; existing failures remain visible.

## Required consistency checks

- **table_VI_wealth_vs_text: FAIL** — {"status": "FAIL", "reason": "No updated manuscript supplied; preserved RESULTS_FOR_PAPER.md quotes the older whole-system wealth difference. Generated snippets use the corrected current value.", "table_VI_original_wealth": 52075.12115931623, "table_VI_revised_wealth": 52052.45638158225, "recomputed_revised_minus_original": -22.66477773398219, "preserved_quoted_value": -21.218564925089595, "preserved_text_matches": false, "preserved_text_source": "RESULTS_FOR_PAPER.md: Router simulation central / final_net_wealth", "generated_text_value": -22.66477773398219, "generated_text_matches": true}
- **volatility_gain_inside_paired_ci: PASS** — {"status": "PASS", "point_gain": 0.2789515478143144, "lower95": 0.01340388007054677, "upper95": 0.3380322580645161, "recomputation": "Paired5000-draw whole-platform bootstrap was recomputed from saved target/prediction rows in revision_audit/evaluate.py; not adjusted to force inclusion."}
- **count_derived_percentages: PASS** — {"status": "PASS", "count_derived_percentages_checked": 665, "interval_fractions_independently_checked": 18, "failures": [], "configuration_note": "Nominal coverage, CI confidence and weight/intervention settings are configuration values. sMAPE averages relative errors, not a binary event count."}
- **test_suite_counts: PASS** — {"status": "PASS", "values": {"total": 142, "passed": 138, "failed": 4, "errors": 0, "skipped": 0}, "all_tests_passed": false}

Full before/after current-versus-baseline numeric comparisons: revision_audit/final_20261018/before_after_headlines.csv.

## Strongest defensible contribution

An auditable decision pipeline with explicit failure handling, empirically evaluated constraints and honest conditional simulation trade-offs. The ablations support a contribution from volatility/debt gating under these assumptions, but not an incremental health-score benefit, general superiority to liquidity ranking, real-world safety, optimal cutoffs, profitable investments or validated user comprehension.

Use results_for_paper.json for current numbers and paper_table_updates.tex/ablation_table.tex for snippets. Table numbering is an export proposal: the supplied original PDF has no simulation wealth in TableVI. The stale preserved narrative is flagged FAIL until an updated manuscript is available and revised; it was not edited.
