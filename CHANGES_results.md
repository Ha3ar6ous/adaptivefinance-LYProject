# Consolidated results log

Read all six task CHANGES logs; extracted 71 measured comparisons/after-only rows from executed CSV/JSON sources. No models/API rerun or earlier results edited. Added paper_results/build.py and plot.py; generated RESULTS_FOR_PAPER.md plus full-precision CSVs and standard matplotlib PNGs. References vs research comparators are explicitly not deployments. Negatives, conditional CIs, changed targets, unknown provenance and live rate limits remain. Numeric values come from source files; NA is not zero.

Reproduce consolidation: forecast_audit/.venv/Scripts/python.exe paper_results/build.py --out paper_results/reproduction --report paper_results/reproduction/RESULTS_FOR_PAPER.md; run bundled Python paper_results/plot.py --out paper_results/reproduction. Plot dependencies come from the read-only bundled workspace runtime; no install.

Plot environment repair: the initial bundled Python3.12 attempt imported an
incomplete user Matplotlib and failed (missing pyparsing; fontTools/kiwisolver also
absent). No PNG/output directory had been written. The preceding no-install plan
was not executable. Use a separate paper_results/.plot_venv with the pinned
plot_requirements.txt; these dependencies are necessary for the requested scientific
PNGs and do not change production or the scientific experiment environment.
Model metrics are not recomputed. Exact repair/reproduction commands:

```powershell
forecast_audit/.venv/Scripts/python.exe -m venv paper_results/.plot_venv
paper_results/.plot_venv/Scripts/python.exe -m pip install -r paper_results/plot_requirements.txt
paper_results/.plot_venv/Scripts/python.exe paper_results/plot.py --out paper_results/results_20261017
```

The build source manifest records logs at pre-render time; a final completion
manifest records this appended repair and figure inputs. No numerical result is
changed. Full plotting dependency lock will be saved after installation.

A second render attempt started before the isolated installation completed and
failed at import (Matplotlib not installed yet). No figure files were written.
Wait for pip completion before rendering; both setup failures are retained here.

Completed: isolated Matplotlib3.10.7 environment installed successfully; six
full-resolution scientific PNGs plus a QA contact sheet rendered and visually
inspected. Full transitive pins: paper_results/plot_environment.lock.txt. Prefer
that lock for future installs; plotting does not rerun model metrics. Added
paper_results/verify.py for arithmetic, previous-file preservation, PNG integrity
and secret-pattern checks. Full table has71 rows (including negative and after-only
measurements); this sequence's test logs record6 score+19 Node+7 data=32 passing
checks, no final failures. Old forecast/volatility/router tests remain dated
historical results. Source manifests distinguish pre-render logs from this final
append and retain both setup failures; no existing experiment metric was edited.
