# GitHub publication — 2026-10-19

## Request and scope

Publish all current project changes to the configured GitHub repository on the existing `revision-ablations` branch. Include application fixes, automated tests, research scripts and archived results, baseline evidence, and rewritten documentation. Preserve 33 research execution logs that the generic `*.log` ignore rule would otherwise omit. Existing ignored credentials, dependencies, virtual environments, compiled builds, and disposable caches remain excluded.

## Validation and metrics

- Ran `npm --prefix server test`: 19 tests passed, zero failed, zero skipped.
- Historical research outputs were not rerun or edited. Their reported failures and limitations remain in the committed records.
- Inspected candidate file sizes: no individual file exceeds GitHub's 100 MiB ordinary-file limit.
- Checked candidate filenames and scanned file contents for common provider tokens, GitHub/cloud tokens, private keys, and credential-bearing MongoDB URLs. No matched credentials were found.
- Added `.gitattributes` for research archives, snapshots, and root numerical/table exports. With `core.autocrlf=true`, staged baseline JSON and result CSV/command JSON bytes differed from the originals. The scoped `-text` rules prevent newline conversion from invalidating their byte-based provenance hashes. Application source and original dataset contents were not changed for this adjustment.
- No model, configuration, or numerical result was changed for this publication task; before/after research metrics are unchanged.

## Reproduction / publication commands

From the repository root:

```powershell
git status --short
git branch --show-current
git remote -v
npm --prefix server test
git add --all
$researchLogs = git ls-files --others --ignored --exclude-standard --directory | Where-Object { $_ -match '^(baseline_replay_20261018|forecast_audit|paper_audit|revision_audit)/.*\.log$' }
if ($researchLogs) { git add -f -- $researchLogs }
git add --renormalize -- baseline_replay_20261018 data_audit engine_llm_audit forecast_audit paper_audit paper_results research_eval revision_audit router_sim score_audit volatility_audit baseline_results.json results_for_paper.json ablation_results.json ablation_table.tex paper_table_updates.tex
git diff --cached --stat
git commit -m "Publish research audits, safety fixes, tests, and project documentation"
git push --set-upstream origin revision-ablations
git status --short
git rev-parse HEAD
git ls-remote --heads origin revision-ablations
```

The final two commit hashes must match to verify remote publication. A clean working-tree check verifies no non-ignored changes remain unpublished. Source/data manifests inside archived runs retain their original pre-publication commit references; publishing them does not retroactively alter experiment provenance.
