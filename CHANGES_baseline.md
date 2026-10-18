# Baseline reproduction log

Branch: `revision-ablations`. Commit: `db3fc1d56a8f38042a91e21ec6164ac8be0dfe40`. The working tree was already dirty; source SHA-256 values are in baseline_results.json and baseline_replay_20261018/initial_manifest.json.

## Scope and files

Ran the existing forecasting, volatility, router simulator, score, data, engine/LLM, legacy experiments, coverage and test suites. Only new baseline artifacts were written; no existing source, dataset, label, paper or archived result was edited. Existing runners without output-directory arguments ran with in-memory output-path redirection only. Existing source and archived result files remain unchanged. `prompts.md` changed concurrently; no executed runner writes it, and its new contents were preserved. Both hashes are recorded. No tasks from its new contents were executed.

Primary deliverable: `baseline_results.json`. Supporting outputs, logs, source hashes and reproduction drivers are under `baseline_replay_20261018/`.

## Original versus replay

- CSV comparisons: 107; exact 102; different 5. Every difference in these tables is timing or live API outcome/latency; deterministic metric differences: 0.
- Compared 246237 numeric CSV cells. Preserved the full 71-row paper-facing ledger and every headline source table.
- Forecast, volatility, router, score (default-thread environment), data and engine numerical results reproduce exactly. All nine archived fixture objects reproduce exactly. Five new synthetic datasets regenerate identically after newline normalization.
- Single-thread score sensitivity replay: 72 floating-point differences retained. The separate default-thread replay matches all nine archived score CSVs exactly; no models or metrics were changed.
- API success: 106/125 -> 109/125; fallback: 19 -> 16. All fresh failures were HTTP429. Latency mean: 392.2042816000014 -> 450.54289679999954ms; p95: 570.3130400000023 -> 691.6535199999997ms. These are new measurements, not exact deterministic reproduction.
- Supplied PDF Tables IV/V reproduce at published precision. Table VI original ideal fixture changes allowed=true to false because it lacks required analytics; 3/4 original outcomes reproduce. The complete current-policy matrix still reproduces zero false allows/blocks over1914 cases. The supplied PDF contains no Tables VIII-X; later audit tables are separately captured.
- Paper Table VII timing inequalities are not immutable numeric baselines. Actual valid-input pipeline: mean0.7369316000000004ms, p951.2201ms, maximum2.6566ms. Its maximum exceeds2ms; do not claim every call is below2ms.
- Unique test executions: 130; passed126; failed4; errors0. No skipped tests. Duplicate report-triggered test executions are excluded from these totals.

## Retained failures

- retained_python: test_zero_income_is_not_low_risk (evaluate_python.CoreTests.test_zero_income_is_not_low_risk)
- retained_node_harness: score income-sensitive with all other factors fixed
- retained_node_harness: router exact implemented truth table
- retained_node_harness: fallback detects falling and rising forecasts

The legacy router truth-table check expects the former permissive policy and uses incomplete synthetic_control analytics; that mismatch is not evidence of current-policy false blocks. The other retained checks expose zero-income volatility, income-insensitive health scoring, and forecast-direction fallback behavior. No fixes were authorized in this step.

## Exact commands and provenance

All executed command vectors, environment overrides, exit codes and log paths are in baseline_results.json: executed_commands. Full orchestration code is preserved as text in reproduce_main.txt, reproduce_legacy.txt, reproduce_score_default.txt and reproduce_collect.txt under baseline_replay_20261018. Use a new output prefix before replay: every experiment uses exclusive writes. Running against these occupied output directories is intentionally rejected.

The score default-thread replay removes OMP_NUM_THREADS, OPENBLAS_NUM_THREADS and MKL_NUM_THREADS overrides. The initial sensitivity run set each to1. Scientific Python, Node, package versions, fixed seeds, data hashes and split/configuration objects are in baseline_results.json. Original dataset generation seeds remain unknown. No test-set tuning or source changes occurred.

No existing result was replaced. The current full-precision measurements and all negative outcomes remain available.
