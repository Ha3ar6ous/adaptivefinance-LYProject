# Development, testing, and research reproduction

[Overview](../README.md) · [Startup](../STARTUP.md) · [Architecture](ARCHITECTURE.md) · [Research evidence](RESEARCH.md)

## Find the relevant implementation

| Area | Source |
|---|---|
| Active frontend routes | [client/src/App.jsx](../client/src/App.jsx) and `client/src/modules/` |
| HTTP composition | [server/server.js](../server/server.js), `server/routes/`, `server/controllers/` |
| Persistence | [server/models/](../server/models) |
| Health and readiness | `server/services/healthScoreService.js`, `server/services/decisionRouterService.js` |
| Investment engine | `server/services/investmentEngineService.js` |
| Snapshot explanations and chat | `server/services/aiExplanationService.js`, `chatService.js`, `groqService.js` |
| Python service | [ml_service/app.py](../ml_service/app.py), `ml_service/modules/` |
| Backend unit/integration fixtures | [server/tests/](../server/tests) |
| Final research orchestration | [revision_audit/](../revision_audit) |

Use the active imports and mounted routes when making changes. Older page components and historical evaluation snapshots are also present and may not represent the current runtime.

## Application checks

After the dependency setup in [STARTUP.md](../STARTUP.md), run from the repository root:

```powershell
npm --prefix client run lint
npm --prefix client run build
npm --prefix server test
```

The server uses Node's built-in test runner. The frontend package currently has lint/build scripts but no dedicated automated frontend test script. A successful build is not a substitute for browser, database, or full-system testing.

To select the final audit's router integration fixture explicitly, set its environment variable before the server test command:

```powershell
$env:ROUTER_INTEGRATION_FIXTURES = (Resolve-Path 'revision_audit/final_20261018/integration_fixtures.json').Path
npm --prefix server test
Remove-Item Env:ROUTER_INTEGRATION_FIXTURES
```

Omit that override to use the test's default fixture location. Fixture availability matters when copying only application source to another machine.

## Separate scientific environment

The recorded research environment uses Python **3.11.9** with NumPy, pandas, SciPy, statsmodels, and scikit-learn. It is separate from the minimal Python application environment.

First-time setup only:

```powershell
py -3.11 -m venv forecast_audit/.venv
& ./forecast_audit/.venv/Scripts/python.exe -m pip install -r forecast_audit/requirements.txt
```

Use [requirements.txt](../forecast_audit/requirements.txt) for the pinned scientific dependencies and [environment.lock.txt](../forecast_audit/environment.lock.txt) for the recorded environment. Do not recreate an existing environment just to run tests.

Focused revision tests:

```powershell
& ./forecast_audit/.venv/Scripts/python.exe -m unittest discover -s revision_audit -p 'test_*.py' -v
```

Other research suites live in their respective audit directories. Run directory-specific discovery in separate processes: several scripts use generic module names such as `run`, so broad combined discovery can import the wrong module. Result-dependent suites also require their expected fixture/output paths. The archived final command logs below record the actual configuration used.

## Research protocols and replay

| Workstream | Protocol / record | Main tooling |
|---|---|---|
| Forecasting | [Frozen protocol](../forecast_audit/PROTOCOL.md), [change log](../CHANGES_forecast.md) | `forecast_audit/run.py`, `analyze.py` |
| Volatility | [Frozen protocol](../volatility_audit/PROTOCOL.md), [change log](../CHANGES_volatility.md) | `volatility_audit/run.py` |
| Router outcomes | [Simulation change log](../CHANGES_router.md) | `router_sim/simulate.py` |
| Score evaluation | [Score change log](../CHANGES_score.md), [selection decision](../score_decision.md) | `score_audit/run.py` |
| Data / transfer | [Provenance](../PROVENANCE.md), [data change log](../CHANGES_data.md) | `data_audit/run.py` |
| Engine / explanation | [Change log](../CHANGES_engine_llm.md) | `engine_llm_audit/` |
| Final revision / ablations | [Protocol](../revision_audit/PROTOCOL.md), [deployment log](../CHANGES_deployment.md) | `revision_audit/` |

The archived final run's exact commands are in [commands.json](../revision_audit/final_20261018/commands.json) and [legacy/commands.json](../revision_audit/final_20261018/legacy/commands.json). These are execution records, not a portable shell script: interpreter and output paths may be machine-specific.

Preserve train/validation/calibration/test separation and the recorded seeds. Select models and thresholds using validation only. Where randomness exists, keep the documented multiple-seed protocol. Preserve source/data hashes, rejected candidates, failures, and negative comparisons.

Existing results are immutable research records. Use a fresh, uniquely named output directory for a new run. Check each script's arguments and output behavior first. In particular:

- `revision_audit/run_final.py` uses fixed dated output locations and includes live provider evaluation. It is not a harmless quick check and is not safe to rerun into the occupied archive.
- Export and verification scripts also reference particular output trees and root exports. A new coordinated final run needs consistent new paths throughout orchestration, export, and verification.
- Live provider evaluation consumes requests, can incur charges or rate limits, and cannot guarantee exact response/latency replay. Local deterministic checks do not need provider credentials.
- Archived preservation checks may flag intentionally updated documentation such as this README. Compare the correct snapshot; do not rewrite historical manifests to hide drift.

A commit hash alone does not capture an audit run performed with a dirty working tree or untracked research files. Retain the source manifests and snapshots with the run. See [baseline_results.json](../baseline_results.json) for the captured baseline and [final_verification.json](../revision_audit/final_verification.json) for the dated final checks.

## Change discipline

Record material implementation or evaluation changes in `CHANGES_<task>.md`, including rationale, affected files, before/after results, commands, and unresolved failures. Keep secrets and private financial records out of logs. Do not change source behavior merely to improve reported numbers or silently replace original labels with derived targets.

The documentation revision is logged in [CHANGES_documentation.md](../CHANGES_documentation.md). It does not rerun benchmarks or alter application behavior.
