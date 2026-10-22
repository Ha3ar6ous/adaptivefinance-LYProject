# Documentation revision — 2026-10-19

## What and why

Rebuilt the project overview from the active application and latest completed research audit. The former README mixed outdated implementation plans, obsolete routes and policy descriptions, setup instructions, and historical research numbers. It also treated the constrained explanation path and free-form chat too similarly.

The new structure provides one maintained overview, a separate startup/run guide, and focused references for behavior, APIs, development, and research evidence. Existing report files remain historical records; the guide identifies the latest numerical export and flags the known stale wealth narrative.

## Files

- `README.md`: new project overview, capability summary, system diagram, repository map, and documentation navigation.
- `STARTUP.md`: installation, environment variables, separate service commands, liveness checks, first-use workflow, build/preview, and troubleshooting.
- `docs/ARCHITECTURE.md`: current formulas, thresholds, persistence, orchestration, and separate AI failure boundaries.
- `docs/API.md`: mounted routes, authentication, request examples, response wrappers, and error semantics.
- `docs/DEVELOPMENT.md`: application checks, scientific environment, protocols, command archives, preservation and replay constraints.
- `docs/RESEARCH.md`: dated evidence index, selected verified metrics, negative findings, deployment distinctions, and limitations.
- `README2.md` and `localrun_steps.md`: compatibility entry points linking to maintained documentation.
- `CHANGES_documentation.md`: this change record.

## Behavior and metrics

No application, model, test, dependency, dataset, experiment output, or paper changes are part of this documentation task. Before/after experimental metrics are unchanged; quoted results are from the completed 2026-10-18 audit, not a new run. Existing unrelated working-tree modifications were retained.

## Verification

Documentation was checked against package scripts, Python requirements/request models, Express route mounts/controllers, current algorithms, frontend routes/API addresses, and saved CSV/JSON results. The nine documentation files passed checks of 116 local links, linked headings, balanced code fences, and trailing whitespace. Quoted forecast, volatility, engine, explanation, and test numbers were checked against their CSV/JSON sources. Package scripts and referenced experiment entry points were checked for existence.

Working-tree status before and after the revision shows the same pre-existing application-source modifications; this task wrote only the documentation files listed above. A broad non-Markdown hash scan was stopped before completion, so no whole-tree hash-preservation claim is made from that scan.

No dependency installation, benchmark replay, provider request, database seed/reset, application build, or application test suite was needed for this documentation-only revision. The research guide reports the archived test failures rather than presenting those results as a new green run.

## Reproduce the documentation review

From the repository root, inspect the documented commands and route definitions:

```powershell
Get-Content client/package.json
Get-Content server/package.json
Get-Content ml_service/requirements.txt
Get-Content server/server.js
Get-Content ml_service/app.py
Get-Content client/src/App.jsx
rg -n 'router\.(get|post)|process\.env|localhost:5000' server/routes server/services server/config client/src
Get-Content revision_audit/final_verification.json
Get-Content revision_audit/final_20261018/forecast/test_pooled.csv
Get-Content revision_audit/final_20261018/volatility/final_tables/pooled_model_comparison.csv
Get-Content revision_audit/final_20261018/engine/engine_summary.csv
Get-Content revision_audit/final_20261018/engine/live_summary.csv
git diff --check -- README.md README2.md localrun_steps.md
```

These commands read the implementation and archived evidence; they do not rerun experiments. Markdown references are relative to each containing document so repository navigation remains portable.
