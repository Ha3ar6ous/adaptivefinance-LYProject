"""Read-only Git/data provenance inventory, including deleted notebooks."""
import csv
import hashlib
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'revision_audit/provenance'


def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT).decode('utf-8')


def main():
    OUT.mkdir(parents=True, exist_ok=False)
    rows = []
    for p in sorted((ROOT / 'data').rglob('*')):
        if not p.is_file():
            continue
        path = p.relative_to(ROOT).as_posix()
        history = git('log', '--follow', '--format=%H|%aI|%an|%s', '--diff-filter=A', '--', path).splitlines()
        first = history[-1].split('|', 3) if history else [None] * 4
        with p.open(encoding='utf-8-sig') as f:
            data = list(csv.DictReader(f)) if p.suffix == '.csv' else []
        rows.append(dict(path=path, first_commit=first[0], author_date=first[1], author=first[2],
                         message=first[3], rows=len(data), bytes=p.stat().st_size,
                         filesystem_mtime_ns=p.stat().st_mtime_ns,
                         sha256=hashlib.sha256(p.read_bytes()).hexdigest()))
    notebooks, seen = [], set()
    for rev in git('rev-list', '--all', '--', '*.ipynb').splitlines():
        for file in git('ls-tree', '-r', '--name-only', rev).splitlines():
            if not file.endswith('.ipynb'):
                continue
            blob = git('rev-parse', rev + ':' + file).strip()
            if blob in seen:
                continue
            seen.add(blob)
            raw = git('show', rev + ':' + file)
            d = json.loads(raw)
            cells = [dict(index=i, source=''.join(c.get('source', [])))
                     for i, c in enumerate(d.get('cells', [])) if c.get('cell_type') == 'code']
            hits = [dict(cell=c['index'], line=line) for c in cells for line in c['source'].splitlines()
                    if re.search(r'kaggle|https?://|seed\(|default_rng|to_csv|read_csv|def.*generat|cv_to_label|CV_LOW|CV_HIGH', line, re.I)]
            notebooks.append(dict(revision=rev, file=file, blob=blob, cells=cells, hits=hits))
    evidence = dict(commit=git('rev-parse', 'HEAD').strip(), files=rows, notebook_versions=notebooks,
                    history=git('log', '--all', '--format=%H %aI %an %s', '--name-status', '--', 'data'))
    (OUT / 'evidence.json').write_text(json.dumps(evidence, indent=2), encoding='utf-8')
    text = ['# Data provenance', '', 'Audit scope: tracked data files, rename-following Git history, metadata, current documentation and all distinct notebook blobs reachable in Git. Notebook code was inspected, never executed. Filesystem times identify this checkout, not acquisition dates.', '',
            '| Current file | First addition (following renames) | Author date | Author | Rows |', '|---|---|---|---|---:|']
    for r in rows:
        text.append(f"| {r['path']} | {r['first_commit']} | {r['author_date']} | {r['author']} | {r['rows']} |")
    text += ['', '## Confirmed by repository evidence', '',
             '- The eleven normal CSVs first appeared at be15e0543528bab679e13397295d732f5aaf7077 (message: datasets added); commit0ee96f903e94d92e2546eca1db8e1d80671fce62 moved them unchanged into data/normal and added five volatility CSVs.',
             '- The deleted notebook 2volatilitymodel/volatility_classifier_2.ipynb is recoverable before5f79bfb7. Its code reads already-labeled platform files, computes grouped trailing7 sample standard deviations (initial undefined SD becomes0), divides by the corresponding means, and writes volatility_label_stat using CV cutoffs0.3/0.6. This is evidence for the statistical-label transformation, not for the original income or volatility_label origin. Numeric reconstruction is documented separately in the executed volatility audit.',
             '- Deleted forecasting notebooks load gig_income_data.csv for ARIMA experiments. Reading a named CSV does not establish who generated or collected it. All distinct historical notebook source cells and keyword hits are preserved in revision_audit/provenance/evidence.json.',
             '- Current server/seed_user.js uses unseeded Math.random to populate a MongoDB user with synthetic Swiggy earnings; it does not write the data/*.csv files. It is not a recovered CSV generator.',
             '- The newer data_audit/run.py generator is a separately authored seeded research dataset, not proof of provenance of the original CSVs. The licensed one-driver case under data_audit/results_20261017 has separate attribution and is not mixed into data/.', '',
             '## Unknown or unsupported', '',
             '- Original income-generation code, seeds, acquisition dates, named real workers, collection consent, source license and any row-level link to Kaggle remain unverified. Platform names and realistic-looking amounts do not establish platform authenticity.',
             '- The original volatility_label definition and generator remain unverified. The recovered statistical-label notebook starts with that column already present.',
             '- The paper and informal project notes mention Kaggle and external earnings benchmarks, but the tracked data/history do not supply a verifiable dataset identifier or transformation chain. Those statements are author assertions, not established provenance.', '',
             '## Team confirmation needed', '',
             '- Identify the person who created/downloaded each original CSV family and provide the original script/notebook, seed and execution environment.',
             '- Supply exact external dataset URLs/versions, licenses, acquisition dates, transformation steps and evidence linking them to these file hashes, if external data was used.',
             '- Explain the meaning of volatility_label and whether any rows represent observations of actual workers; confirm permission and de-identification where applicable.', '',
             '## Three-sentence paper-safe provenance statement', '',
             'The repository contains eleven platform-named daily-income CSVs and five related volatility CSVs, introduced in Git in July2026. Historical notebook code documents the seven-day statistical-label transformation, but does not establish the source of the underlying income values or original volatility labels. We therefore evaluate these files as unverified development datasets and report the separately generated synthetic data and attributed public single-driver case independently.']
    (ROOT / 'PROVENANCE.md').write_text('\n'.join(text) + '\n', encoding='utf-8')
    print(json.dumps(dict(files=len(rows), notebook_versions=len(notebooks), notebook_hits=[dict(file=n['file'], revision=n['revision'], hits=n['hits']) for n in notebooks]), indent=2))


if __name__ == '__main__':
    main()
